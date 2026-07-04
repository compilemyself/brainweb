import React from "react";
import { Handle, Position } from "reactflow";
import exemplo from "../../../assets/exemplo.png";

const handleStyle = {
  width: 12,
  height: 12,
  background: "white",
  border: "2px solid #48abb3",
};

export default function ImageNode({ data }) {
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
        <img
          src={exemplo}
          alt="Imagem"
          draggable={false}
          style={{
            width: "100%",
            display: "block",
          }}
        />
      </div>

      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  );
}