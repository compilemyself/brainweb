import React from "react";
import { NodeResizer } from "reactflow";
import Handles from "./Handles";

function embed(url) {
  if (!url) return null;

  try {
    const u = new URL(url);

    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const id = u.hostname.includes("youtu.be")
        ? u.pathname.slice(1).split("/")[0]
        : u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (u.hostname === "open.spotify.com" || u.hostname.endsWith(".spotify.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const supportedTypes = ["track", "playlist", "album", "artist", "show", "episode"];
      const typeIndex = parts.findIndex((part) => supportedTypes.includes(part));
      if (typeIndex === -1 || !parts[typeIndex + 1]) return null;
      const path = parts.slice(typeIndex).join("/");
      return `https://open.spotify.com/embed/${path}${u.search || ""}`;
    }

    if (u.hostname === "www.google.com" && u.pathname.startsWith("/maps")) {
      if (u.pathname.startsWith("/maps/embed")) return u.toString();
      const query = u.searchParams.get("query") || u.searchParams.get("q");
      if (query) return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    }
  } catch {
    return null;
  }

  return null;
}

export default function EmbedNode({ id, data }) {
  const editing = !!data.editing;
  const src = embed(data.url);

  return (
    <div
      className="bw-node bw-embed-node"
      style={{
        width: Number(data.width) || 420,
        height: Number(data.height) || 300,
        padding: editing ? 8 : 4,
        background: "var(--bw-accent,#48abb3)"
      }}
    >
      {editing && (
        <NodeResizer
          isVisible
          minWidth={220}
          minHeight={180}
          handleStyle={{ opacity: 0 }}
          onResizeStart={() => data.onResizeStart?.()}
          onResize={(_, p) => data.onResize?.(id, { width: Math.round(p.width), height: Math.round(p.height) })}
          onResizeEnd={() => data.onResizeEnd?.()}
        />
      )}
      <Handles />
      {editing && <div className="node-drag-handle bw-node-dragbar">arrastar</div>}
      {src
        ? <iframe title="Brainweb embed" src={src} style={{ width: "100%", height: "100%", border: 0, borderRadius: 5 }} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
        : <div className="bw-embed-placeholder">{editing ? "Digite aqui o endereço (YouTube, Spotify, Maps)" : "Embed sem endereço"}</div>}
      {editing && <input className="nodrag bw-embed-input" value={data.url || ""} placeholder="Digite aqui o endereço (YouTube, Spotify, Maps)" onChange={(e) => data.onChange?.(id, { url: e.target.value })} />}
    </div>
  );
}