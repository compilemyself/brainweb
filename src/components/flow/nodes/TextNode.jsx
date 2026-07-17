import React, { useRef } from "react";
import { Handle, NodeResizer, Position } from "reactflow";

const handleStyle = {
  width: 20,
  height: 20,
  background: "white",
  border: "3px solid #48abb3",
  zIndex: 24,
  touchAction: "none",
};

const resizeHandleStyle = {
  width: 22,
  height: 22,
  borderRadius: 6,
  border: "3px solid white",
  background: "#48abb3",
  touchAction: "none",
};

const resizeLineStyle = {
  borderColor: "white",
  borderWidth: 2,
};

const textBaseStyle = {
  fontFamily: "inherit",
  fontSize: 16,
  lineHeight: "22px",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

function getNodeSize(data) {
  return {
    width: Number(data.width) || 240,
    height: Number(data.height) || 170,
  };
}

function getLineStyle(line) {
  if (line.startsWith(">")) {
    return { color: "#8af29b", fontSize: 15 };
  }

  if (line.startsWith("<")) {
    return { color: "#ff9999", fontSize: 15 };
  }

  if (line.startsWith("-")) {
    return { color: "rgba(235,242,243,0.68)", fontSize: 15 };
  }

  return { color: "white", fontSize: 16 };
}

function HighlightedText({ value, scrollRef }) {
  const lines = value.split("\n");

  return (
    <div
      ref={scrollRef}
      aria-hidden="true"
      style={{
        ...textBaseStyle,
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {value ? (
        lines.map((line, index) => (
          <div
            key={`${index}-${line.slice(0, 12)}`}
            style={{
              minHeight: 22,
              ...getLineStyle(line),
            }}
          >
            {line || "\u00a0"}
          </div>
        ))
      ) : (
        <div style={{ minHeight: 22, color: "rgba(255,255,255,0.48)" }}>
          Digite...
        </div>
      )}
    </div>
  );
}

export default function TextNode({ id, data, selected }) {
  const size = getNodeSize(data);
  const highlightedTextRef = useRef(null);

  return (
    <div
      style={{
        position: "relative",
        width: size.width,
        height: size.height,
        padding: 10,
        boxSizing: "border-box",
        borderRadius: 8,
        background: "#48abb3",
        color: "white",
        border: data.isEdgeSource
          ? "3px solid #baf7c2"
          : data.isSelected
            ? "2px solid white"
            : "1px solid rgba(255,255,255,0.3)",
        boxShadow: data.edgeMode
          ? "0 0 0 4px rgba(186,247,194,0.18)"
          : "none",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <NodeResizer
        isVisible={selected || data.isSelected}
        minWidth={120}
        minHeight={84}
        maxWidth={900}
        maxHeight={900}
        handleStyle={resizeHandleStyle}
        lineStyle={resizeLineStyle}
        onResizeStart={() => data.onResizeStart?.()}
        onResize={(_, params) => {
          data.onResize(id, {
            width: Math.round(params.width),
            height: Math.round(params.height),
          });
        }}
        onResizeEnd={() => data.onResizeEnd?.()}
      />

      <Handle type="target" position={Position.Left} style={handleStyle} />

      <div
        className="node-drag-handle"
        title="Arrastar nó"
        style={{
          minHeight: 30,
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
          flexShrink: 0,
        }}
      >
        arrastar
      </div>

      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <HighlightedText
          value={data.label || ""}
          scrollRef={highlightedTextRef}
        />

        <textarea
          className="nodrag"
          value={data.label || ""}
          onChange={(event) => {
            data.onChange(id, { label: event.target.value });
          }}
          onBlur={() => data.onEditEnd?.()}
          onScroll={(event) => {
            if (!highlightedTextRef.current) return;
            highlightedTextRef.current.scrollTop = event.currentTarget.scrollTop;
            highlightedTextRef.current.scrollLeft = event.currentTarget.scrollLeft;
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          placeholder="Digite..."
          spellCheck
          style={{
            ...textBaseStyle,
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            resize: "none",
            overflow: "auto",
            border: "none",
            background: "transparent",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            caretColor: "white",
            outline: "none",
            padding: 0,
            boxSizing: "border-box",
          }}
        />
      </div>

      <Handle type="source" position={Position.Right} style={handleStyle} />

      {data.edgeMode && (
        <div
          className="nodrag"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            borderRadius: 8,
            background: data.isEdgeSource
              ? "rgba(186,247,194,0.13)"
              : "rgba(255,255,255,0.025)",
            cursor: "crosshair",
            touchAction: "manipulation",
          }}
        />
      )}
    </div>
  );
}
