import React, { useLayoutEffect, useRef } from "react";
import { NodeResizer } from "reactflow";
import Handles from "./Handles";
import { MarkdownLine } from "../markdown";

const COLORS = {
  default: "var(--bw-accent, #48abb3)",
  green: "#34d46a",
  yellow: "#f1d44b",
  red: "#f05252",
  white: "#ffffff",
  transparent: "rgba(255,255,255,.30)"
};

export default function TextNode({ id, data }) {
  const editing = !!data.editing;
  const size = { width: Number(data.width) || 240, height: Number(data.height) || 170 };
  const highlightedRef = useRef(null);
  const textareaRef = useRef(null);
  const selectionRef = useRef(null);
  const label = data.label || "";

  useLayoutEffect(() => {
    const selection = selectionRef.current;
    const textarea = textareaRef.current;
    if (!selection || !textarea || document.activeElement !== textarea) return;
    const max = textarea.value.length;
    const start = Math.min(selection.start, max);
    const end = Math.min(selection.end, max);
    textarea.setSelectionRange(start, end, selection.direction || "none");
    selectionRef.current = null;
  }, [label]);

  const handleChange = (e) => {
    selectionRef.current = {
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
      direction: e.target.selectionDirection
    };
    data.onChange?.(id, { label: e.target.value });
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter" || e.shiftKey) return;

    const textarea = e.currentTarget;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const before = textarea.value.slice(0, selectionStart);
    const lineStart = before.lastIndexOf("\n") + 1;
    const currentLine = before.slice(lineStart);
    const listPrefix = currentLine.match(/^(\s*)-\s/);
    if (!listPrefix) return;

    e.preventDefault();
    const insertion = `\n${listPrefix[1]}- `;
    const nextValue = textarea.value.slice(0, selectionStart) + insertion + textarea.value.slice(selectionEnd);
    const caret = selectionStart + insertion.length;
    selectionRef.current = { start: caret, end: caret, direction: "none" };
    data.onChange?.(id, { label: nextValue });
  };

  return (
    <div
      className="bw-node"
      style={{ ...size, padding: editing ? 10 : 12, background: COLORS[data.textColor] || COLORS.default }}
    >
      {editing && (
        <NodeResizer
          isVisible
          minWidth={120}
          minHeight={84}
          handleStyle={{ opacity: 0 }}
          onResizeStart={() => data.onResizeStart?.()}
          onResize={(_, p) => data.onResize?.(id, { width: Math.round(p.width), height: Math.round(p.height) })}
          onResizeEnd={() => data.onResizeEnd?.()}
        />
      )}
      <Handles />
      {editing && <div className="node-drag-handle bw-node-dragbar">arrastar</div>}
      <div style={{ position: "relative", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <div ref={highlightedRef} className="bw-markdown" aria-hidden="true">
          {label.split("\n").map((line, i) => <MarkdownLine key={i} line={line} primary={COLORS.default} />)}
        </div>
        {editing && (
          <textarea
            ref={textareaRef}
            className="nodrag nowheel"
            autoFocus
            value={label}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={(e) => {
              if (highlightedRef.current) highlightedRef.current.scrollTop = e.currentTarget.scrollTop;
            }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              resize: "none",
              overflow: "auto",
              border: 0,
              background: "transparent",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              caretColor: "white",
              outline: 0,
              padding: 0
            }}
          />
        )}
      </div>
    </div>
  );
}