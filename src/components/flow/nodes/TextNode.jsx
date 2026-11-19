import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
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
  const editTokenRef = useRef(null);
  const [visualCaret, setVisualCaret] = useState(null);
  const label = data.label || "";
  const whiteText = data.textColor === "white";
  const lines = label.split("\n");
  let lineOffset = 0;
  const renderedLines = lines.map((line, index) => {
    const start = lineOffset;
    lineOffset += line.length + 1;
    return <MarkdownLine
      key={index}
      line={line}
      lineStart={start}
      primary={COLORS.default}
      editing={editing}
      lineIndex={index}
      searchMatch={data.searchMatch}
      onToggleChecklist={toggleChecklist}
    />;
  });

  const placeVisualCaret = useCallback(() => {
    const textarea = textareaRef.current;
    const root = highlightedRef.current;
    if (!editing || !textarea || !root) {
      setVisualCaret(null);
      return;
    }

    const position = textarea.selectionStart;
    const spans = [...root.querySelectorAll("[data-source-start][data-source-end]")];
    if (!spans.length) {
      setVisualCaret(null);
      return;
    }

    let target = spans.find((span) => {
      const start = Number(span.dataset.sourceStart);
      const end = Number(span.dataset.sourceEnd);
      return start === end ? position === start : position >= start && position < end;
    });
    let targetPosition = position;

    if (!target) {
      const previous = [...spans].reverse().find((span) => Number(span.dataset.sourceEnd) <= position);
      const next = spans.find((span) => Number(span.dataset.sourceStart) >= position);
      if (previous && (!next || position - Number(previous.dataset.sourceEnd) <= Number(next.dataset.sourceStart) - position)) {
        target = previous;
        targetPosition = Number(previous.dataset.sourceEnd);
      } else if (next) {
        target = next;
        targetPosition = Number(next.dataset.sourceStart);
      } else {
        target = spans[spans.length - 1];
        targetPosition = Number(target.dataset.sourceEnd);
      }
    }

    const sourceStart = Number(target.dataset.sourceStart);
    const sourceEnd = Number(target.dataset.sourceEnd);
    const relative = Math.max(0, Math.min(targetPosition - sourceStart, sourceEnd - sourceStart));
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    let textNode = null;
    let offset = relative;
    let current;

    while ((current = walker.nextNode())) {
      if (offset <= current.textContent.length) {
        textNode = current;
        break;
      }
      offset -= current.textContent.length;
    }

    if (!textNode) {
      const allText = [];
      const fallbackWalker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      while ((current = fallbackWalker.nextNode())) allText.push(current);
      textNode = allText[allText.length - 1] || null;
      offset = textNode?.textContent.length || 0;
    }
    if (!textNode) return;

    const range = document.createRange();
    range.setStart(textNode, Math.min(offset, textNode.textContent.length));
    range.collapse(true);
    let rect = range.getBoundingClientRect();
    let caretLeft = rect.left;

    if (!rect.height && offset > 0) {
      range.setStart(textNode, offset - 1);
      range.setEnd(textNode, offset);
      rect = range.getBoundingClientRect();
      caretLeft = rect.right;
    }

    const rootRect = root.getBoundingClientRect();
    setVisualCaret({
      left: caretLeft - rootRect.left,
      top: rect.top - rootRect.top,
      height: rect.height || 22
    });
  }, [editing]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !editing) {
      setVisualCaret(null);
      return;
    }

    const editSelection = data.editSelection;
    if (editSelection && editTokenRef.current !== editSelection.token) {
      const start = Math.max(0, Math.min(editSelection.index, textarea.value.length));
      const end = Math.max(start, Math.min(start + editSelection.length, textarea.value.length));
      textarea.focus();
      textarea.setSelectionRange(start, end);
      editTokenRef.current = editSelection.token;
      selectionRef.current = null;
    } else if (selectionRef.current) {
      const selection = selectionRef.current;
      const max = textarea.value.length;
      const start = Math.min(selection.start, max);
      const end = Math.min(selection.end, max);
      textarea.setSelectionRange(start, end, selection.direction || "none");
      selectionRef.current = null;
    }

    placeVisualCaret();
  }, [label, editing, data.editSelection, placeVisualCaret]);

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

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l" && !e.altKey) {
      e.preventDefault();
      const existing = line.match(/^ *(?:- \[[ xX]\]\s*|-\s*)/);
      const contentStart = lineStart + (existing ? existing[0].length : leading.length);
      const content = line.slice(contentStart - lineStart);
      const relative = Math.max(0, start - contentStart);
      const nextLine = `${leading}- [ ] ${content}`;
      const next = `${value.slice(0, lineStart)}${nextLine}${value.slice(lineEnd)}`;
      const caret = lineStart + leading.length + 6 + Math.min(relative, content.length);
      selectionRef.current = { start: caret, end: caret, direction: "none" };
      data.onChange?.(id, { label: next });
      return;
    }

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
      placeVisualCaret();
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

  function toggleChecklist(lineIndex, checked) {
    const currentLines = label.split("\n");
    const indentation = (currentLines[lineIndex].match(/^ */) || [""])[0];
    const content = currentLines[lineIndex].slice(indentation.length);
    const match = content.match(/^- \[[ xX]\](\s?.*)$/);
    if (!match) return;
    currentLines[lineIndex] = `${indentation}- [${checked ? "x" : " "}]${match[1]}`;
    data.onChange?.(id, { label: currentLines.join("\n") });
  }

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
          {renderedLines}
          {editing && visualCaret && <span className="bw-text-visual-caret" style={{ left: visualCaret.left, top: visualCaret.top, height: visualCaret.height }} />}
        </div>
        {editing && (
          <textarea
            ref={textareaRef}
            className="nodrag nowheel bw-textarea"
            autoFocus
            value={label}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={placeVisualCaret}
            onKeyUp={placeVisualCaret}
            onClick={placeVisualCaret}
            onScroll={(e) => {
              if (highlightedRef.current) {
                highlightedRef.current.scrollTop = e.currentTarget.scrollTop;
                highlightedRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
              placeVisualCaret();
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
              caretColor: "transparent",
              outline: 0,
              padding: 0,
              fontFamily: whiteText ? '"Cascadia Code", "Cascadia Mono", Consolas, monospace' : "inherit",
              fontSize: 16,
              lineHeight: "22px",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere"
            }}
          />
        )}
      </div>
    </div>
  );
}