import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NodeResizer } from "reactflow";
import Handles from "./Handles";

function uid() {
  return window.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random()}`;
}

function normalize(data) {
  if (Array.isArray(data.items) && data.items.length) return data.items;
  return [{ id: "legacy", label: data.label || "Novo item", checked: !!data.checked, level: 0 }];
}

const PAIRS = { "(": ")", "{": "}", "[": "]", "'": "'", '"': '"' };

export default function ChecklistNode({ id: nodeId, data }) {
  const list = normalize(data);
  const editing = !!data.editing;
  const [focusId, setFocusId] = useState(null);
  const inputRefs = useRef({});
  const selectionRef = useRef(null);
  const searchTokenRef = useRef(null);

  useLayoutEffect(() => {
    const pending = selectionRef.current;
    const input = pending ? inputRefs.current[pending.id] : inputRefs.current[focusId];
    if (!input) return;
    input.focus();
    if (pending) {
      input.setSelectionRange(pending.start, pending.end);
      selectionRef.current = null;
    } else {
      input.setSelectionRange(input.value.length, input.value.length);
    }
    if (focusId) setFocusId(null);
  }, [focusId, list]);

  useEffect(() => {
    const match = data.searchMatch;
    if (!editing || !match || match.type !== "CHECKLIST") return;
    const item = list[match.itemIndex];
    if (!item) return;
    if (searchTokenRef.current === match.token) return;
    searchTokenRef.current = match.token;
    selectionRef.current = { id: item.id, start: match.index, end: match.index + match.length };
    setFocusId(item.id);
  }, [data.searchMatch, editing, list]);

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

  const keyDown = (e, item, level) => {
    const input = e.currentTarget;
    const value = input.value;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);

    if (Object.values(PAIRS).includes(e.key) && start === end && value[start] === e.key) {
      e.preventDefault();
      input.setSelectionRange(start + 1, start + 1);
      return;
    }

    if (PAIRS[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const selected = value.slice(start, end);
      const next = `${before}${e.key}${selected}${PAIRS[e.key]}${after}`;
      selectionRef.current = { id: item.id, start: start + 1, end: start + 1 + selected.length };
      change(item, { label: next });
      return;
    }

    if (e.key === "Backspace" && start === end && PAIRS[value[start - 1]] === value[start]) {
      e.preventDefault();
      selectionRef.current = { id: item.id, start: start - 1, end: start - 1 };
      change(item, { label: `${value.slice(0, start - 1)}${value.slice(start + 1)}` });
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      change(item, { level: e.shiftKey ? Math.max(0, level - 1) : Math.min(2, level + 1) });
      selectionRef.current = { id: item.id, start, end };
      return;
    }

    const leading = before.match(/^ */)?.[0] || "";
    const threshold = level === 0 ? 3 : 1;
    if (e.key === " " && start === end && before === leading && !value.slice(start).trim() && leading.length === threshold && level < 2) {
      e.preventDefault();
      selectionRef.current = { id: item.id, start: 0, end: 0 };
      change(item, { label: value.slice(leading.length), level: level + 1 });
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      insertAfter(item, level);
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      insertAfter(item, Math.min(2, level + 1));
    } else if (e.key === "Backspace" && start === 0 && end === 0) {
      e.preventDefault();
      remove(item);
    } else if (e.key === "Delete" && start === value.length && end === value.length) {
      e.preventDefault();
      remove(item);
    } else if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      change(item, { level: Math.max(0, level - 1) });
    }
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
      {editing && <div className="node-drag-handle bw-node-dragbar">editar</div>}
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
                  onKeyDown={(e) => keyDown(e, item, level)}
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