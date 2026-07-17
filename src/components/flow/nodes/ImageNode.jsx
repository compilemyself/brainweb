import React from "react";
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

function getNodeSize(data) {
  return {
    width: Number(data.width) || 240,
    height: Number(data.height) || 190,
  };
}

export default function ImageNode({ id, data, selected }) {
  const imageSrc = data.src || data.url || "";
  const size = getNodeSize(data);

  return (
    <div
      style={{
        position: "relative",
        width: size.width,
        height: size.height,
        padding: 8,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 7,
        background: "#48abb3",
        borderRadius: 8,
        overflow: "visible",
        border: data.isEdgeSource
          ? "3px solid #baf7c2"
          : data.isSelected
            ? "2px solid white"
            : "1px solid rgba(255,255,255,.3)",
        boxShadow: data.edgeMode
          ? "0 0 0 4px rgba(186,247,194,0.18)"
          : "none",
      }}
    >
      <NodeResizer
        isVisible={selected || data.isSelected}
        minWidth={120}
        minHeight={96}
        maxWidth={1000}
        maxHeight={1000}
        keepAspectRatio
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
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          borderRadius: 6,
          background: "rgba(15,47,51,0.34)",
        }}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={data.label || "Imagem"}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "contain",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              minHeight: 48,
              padding: 10,
              boxSizing: "border-box",
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
