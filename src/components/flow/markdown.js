import React from "react";

function sourceText(text, sourceStart, highlight) {
  const sourceEnd = sourceStart + text.length;
  const hasHighlight = highlight && highlight.end > sourceStart && highlight.start < sourceEnd;
  if (!hasHighlight) {
    return <span data-source-start={sourceStart} data-source-end={sourceEnd}>{text}</span>;
  }

  const start = Math.max(0, highlight.start - sourceStart);
  const end = Math.min(text.length, highlight.end - sourceStart);
  return <span data-source-start={sourceStart} data-source-end={sourceEnd}>
    {text.slice(0, start)}
    <mark className="bw-search-hit">{text.slice(start, end)}</mark>
    {text.slice(end)}
  </span>;
}

function inline(text, sourceStart = 0, highlight = null) {
  const tokens = [];
  let rest = text;
  let offset = sourceStart;
  const re = /(\[[^\]]+\]\([^\s)]+\)|(?<!\*)\*[^*\n]+\*(?!\*)|(?<!_)_[^_\n]+_(?!_)|(?<!~)~[^~\n]+~(?!~))/;
  let key = 0;

  while (rest) {
    const match = rest.match(re);
    if (!match) {
      tokens.push(sourceText(rest, offset, highlight));
      break;
    }

    const index = match.index;
    if (index) tokens.push(sourceText(rest.slice(0, index), offset, highlight));

    const token = match[0];
    if (token.startsWith("[")) {
      const m = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      let href = m?.[2] || "#";
      if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
      tokens.push(
        <a key={key++} href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
          {sourceText(m?.[1] || href, offset + 1, highlight)}
        </a>
      );
    } else if (token.startsWith("*")) {
      tokens.push(<strong key={key++}>{sourceText(token.slice(1, -1), offset + 1, highlight)}</strong>);
    } else if (token.startsWith("_")) {
      tokens.push(<em key={key++}>{sourceText(token.slice(1, -1), offset + 1, highlight)}</em>);
    } else {
      tokens.push(<del key={key++}>{sourceText(token.slice(1, -1), offset + 1, highlight)}</del>);
    }

    rest = rest.slice(index + token.length);
    offset += index + token.length;
  }

  return tokens;
}

export function MarkdownLine({ line, editing = false, lineIndex, lineStart = 0, onToggleChecklist, searchMatch }) {
  const indentation = (line.match(/^ */) || [""])[0].length;
  const level = indentation >= 6 ? 2 : indentation >= 4 ? 1 : 0;
  if (level === 2 && !editing && !(searchMatch && searchMatch.end > lineStart && searchMatch.index < lineStart + line.length)) return null;
  const removedIndent = level === 2 ? 6 : level === 1 ? 4 : 0;
  const content = line.slice(removedIndent);
  const contentStart = lineStart + removedIndent;
  const searchStart = searchMatch?.index ?? -1;
  const highlight = searchMatch && searchMatch.end > contentStart && searchStart < lineStart + line.length
    ? { start: Math.max(searchStart, contentStart), end: Math.min(searchMatch.end, lineStart + line.length) }
    : null;
  const classes = `bw-md-line level-${level}`;

  if (content === "---") return <div className="bw-md-separator" />;

  const checklist = content.match(/^- \[([ xX])\]\s?(.*)$/);
  if (checklist) {
    const textStart = contentStart + content.length - checklist[2].length;
    return (
      <div className={`${classes} bw-md-checklist-line`}>
        <input
          className="bw-md-checkbox"
          type="checkbox"
          checked={checklist[1].toLowerCase() === "x"}
          disabled={editing}
          onChange={(e) => onToggleChecklist?.(lineIndex, e.target.checked)}
        />
        <span>{checklist[2] ? inline(checklist[2], textStart, highlight) : <span data-source-start={textStart} data-source-end={textStart}>\u200b</span>}</span>
      </div>
    );
  }

  if (content.startsWith("# ")) return <h3 className={`${classes} bw-md-heading`}>{inline(content.slice(2), contentStart + 2, highlight)}</h3>;
  if (content.startsWith("- ")) {
    return (
      <div className={`${classes} bw-md-list`}>
        <span>•</span>
        <span>{inline(content.slice(2), contentStart + 2, highlight)}</span>
      </div>
    );
  }
  if (content.startsWith(">")) return <div className={`${classes} bw-md-green`}>{inline(content, contentStart, highlight)}</div>;
  if (content.startsWith("<")) return <div className={`${classes} bw-md-red`}>{inline(content, contentStart, highlight)}</div>;
  if (content.startsWith("-")) return <div className={`${classes} bw-md-gray`}>{inline(content, contentStart, highlight)}</div>;
  return <div className={classes}>{content ? inline(content, contentStart, highlight) : <span data-source-start={contentStart} data-source-end={contentStart}>\u200b</span>}</div>;
}