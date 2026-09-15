import React from "react";
import { Handle, NodeResizer, Position } from "reactflow";

export default function ImageNode({ id, data }) {
  const editing = !!data.editing;
  const width = Number(data.width) || 240;
  const height = Number(data.height) || 190;
  const src = data.src || data.url || "";

  return (
    <div
      className="bw-node"
      style={{
        width,
        height,
        padding: editing ? 8 : 10,
        background: "var(--bw-accent, #48abb3)"
      }}
    >
      {editing && (
        <NodeResizer
          isVisible
          minWidth={120}
          minHeight={96}
          keepAspectRatio
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

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          borderRadius: 6,
          background: "rgba(15,47,51,.34)"
        }}
      >
        {src ? (
          <img
            src={src}
            alt={data.label || "Imagem"}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "contain"
            }}
          />
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,.75)"
            }}
          >
            Imagem não selecionada
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="bw-node-handle" />
    </div>
  );
}