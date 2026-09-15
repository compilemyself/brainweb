import React, { useRef } from "react";
import { Handle, NodeResizer, Position } from "reactflow";

const textBaseStyle = {
  fontFamily: "inherit",
  fontSize: 16,
  lineHeight: "22px",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  wordBreak: "break-word"
};

const lineStyles = {
  normal: { color: "white", fontSize: 16 },
  quote: { color: "#d7fff0", fontSize: 15.5, fontWeight: 600 },
  red: { color: "#ffd5d5", fontSize: 15.5, fontWeight: 600 },
  gray: { color: "rgba(235,242,243,.72)", fontSize: 15.5, fontStyle: "italic" },
  separator: { color: "transparent", fontSize: 6 }
};

function getLineStyle(line) {
  if (line === "---") return lineStyles.separator;
  if (line.startsWith(">")) return lineStyles.quote;
  if (line.startsWith("<")) return lineStyles.red;
  if (line.startsWith("-")) return lineStyles.gray;
  return lineStyles.normal;
}

function Line({ line }) {
  if (line === "---") {
    return (
      <div style={{ height: 14, display: "flex", alignItems: "center" }}>
        <span
          style={{
            width: "100%",
            height: 1,
            background: "rgba(255,255,255,.45)"
          }}
        />
      </div>
    );
  }

  return <div style={{ minHeight: 22, ...getLineStyle(line) }}>{line || "\u00a0"}</div>;
}

function getNodeSize(data) {
  return {
    width: Number(data.width) || 240,
    height: Number(data.height) || 170
  };
}

export default function TextNode({ id, data }) {
  const size = getNodeSize(data);
  const highlightedRef = useRef(null);
  const editing = !!data.editing;

  return (
    <div
      className="bw-node"
      style={{
        width: size.width,
        height: size.height,
        padding: editing ? 10 : 12,
        background: "var(--bw-accent, #48abb3)"
      }}
    >
      {editing && (
        <NodeResizer
          isVisible
          minWidth={120}
          minHeight={84}
          lineStyle={{
            borderColor: "rgba(255,255,255,.75)",
            borderWidth: 1
          }}
          handleStyle={{ opacity: 0 }}
          onResizeStart={() => data.onResizeStart?.()}
          onResize={(_, p) =>
            data.onResize?.(id, {
              width: Math.round(p.width),
              height: Math.round(p.height)
            })
          }
          onResizeEnd={() => data.onResizeEnd?.()}
        />
      )}

      <Handle type="target" position={Position.Left} className="bw-node-handle" />

      {editing && (
        <div className="node-drag-handle bw-node-dragbar">arrastar</div>
      )}

      <div style={{ position: "relative", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <div
          ref={highlightedRef}
          aria-hidden="true"
          style={{
            ...textBaseStyle,
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none"
          }}
        >
          {(data.label || "").split("\n").map((line, i) => (
            <Line key={`${i}-${line.slice(0, 10)}`} line={line} />
          ))}
          {!data.label && (
            <div style={{ color: "rgba(255,255,255,.5)" }}>Digite...</div>
          )}
        </div>

        {editing && (
          <textarea
            className="nodrag nowheel"
            autoFocus
            value={data.label || ""}
            onChange={(e) => data.onChange?.(id, { label: e.target.value })}
            onScroll={(e) => {
              if (highlightedRef.current) {
                highlightedRef.current.scrollTop = e.currentTarget.scrollTop;
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
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
              padding: 0
            }}
          />
        )}
      </div>

      <Handle type="source" position={Position.Right} className="bw-node-handle" />
    </div>
  );
}