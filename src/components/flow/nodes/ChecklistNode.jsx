import React from "react";
import { Handle, Position } from "reactflow";

const handleStyle = {
  width: 12,
  height: 12,
  background: "white",
  border: "2px solid #48abb3",
};

const smallButtonStyle = {
  border: "1px solid rgba(255,255,255,0.45)",
  borderRadius: 6,
  background: "rgba(255,255,255,0.14)",
  color: "white",
  cursor: "pointer",
  minHeight: 30,
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

export default function ChecklistNode({ id, data }) {
  const items = getChecklistItems(data);

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
        padding: 10,
        borderRadius: 8,
        background: "#48abb3",
        color: "white",
        minWidth: 220,
        maxWidth: 340,
        border:
          data.isEdgeSource || data.isSelected
            ? "2px solid white"
            : "1px solid rgba(255,255,255,0.3)",
        boxShadow: data.edgeMode ? "0 0 0 2px rgba(255,255,255,0.18)" : "none",
      }}
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
              onChange={(e) => {
                updateItem(item.id, { checked: e.target.checked });
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />

            <input
              className="nodrag"
              value={item.label || ""}
              onChange={(e) => {
                updateItem(item.id, { label: e.target.value });
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              placeholder="Item da lista"
              style={{
                minWidth: 0,
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
              onClick={(e) => {
                e.stopPropagation();
                removeItem(item.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              title="Remover item"
              style={{
                ...smallButtonStyle,
                width: 30,
              }}
            >
              ×
            </button>
          </label>
        ))}

        <button
          className="nodrag"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addItem();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          style={smallButtonStyle}
        >
          + item
        </button>
      </div>

      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  );
}