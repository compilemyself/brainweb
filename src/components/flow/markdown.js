import React from "react";

function inline(text) {
  const tokens = [];
  let rest = text;
  const re = /(\[[^\]]+\]\([^\s)]+\)|(?<!\*)\*[^*\n]+\*(?!\*)|(?<!_)_[^_\n]+_(?!_)|(?<!~)~[^~\n]+~(?!~))/;
  let key = 0;

  while (rest) {
    const match = rest.match(re);
    if (!match) {
      tokens.push(rest);
      break;
    }

    const index = match.index;
    if (index) tokens.push(rest.slice(0, index));

    const token = match[0];
    if (token.startsWith("[")) {
      const m = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      let href = m?.[2] || "#";
      if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
      tokens.push(
        <a key={key++} href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
          {m?.[1] || href}
        </a>
      );
    } else if (token.startsWith("*")) {
      tokens.push(<strong key={key++}>{token.slice(1, -1)}</strong>);
    } else if (token.startsWith("_")) {
      tokens.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else {
      tokens.push(<del key={key++}>{token.slice(1, -1)}</del>);
    }

    rest = rest.slice(index + token.length);
  }

  return tokens;
}

export function MarkdownLine({ line, editing = false, lineIndex, onToggleChecklist }) {
  const indentation = (line.match(/^ */) || [""])[0].length;
  const level = indentation >= 6 ? 2 : indentation >= 4 ? 1 : 0;
  if (level === 2 && !editing) return null;
  const content = line.slice(level === 2 ? 6 : level === 1 ? 4 : 0);
  const checklist = content.match(/^- \[([ xX])\]\s?(.*)$/);
  const classes = `bw-md-line level-${level}`;

  if (checklist) {
    return (
      <div className={`${classes} bw-md-checklist-line`}>
        <input
          className="bw-md-checkbox"
          type="checkbox"
          checked={checklist[1].toLowerCase() === "x"}
          disabled={editing}
          onChange={(e) => onToggleChecklist?.(lineIndex, e.target.checked)}
        />
        <span>{inline(checklist[2]) || "\u00a0"}</span>
      </div>
    );
  }

  if (content === "---") return <div className={`${classes} bw-md-separator`} />;
  if (content.startsWith("# ")) return <h3 className={`${classes} bw-md-heading`}>{inline(content.slice(2))}</h3>;
  if (content.startsWith("- ")) {
    return (
      <div className={`${classes} bw-md-list`}>
        <span>•</span>
        <span>{inline(content.slice(2))}</span>
      </div>
    );
  }
  if (content.startsWith(">")) return <div className={`${classes} bw-md-green`}>{inline(content)}</div>;
  if (content.startsWith("<")) return <div className={`${classes} bw-md-red`}>{inline(content)}</div>;
  if (content.startsWith("-")) return <div className={`${classes} bw-md-gray`}>{inline(content)}</div>;
  return <div className={classes}>{inline(content) || "\u00a0"}</div>;
}