import React, { useEffect, useRef } from "react";
import { Handle, Position } from "reactflow";

const handleStyle = {
  width: 12,
  height: 12,
  background: "white",
  border: "2px solid #48abb3",
};

function AutoResizeTextarea({ value, onChange }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      className="nodrag"
      value={value}
      onChange={onChange}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      placeholder="Digite..."
      rows={1}
      style={{
        width: "100%",
        minHeight: 70,
        resize: "none",
        overflow: "hidden",
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
  );
}

export default function TextNode({ id, data }) {
  return (
    <div
      style={{
        position: "relative",
        padding: 10,
        borderRadius: 8,
        background: "#48abb3",
        color: "white",
        minWidth: 180,
        maxWidth: 320,
        border:
          data.isEdgeSource || data.isSelected
            ? "2px solid white"
            : "1px solid rgba(255,255,255,0.3)",
        boxShadow: data.edgeMode ? "0 0 0 2px rgba(255,255,255,0.18)" : "none",
      }}
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />

      <AutoResizeTextarea
        value={data.label || ""}
        onChange={(e) => {
          data.onChange(id, { label: e.target.value });
        }}
      />

      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  );
}