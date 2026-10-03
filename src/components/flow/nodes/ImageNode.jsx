import React from "react";
import { NodeResizer } from "reactflow";
import Handles from "./Handles";

export default function ImageNode({ id, data }) {
  const editing=!!data.editing, src=data.src||data.url||"";
  const width=Number(data.width)||240, height=Number(data.height)||190;
  const ratio=(Number(data.naturalWidth)||0)/(Number(data.naturalHeight)||1);
  const distorted=ratio>0 && Math.abs((width/height)-ratio)>0.02;
  const freeResize=!!data.imageDeformable;
  return <div className="bw-node bw-image-node" style={{width,height,padding:editing?6:0,background:"transparent",borderColor:"rgba(255,255,255,.25)"}}>
    {editing && <NodeResizer isVisible minWidth={40} minHeight={40} keepAspectRatio={!freeResize} handleStyle={{opacity:0}} onResizeStart={()=>data.onResizeStart?.()} onResize={(_,p)=>data.onResize?.(id,{width:Math.round(p.width),height:Math.round(p.height)})} onResizeEnd={()=>data.onResizeEnd?.()} />}
    <Handles />
    {editing && <div className="node-drag-handle bw-node-dragbar">arrastar</div>}
    {distorted && <span className="bw-image-distorted" title="Imagem fora da proporção original">↗</span>}
    {src ? <img src={src} alt={data.label||"Imagem"} draggable={false} style={{width:"100%",height:"100%",display:"block",objectFit:"fill",borderRadius:6}} /> : <div className="bw-image-empty">Imagem não selecionada</div>}
  </div>;
}