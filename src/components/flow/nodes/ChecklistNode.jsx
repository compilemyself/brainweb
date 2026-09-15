import React from "react";
import { Handle, NodeResizer, Position } from "reactflow";

function id() {
  return window.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random()}`;
}

function items(data) {
  return Array.isArray(data.items) && data.items.length
    ? data.items
    : [{
      id: "legacy",
      label: data.label || "Novo item",
      checked: !!data.checked
    }];
}

export default function ChecklistNode({ id: nodeId, data }) {
  const list = items(data);
  const editing = !!data.editing;
  const width = Number(data.width) || 260;
  const height = Number(data.height) || 220;

  const update = (next) => data.onChange?.(nodeId, { items: next });

  return (
    <div
      className="bw-node"
      style={{
        width,
        height,
        padding: editing ? 10 : 12,
        background: "var(--bw-accent, #48abb3)"
      }}
    >
      {editing && (
        <NodeResizer
          isVisible
          minWidth={150}
          minHeight={110}
          lineStyle={{
            borderColor: "rgba(255,255,255,.75)",
            borderWidth: 1
          }}
          handleStyle={{ opacity: 0 }}
          onResizeStart={() => data.onResizeStart?.()}
          onResize={(_, p) =>
            data.onResize?.(nodeId, {
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
        className="nowheel"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flex: 1,
          minHeight: 0,
          overflow: "auto"
        }}
      >
        {list.map((item) => (
          <label
            key={item.id}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 8,
              alignItems: "center"
            }}
          >
            <input
              className="nodrag"
              type="checkbox"
              disabled={!editing}
              checked={!!item.checked}
              onChange={(e) =>
                update(list.map((x) =>
                  x.id === item.id
                    ? { ...x, checked: e.target.checked }
                    : x
                ))
              }
            />

            {editing ? (
              <input
                className="nodrag"
                value={item.label || ""}
                onChange={(e) =>
                  update(list.map((x) =>
                    x.id === item.id
                      ? { ...x, label: e.target.value }
                      : x
                  ))
                }
                style={{
                  minWidth: 0,
                  minHeight: 30,
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  color: "white",
                  fontSize: 16
                }}
              />
            ) : (
              <span>{item.label || "\u00a0"}</span>
            )}

            {editing && (
              <button
                className="nodrag"
                type="button"
                onClick={() =>
                  update(
                    list.length === 1
                      ? [{ ...list[0], label: "", checked: false }]
                      : list.filter((x) => x.id !== item.id)
                  )
                }
              >
                ×
              </button>
            )}
          </label>
        ))}

        {editing && (
          <button
            className="nodrag"
            type="button"
            onClick={() =>
              update([
                ...list,
                { id: id(), label: "Novo item", checked: false }
              ])
            }
          >
            + item
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="bw-node-handle" />
    </div>
  );
}