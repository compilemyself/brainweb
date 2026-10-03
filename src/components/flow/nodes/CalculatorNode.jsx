import React from "react";
import { NodeResizer } from "reactflow";
import Handles from "./Handles";
export default function CalculatorNode({id,data}){const editing=!!data.editing;return <div className="bw-node bw-calculator-node" style={{width:Number(data.width)||260,height:Number(data.height)||340,padding:editing?8:4,background:"var(--bw-accent,#48abb3)"}}>
 {editing&&<NodeResizer isVisible minWidth={230} minHeight={315} keepAspectRatio handleStyle={{opacity:0}} onResizeStart={()=>data.onResizeStart?.()} onResize={(_,p)=>data.onResize?.(id,{width:Math.round(p.width),height:Math.round(p.height)})} onResizeEnd={()=>data.onResizeEnd?.()}/>}<Handles/>{editing&&<div className="node-drag-handle bw-node-dragbar">arrastar</div>}
 <iframe title="Calculadora" width="219" height="302" src="https://calculator-1.com/outdoor/?f=dedede&r=ffffff" scrolling="no" frameBorder="0" style={{maxWidth:"100%"}}/><a className="bw-calculator-link" href="https://calculator-1.com/" target="_blank" rel="noreferrer">The Best Free Online Calculator - Calculator-1.com</a>
</div>}