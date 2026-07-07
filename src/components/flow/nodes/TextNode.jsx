import React from "react";
import { Handle, NodeResizer, Position } from "reactflow";

const handleStyle = {
  width: 12,
  height: 12,
  background: "white",
  border: "2px solid #48abb3",
};

const resizeHandleStyle = {
  width: 14,
  height: 14,
  borderRadius: 4,
  border: "2px solid white",
  background: "#48abb3",
};

const resizeLineStyle = {
  borderColor: "white",
};

function getNodeSize(data) {
  return {
    width: Number(data.width) || 240,
    height: Number(data.height) || 170,
  };
}

export default function TextNode({ id, data, selected }) {
  const size = getNodeSize(data);

  return (
    <div
      style={{
        position: "relative",
        width: size.width,
        height: size.height,
        padding: 10,
        borderRadius: 8,
        background: "#48abb3",
        color: "white",
        border:
          data.isEdgeSource || data.isSelected
            ? "2px solid white"
            : "1px solid rgba(255,255,255,0.3)",
        boxShadow: data.edgeMode ? "0 0 0 2px rgba(255,255,255,0.18)" : "none",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <NodeResizer
        isVisible={selected || data.isSelected}
        minWidth={180}
        minHeight={120}
        maxWidth={520}
        maxHeight={520}
        handleStyle={resizeHandleStyle}
        lineStyle={resizeLineStyle}
        onResize={(_, params) => {
          data.onChange(id, {
            width: Math.round(params.width),
            height: Math.round(params.height),
          });
        }}
      />

      <Handle type="target" position={Position.Left} style={handleStyle} />

      <div
        className="node-drag-handle"
        title="Arrastar nó"
        style={{
          minHeight: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          background: "rgba(255,255,255,0.14)",
          color: "rgba(255,255,255,0.85)",
          fontSize: 12,
          letterSpacing: "0.04em",
          cursor: "grab",
          userSelect: "none",
          touchAction: "none",
        }}
      >
        arrastar
      </div>

      <textarea
        className="nodrag"
        value={data.label || ""}
        onChange={(e) => {
          data.onChange(id, { label: e.target.value });
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        placeholder="Digite..."
        style={{
          width: "100%",
          flex: 1,
          minHeight: 0,
          resize: "none",
          overflow: "auto",
          border: "none",
          background: "transparent",
          color: "white",
          outline: "none",
          fontFamily: "inherit",
          fontSize: 16,
          lineHeight: 1.35,
          boxSizing: "border-box",
        }}
      />

      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  );
}
