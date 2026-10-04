import React, { useEffect, useRef, useState } from "react";
import { NodeResizer } from "reactflow";
import Handles from "./Handles";

function uid() {
  return window.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random()}`;
}

function normalize(data) {
  if (Array.isArray(data.items) && data.items.length) return data.items;
  return [{ id: "legacy", label: data.label || "Novo item", checked: !!data.checked, level: 0 }];
}

export default function ChecklistNode({ id: nodeId, data }) {
  const list = normalize(data);
  const editing = !!data.editing;
  const [focusId, setFocusId] = useState(null);
  const inputRefs = useRef({});

  useEffect(() => {
    if (!focusId) return;
    const input = inputRefs.current[focusId];
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    setFocusId(null);
  }, [focusId, list]);

  const update = (items) => data.onChange?.(nodeId, { items });
  const change = (item, patch) => update(list.map((x) => x.id === item.id ? { ...x, ...patch } : x));

  const remove = (item) => {
    const index = list.findIndex((x) => x.id === item.id);
    const next = list.filter((x) => x.id !== item.id);
    if (!next.length) {
      const newId = uid();
      update([{ id: newId, label: "", checked: false, level: 0 }]);
      setFocusId(newId);
      return;
    }
    const previous = next[Math.max(0, index - 1)];
    update(next);
    setFocusId(previous.id);
  };

  const insertAfter = (item, level = item.level || 0) => {
    const index = list.findIndex((x) => x.id === item.id);
    const newId = uid();
    const next = [...list];
    next.splice(index + 1, 0, { id: newId, label: "", checked: false, level });
    update(next);
    setFocusId(newId);
  };

  return (
    <div
      className="bw-node"
      style={{
        width: Number(data.width) || 260,
        height: Number(data.height) || 220,
        padding: editing ? 10 : 12,
        background: "var(--bw-accent,#48abb3)"
      }}
    >
      {editing && (
        <NodeResizer
          isVisible
          minWidth={150}
          minHeight={110}
          handleStyle={{ opacity: 0 }}
          onResizeStart={() => data.onResizeStart?.()}
          onResize={(_, p) => data.onResize?.(nodeId, { width: Math.round(p.width), height: Math.round(p.height) })}
          onResizeEnd={() => data.onResizeEnd?.()}
        />
      )}
      <Handles />
      {editing && <div className="node-drag-handle bw-node-dragbar">arrastar</div>}
      <div className="nowheel bw-checklist" style={{ overflow: "auto", flex: 1, minHeight: 0 }}>
        {list.map((item) => {
          const level = Math.min(2, Math.max(0, item.level || 0));
          const visible = editing || level <= 1;
          if (!visible) return null;
          return (
            <label key={item.id} className={`bw-check-item level-${level}`}>
              <input
                className="nodrag"
                type="checkbox"
                checked={!!item.checked}
                disabled={!editing}
                onChange={(e) => change(item, { checked: e.target.checked })}
              />
              {editing ? (
                <input
                  ref={(el) => {
                    if (el) inputRefs.current[item.id] = el;
                    else delete inputRefs.current[item.id];
                  }}
                  className="nodrag"
                  value={item.label || ""}
                  onChange={(e) => change(item, { label: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      insertAfter(item, level);
                    } else if (e.key === "Enter" && e.shiftKey) {
                      e.preventDefault();
                      insertAfter(item, Math.min(2, level + 1));
                    } else if (e.key === "Tab") {
                      e.preventDefault();
                      if (e.shiftKey) change(item, { level: Math.max(0, level - 1) });
                      else change(item, { level: Math.min(2, level + 1) });
                    } else if (e.key === "Backspace" && e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0) {
                      e.preventDefault();
                      remove(item);
                    } else if (e.key === "Delete" && e.currentTarget.selectionStart === e.currentTarget.value.length && e.currentTarget.selectionEnd === e.currentTarget.value.length) {
                      e.preventDefault();
                      remove(item);
                    } else if (e.key === "Enter" && e.ctrlKey) {
                      e.preventDefault();
                      change(item, { level: Math.max(0, level - 1) });
                    }
                  }}
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
                <button type="button" className="nodrag bw-inline-delete" onClick={() => remove(item)}>×</button>
              )}
            </label>
          );
        })}
        {editing && (
          <button className="nodrag bw-add-item" type="button" onClick={() => {
            const newId = uid();
            update([...list, { id: newId, label: "", checked: false, level: 0 }]);
            setFocusId(newId);
          }}>
            + item
          </button>
        )}
      </div>
    </div>
  );
}