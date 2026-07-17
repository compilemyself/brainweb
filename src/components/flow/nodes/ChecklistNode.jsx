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

const smallButtonStyle = {
  border: "1px solid rgba(255,255,255,0.45)",
  borderRadius: 6,
  background: "rgba(255,255,255,0.14)",
  color: "white",
  cursor: "pointer",
  minHeight: 34,
  touchAction: "manipulation",
};

function generateItemId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getChecklistItems(data) {
  if (Array.isArray(data.items) && data.items.length > 0) {
    return data.items;
  }

  return [
    {
      id: "legacy-item",
      label: data.label || "Novo item",
      checked: !!data.checked,
    },
  ];
}

function getNodeSize(data) {
  return {
    width: Number(data.width) || 260,
    height: Number(data.height) || 220,
  };
}

export default function ChecklistNode({ id, data, selected }) {
  const items = getChecklistItems(data);
  const size = getNodeSize(data);

  const updateItems = (nextItems) => {
    data.onChange(id, { items: nextItems });
  };

  const updateItem = (itemId, partialItem) => {
    updateItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...partialItem,
            }
          : item
      )
    );
  };

  const addItem = () => {
    updateItems(
      items.concat({
        id: generateItemId(),
        label: "Novo item",
        checked: false,
      })
    );
  };

  const removeItem = (itemId) => {
    if (items.length === 1) {
      updateItems([{ ...items[0], label: "", checked: false }]);
      return;
    }

    updateItems(items.filter((item) => item.id !== itemId));
  };

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
        minWidth={150}
        minHeight={110}
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
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          paddingRight: 2,
        }}
      >
        {items.map((item) => (
          <label
            key={item.id}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              className="nodrag"
              type="checkbox"
              checked={!!item.checked}
              onChange={(event) => {
                updateItem(item.id, { checked: event.target.checked });
              }}
              onBlur={() => data.onEditEnd?.()}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              style={{ width: 19, height: 19 }}
            />

            <input
              className="nodrag"
              value={item.label || ""}
              onChange={(event) => {
                updateItem(item.id, { label: event.target.value });
              }}
              onBlur={() => data.onEditEnd?.()}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              placeholder="Item da lista"
              style={{
                minWidth: 0,
                minHeight: 32,
                border: "none",
                outline: "none",
                background: "transparent",
                color: "white",
                fontSize: 16,
              }}
            />

            <button
              className="nodrag"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                removeItem(item.id);
              }}
              onPointerDown={(event) => event.stopPropagation()}
              title="Remover item"
              style={{
                ...smallButtonStyle,
                width: 34,
              }}
            >
              ×
            </button>
          </label>
        ))}

        <button
          className="nodrag"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            addItem();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          style={smallButtonStyle}
        >
          + item
        </button>
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
