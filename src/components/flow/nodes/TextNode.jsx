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
  transparent: "rgba(255,255,255,.20)"
};

const PAIRS = { "(": ")", "{": "}", "[": "]", "'": "'", '"': '"' };
const indentLevel = (length) => length >= 4 ? Math.min(2, 1 + Math.floor((length - 4) / 2)) : 0;
const indentPrefix = (level) => level <= 0 ? "" : " ".repeat(level === 1 ? 4 : 6);

export default function TextNode({ id, data }) {
  const editing = !!data.editing;
  const size = { width: Number(data.width) || 240, height: Number(data.height) || 170 };
  const highlightedRef = useRef(null);
  const textareaRef = useRef(null);
  const selectionRef = useRef(null);
  const searchTokenRef = useRef(null);
  const label = data.label || "";
  const whiteText = data.textColor === "white";

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const match = data.searchMatch;
    if (match && searchTokenRef.current !== match.token) {
      textarea.focus();
      textarea.setSelectionRange(match.index, match.index + match.length);
      searchTokenRef.current = match.token;
      const lineStart = textarea.value.lastIndexOf("\n", match.index) + 1;
      const lineHeight = 22;
      textarea.scrollTop = Math.max(0, (textarea.value.slice(0, lineStart).match(/\n/g) || []).length * lineHeight - textarea.clientHeight / 2);
      return;
    }
    if (document.activeElement !== textarea) return;
    if (selectionRef.current) {
      const selection = selectionRef.current;
      const max = textarea.value.length;
      const start = Math.min(selection.start, max);
      const end = Math.min(selection.end, max);
      textarea.setSelectionRange(start, end, selection.direction || "none");
      selectionRef.current = null;
      return;
    }
  }, [label, data.searchMatch]);

  const handleChange = (e) => {
    selectionRef.current = {
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
      direction: e.target.selectionDirection
    };
    data.onChange?.(id, { label: e.target.value });
  };

  const handleKeyDown = (e) => {
    const textarea = e.currentTarget;
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const lineStart = before.lastIndexOf("\n") + 1;
    const lineEndIndex = value.indexOf("\n", start);
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
    const line = value.slice(lineStart, lineEnd);
    const prefix = value.slice(lineStart, start);
    const leading = (line.match(/^ */) || [""])[0];

    if (e.key === "]" && start === end && value[start] === "]" && prefix.slice(leading.length) === "-[") {
      e.preventDefault();
      const insertion = "- [ ] ";
      const next = `${value.slice(0, lineStart)}${leading}${insertion}${value.slice(start + 1)}`;
      const caret = lineStart + leading.length + insertion.length;
      selectionRef.current = { start: caret, end: caret, direction: "none" };
      data.onChange?.(id, { label: next });
      return;
    }

    if (Object.values(PAIRS).includes(e.key) && start === end && value[start] === e.key) {
      e.preventDefault();
      textarea.setSelectionRange(start + 1, start + 1);
      return;
    }

    if (PAIRS[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const selected = value.slice(start, end);
      const next = `${before}${e.key}${selected}${PAIRS[e.key]}${after}`;
      const caretStart = start + 1;
      const caretEnd = selected ? caretStart + selected.length : caretStart;
      selectionRef.current = { start: caretStart, end: caretEnd, direction: "none" };
      data.onChange?.(id, { label: next });
      return;
    }

    if (e.key === "Backspace" && start === end && PAIRS[value[start - 1]] === value[start]) {
      e.preventDefault();
      const next = `${value.slice(0, start - 1)}${value.slice(start + 1)}`;
      selectionRef.current = { start: start - 1, end: start - 1, direction: "none" };
      data.onChange?.(id, { label: next });
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const currentLevel = indentLevel(leading.length);
      const nextLevel = e.shiftKey ? Math.max(0, currentLevel - 1) : Math.min(2, currentLevel + 1);
      const nextPrefix = indentPrefix(nextLevel);
      const next = `${value.slice(0, lineStart)}${nextPrefix}${value.slice(lineStart + leading.length)}`;
      const caret = lineStart + nextPrefix.length + Math.max(0, start - lineStart - leading.length);
      selectionRef.current = { start: caret, end: caret, direction: "none" };
      data.onChange?.(id, { label: next });
      return;
    }

    if (e.key === " " && start === end && prefix.trim() === "" && (leading.length === 3 || leading.length === 5)) {
      e.preventDefault();
      const nextPrefix = leading.length === 3 ? "    " : "      ";
      const next = `${value.slice(0, lineStart)}${nextPrefix}${value.slice(lineStart + leading.length)}`;
      const caret = lineStart + nextPrefix.length;
      selectionRef.current = { start: caret, end: caret, direction: "none" };
      data.onChange?.(id, { label: next });
      return;
    }

    if (e.key !== "Enter" || e.shiftKey) return;
    const checklistPrefix = line.match(/^( *)- \[[ xX]\]\s*/);
    const listPrefix = line.match(/^( *)-\s/);
    if (!checklistPrefix && !listPrefix) return;

    e.preventDefault();
    const indentation = checklistPrefix?.[1] ?? listPrefix?.[1] ?? "";
    const insertion = checklistPrefix ? `\n${indentation}- [ ] ` : `\n${indentation}- `;
    const next = `${value.slice(0, start)}${insertion}${value.slice(end)}`;
    const caret = start + insertion.length;
    selectionRef.current = { start: caret, end: caret, direction: "none" };
    data.onChange?.(id, { label: next });
  };

  const toggleChecklist = (lineIndex, checked) => {
    const lines = label.split("\n");
    const indentation = (lines[lineIndex].match(/^ */) || [""])[0];
    const content = lines[lineIndex].slice(indentation.length);
    const match = content.match(/^- \[[ xX]\](\s?.*)$/);
    if (!match) return;
    lines[lineIndex] = `${indentation}- [${checked ? "x" : " "}]${match[1]}`;
    data.onChange?.(id, { label: lines.join("\n") });
  };

  return (
    <div
      className={`bw-node ${whiteText ? "bw-text-white" : ""}`}
      style={{ ...size, padding: editing ? 10 : 12, background: COLORS[data.textColor] || COLORS.default, color: whiteText ? "#111" : "#fff" }}
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
      {editing && <div className="node-drag-handle bw-node-dragbar">editar</div>}
      <div style={{ position: "relative", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <div ref={highlightedRef} className="bw-markdown" aria-hidden="true">
          {label.split("\n").map((line, i) => <MarkdownLine key={i} line={line} primary={COLORS.default} editing={editing} lineIndex={i} onToggleChecklist={toggleChecklist} />)}
        </div>
        {editing && (
          <textarea
            ref={textareaRef}
            className="nodrag nowheel bw-textarea"
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
              caretColor: whiteText ? "#111" : "white",
              outline: 0,
              padding: 0,
              fontFamily: whiteText ? '"Cascadia Code", "Cascadia Mono", Consolas, monospace' : "inherit"
            }}
          />
        )}
      </div>
    </div>
  );
}