import React from "react";
import { Handle, Position } from "reactflow";

const handleStyle = {
  width: 12,
  height: 12,
  background: "white",
  border: "2px solid #48abb3",
};

export default function ImageNode({ data }) {
  const imageSrc = data.src || data.url || "";

  return (
    <div
      style={{
        position: "relative",
        width: 180,
        background: "#48abb3",
        borderRadius: 8,
        overflow: "visible",
        border:
          data.isEdgeSource || data.isSelected
            ? "2px solid white"
            : "1px solid rgba(255,255,255,.3)",
        boxShadow: data.edgeMode ? "0 0 0 2px rgba(255,255,255,0.18)" : "none",
      }}
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />

      <div style={{ overflow: "hidden", borderRadius: 8 }}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={data.label || "Imagem"}
            draggable={false}
            style={{
              width: "100%",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              minHeight: 120,
              padding: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              color: "rgba(255,255,255,0.82)",
              fontSize: 13,
            }}
          >
            Imagem não selecionada
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  );
}
