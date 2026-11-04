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
      return id ? { src: `https://www.youtube.com/embed/${id}`, type: "youtube" } : null;
    }

    if (u.hostname === "open.spotify.com" || u.hostname.endsWith(".spotify.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const supportedTypes = ["track", "playlist", "album", "artist", "show", "episode"];
      const typeIndex = parts.findIndex((part) => supportedTypes.includes(part));
      if (typeIndex === -1 || !parts[typeIndex + 1]) return null;
      const path = parts.slice(typeIndex).join("/");
      return { src: `https://open.spotify.com/embed/${path}${u.search || ""}`, type: "spotify" };
    }

    if (u.hostname === "www.google.com" && u.pathname.startsWith("/maps")) {
      if (u.pathname.startsWith("/maps/embed")) return { src: u.toString(), type: "maps" };
      const query = u.searchParams.get("query") || u.searchParams.get("q");
      if (query) return { src: `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`, type: "maps" };
    }
  } catch {
    return null;
  }

  return null;
}

export default function EmbedNode({ id, data }) {
  const editing = !!data.editing;
  const resolved = embed(data.url);
  const width = Number(data.width) || 420;
  const height = resolved?.type === "youtube" ? Math.round((width - 8) * 9 / 16 + 44) : Number(data.height) || 300;

  return (
    <div
      className="bw-node bw-embed-node"
      style={{ width, height, padding: 0, background: "var(--bw-accent,#48abb3)" }}
    >
      {editing && (
        <NodeResizer
          isVisible
          minWidth={220}
          minHeight={124}
          handleStyle={{ opacity: 0 }}
          onResizeStart={() => data.onResizeStart?.()}
          onResize={(_, p) => data.onResize?.(id, { width: Math.round(p.width), height: resolved?.type === "youtube" ? Math.round((Math.round(p.width) - 8) * 9 / 16 + 44) : Math.round(p.height) })}
          onResizeEnd={() => data.onResizeEnd?.()}
        />
      )}
      <Handles />
      <div className="node-drag-handle bw-node-dragbar bw-embed-drag-zone bw-embed-drag-top">editar</div>
      {resolved
        ? <iframe className="bw-embed-frame" title="Brainweb embed" src={resolved.src} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
        : <div className="bw-embed-placeholder">{editing ? "Digite aqui o endereço (YouTube, Spotify, Maps)" : "Embed sem endereço"}</div>}
      {editing && <input className="nodrag bw-embed-input" value={data.url || ""} placeholder="Digite aqui o endereço (YouTube, Spotify, Maps)" onChange={(e) => data.onChange?.(id, { url: e.target.value })} />}
      <div className="bw-embed-drag-zone bw-embed-drag-bottom" />
    </div>
  );
}