import React, { useRef } from "react";
import { NodeResizer } from "reactflow";
import Handles from "./Handles";
import { MarkdownLine } from "../markdown";

const COLORS = { default: "var(--bw-accent, #48abb3)", green: "#34d46a", yellow: "#f1d44b", red: "#f05252", white: "#ffffff", transparent: "rgba(255,255,255,.30)" };
export default function TextNode({ id, data }) {
  const editing = !!data.editing; const size = { width: Number(data.width)||240, height: Number(data.height)||170 };
  const highlightedRef = useRef(null); const label = data.label || "";
  return <div className="bw-node" style={{ ...size, padding: editing?10:12, background: COLORS[data.textColor] || COLORS.default }}>
    {editing && <NodeResizer isVisible minWidth={120} minHeight={84} handleStyle={{opacity:0}} onResizeStart={()=>data.onResizeStart?.()} onResize={(_,p)=>data.onResize?.(id,{width:Math.round(p.width),height:Math.round(p.height)})} onResizeEnd={()=>data.onResizeEnd?.()} />}
    <Handles />
    {editing && <div className="node-drag-handle bw-node-dragbar">arrastar</div>}
    <div style={{position:"relative",flex:1,minHeight:0,overflow:"hidden"}}>
      <div ref={highlightedRef} className="bw-markdown" aria-hidden="true">{label.split("\n").map((line,i)=><MarkdownLine key={i} line={line} primary={COLORS.default}/>)}</div>
      {editing && <textarea className="nodrag nowheel" autoFocus value={label} onChange={e=>data.onChange?.(id,{label:e.target.value})} onScroll={e=>{if(highlightedRef.current) highlightedRef.current.scrollTop=e.currentTarget.scrollTop}} onPointerDown={e=>e.stopPropagation()} style={{position:"absolute",inset:0,width:"100%",height:"100%",resize:"none",overflow:"auto",border:0,background:"transparent",color:"transparent",WebkitTextFillColor:"transparent",caretColor:"white",outline:0,padding:0}} />}
    </div>
  </div>;
}