import React from "react";
import NodeResizeControls from "./NodeResizeControls";
import Handles from "./Handles";

export default function ImageNode({ id, data }) {
  const editing = !!data.editing;
  const src = data.src || data.url || "";
  const width = Number(data.width) || 240;
  const height = Number(data.height) || 190;
  const ratio = (Number(data.naturalWidth) || 0) / (Number(data.naturalHeight) || 1);
  const distorted = ratio > 0 && Math.abs((width / height) - ratio) > 0.02;
  const freeResize = !!data.imageDeformable;

  return (
    <div
      className="bw-node bw-image-node"
      style={{
        width,
        height,
        padding: editing ? 6 : 4,
        background: "var(--bw-accent,#48abb3)"
      }}
    >
      {editing && (
        <NodeResizeControls id={id} data={data} width={width} height={height} minWidth={40} minHeight={40} keepAspectRatio={!freeResize} />
      )}
      <Handles />
      {editing && <div className="node-drag-handle bw-node-dragbar">editar</div>}
      {distorted && <span className="bw-image-distorted" title="Imagem fora da proporção original">↗</span>}
      {src ? (
        <img
          src={src}
          alt={data.label || "Imagem"}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: freeResize ? "fill" : "contain",
            objectPosition: "center",
            background: "rgba(0,0,0,.08)",
            borderRadius: 4
          }}
        />
      ) : (
        <div className="bw-image-empty">Imagem não selecionada</div>
      )}
    </div>
  );
}