import React from "react";

function inline(text) {
  const tokens = [];
  let rest = text;
  const re = /(\[[^\]]+\]\([^\s)]+\)|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~)/;
  let key = 0;
  while (rest) {
    const match = rest.match(re);
    if (!match) { tokens.push(rest); break; }
    const index = match.index;
    if (index) tokens.push(rest.slice(0, index));
    const token = match[0];
    if (token.startsWith("[")) {
      const m = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      let href = m?.[2] || "#";
      if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
      tokens.push(<a key={key++} href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{m?.[1] || href}</a>);
    } else if (token.startsWith("**")) tokens.push(<strong key={key++}>{token.slice(2,-2)}</strong>);
    else if (token.startsWith("__")) tokens.push(<em key={key++}>{token.slice(2,-2)}</em>);
    else tokens.push(<del key={key++}>{token.slice(2,-2)}</del>);
    rest = rest.slice(index + token.length);
  }
  return tokens;
}

export function MarkdownLine({ line, primary }) {
  if (line === "---") return <div className="bw-md-separator" />;
  if (line.startsWith("# ")) return <h3 className="bw-md-heading">{inline(line.slice(2))}</h3>;
  if (line.startsWith("- ")) return <div className="bw-md-list"><span>•</span><span>{inline(line.slice(2))}</span></div>;
  if (line.startsWith(">")) return <div className="bw-md-green">{inline(line.slice(1))}</div>;
  if (line.startsWith("<")) return <div className="bw-md-red">{inline(line.slice(1))}</div>;
  if (line.startsWith("-")) return <div className="bw-md-gray">{inline(line)}</div>;
  return <div>{inline(line) || "\u00a0"}</div>;
}