import React, { useCallback, useEffect, useMemo, useRef, useState, useContext } from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  EdgeLabelRenderer,
  ReactFlow,
  useReactFlow
} from "reactflow";
import "reactflow/dist/style.css";
import { AuthContext } from "../../context/AuthContext";
import { nodeTypes } from "./nodeTypes";
import { resolveTheme, THEMES } from "./themes";
import { salvarMapa, salvarConfiguracaoMapa } from "../../services/mapasApi";
import { atualizarPreferenciasUsuario } from "../../services/usuarioApi";

const EDGE_STYLE = { stroke: "rgba(255,255,255,.72)", strokeWidth: 2 };
const IMAGE_MAX_BYTES = 4 * 1024 * 1024;
const HISTORY_LIMIT = 80;
const DATA_HISTORY_DELAY = 650;

const isInput = (e) => {
  const t = e?.target;
  return ["input", "textarea", "button", "select"].includes(t?.tagName?.toLowerCase()) || t?.isContentEditable;
};

const uid = (prefix) => window.crypto?.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const clone = (value) => JSON.parse(JSON.stringify(value));
const cleanData = (data = {}) => Object.fromEntries(
  Object.entries(data).filter(([key]) => ![
    "onChange", "onEditEnd", "onResize", "onResizeStart", "onResizeEnd",
    "editing", "isSelected", "accentColor", "imageDeformable"
  ].includes(key))
);
const payload = (nodes, edges) => ({
  nodes: nodes.map((n) => ({
    id: n.id,
    type: n.type || "TEXT",
    position: n.position,
    data: cleanData(n.data)
  })),
  edges: edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle || "right-source",
    targetHandle: e.targetHandle || "left-target",
    label: e.label || ""
  }))
});

function initialData(type) {
  if (type === "CHECKLIST") return { width: 280, height: 220, items: [{ id: uid("item"), label: "Novo item", checked: false, level: 0 }] };
  if (type === "IMAGE") return { width: 240, height: 180, label: "Imagem", src: "" };
  if (type === "EMBED") return { width: 420, height: 300, url: "" };
  if (type === "CALCULATOR") return { width: 260, height: 359 };
  return { width: 240, height: 170, label: "Novo texto" };
}

function clockText() {
  const date = new Date();
  const longDate = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date).replace(",", "").toUpperCase();
  const shortDate = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "2-digit"
  }).format(date).replace(/[.,]/g, "").toUpperCase();
  const longTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
  const shortTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
  return { long: `${longDate}, ${longTime}`, short: `${shortDate}, ${shortTime}` };
}

function fileData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function imageDimensions(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ width: 240, height: 180 });
    image.src = src;
  });
}

function countOccurrences(text, query) {
  const indexes = [];
  if (!query) return indexes;
  let from = 0;
  while (from <= text.length) {
    const index = text.indexOf(query, from);
    if (index === -1) break;
    indexes.push(index);
    from = index + Math.max(query.length, 1);
  }
  return indexes;
}

function ClipboardPreview({ item }) {
  if (item.kind === "TEXT") {
    return <div className="bw-clipboard-preview-text">{item.text || "(texto vazio)"}</div>;
  }
  if (item.kind === "IMAGE" || item.previewType === "IMAGE") {
    return item.imageSrc
      ? <img className="bw-clipboard-preview-image" src={item.imageSrc} alt={item.label || "Imagem copiada"} />
      : <div className="bw-clipboard-preview-text">imagem</div>;
  }
  if (item.kind === "MULTI") {
    return <div className="bw-clipboard-preview-text">múltiplas seleções</div>;
  }
  if (item.kind === "EDGE") {
    return <div className="bw-clipboard-preview-text">aresta: {item.label || "sem texto"}</div>;
  }

  const node = item.nodes?.[0];
  if (!node) return <div className="bw-clipboard-preview-text">{item.label || "node"}</div>;
  if (node.type === "CHECKLIST") {
    const items = Array.isArray(node.data?.items) ? node.data.items : [];
    return (
      <div className="bw-clipboard-node-preview">
        {items.slice(0, 4).map((check, index) => <div key={check.id || index}>□ {check.label || "\u00a0"}</div>)}
        {items.length > 4 && <div>…</div>}
      </div>
    );
  }
  if (node.type === "TEXT") return <div className="bw-clipboard-node-preview">{node.data?.label || "texto vazio"}</div>;
  if (node.type === "IMAGE") {
    return node.data?.src
      ? <img className="bw-clipboard-preview-image" src={node.data.src} alt="Imagem copiada" />
      : <div className="bw-clipboard-preview-text">imagem</div>;
  }
  if (node.type === "EMBED") return <div className="bw-clipboard-node-preview">embed: {node.data?.url || "sem endereço"}</div>;
  if (node.type === "CALCULATOR") return <div className="bw-clipboard-node-preview">calculadora</div>;
  return <div className="bw-clipboard-preview-text">{item.label || node.type}</div>;
}

export default function MapEditor({ mapa, config: initialConfig }) {
  const { logout, updateUser } = useContext(AuthContext);
  const rf = useReactFlow();
  const imageInput = useRef(null);
  const replaceImageNode = useRef(null);
  const saveTimer = useRef(null);
  const saveQueueRef = useRef(Promise.resolve());
  const past = useRef([]);
  const future = useRef([]);
  const pending = useRef(null);
  const historyTimer = useRef(null);
  const transaction = useRef(null);
  const leaving = useRef(false);

  const [config, setConfig] = useState(initialConfig || {});
  const theme = useMemo(() => resolveTheme(config), [config]);
  const initialNodes = useMemo(() => mapa.nodes.map((n) => ({
    id: String(n.id),
    type: n.type || "TEXT",
    position: n.position || { x: 100, y: 100 },
    data: { ...initialData(n.type || "TEXT"), ...(n.data || {}) }
  })), [mapa.nodes]);
  const initialEdges = useMemo(() => mapa.edges.map((e) => ({
    ...e,
    id: String(e.id),
    source: String(e.source),
    target: String(e.target),
    sourceHandle: e.sourceHandle || "right-source",
    targetHandle: e.targetHandle || "left-target",
    style: EDGE_STYLE
  })), [mapa.edges]);

  const [nodes, setNodesState] = useState(initialNodes);
  const [edges, setEdgesState] = useState(initialEdges);
  const nodesRef = useRef(initialNodes);
  const edgesRef = useRef(initialEdges);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editingEdgeId, setEditingEdgeId] = useState(null);
  const [focusedNodeId, setFocusedNodeId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [clock, setClock] = useState(clockText());
  const [noteOpen, setNoteOpen] = useState(!!mapa.nota_flutuante);
  const [note, setNote] = useState(mapa.nota_flutuante || "");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchIndex, setSearchIndex] = useState(0);
  const [context, setContext] = useState(null);
  const [clipboard, setClipboard] = useState([]);
  const [clipboardOpen, setClipboardOpen] = useState(false);
  const [dragSelect, setDragSelect] = useState(null);
  const [imageDrag, setImageDrag] = useState(false);

  const setNodes = useCallback((update) => setNodesState((current) => {
    const next = typeof update === "function" ? update(current) : update;
    nodesRef.current = next;
    return next;
  }), []);
  const setEdges = useCallback((update) => setEdgesState((current) => {
    const next = typeof update === "function" ? update(current) : update;
    edgesRef.current = next;
    return next;
  }), []);

  useEffect(() => {
    document.documentElement.style.setProperty("--bw-accent", theme.primary);
    document.documentElement.style.setProperty("--bw-bg", theme.secondary);
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => setClock(clockText()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (initialConfig) setConfig(initialConfig);
  }, [initialConfig]);

  const capture = useCallback(() => ({
    nodes: clone(payload(nodesRef.current, edgesRef.current).nodes),
    edges: clone(payload(nodesRef.current, edgesRef.current).edges)
  }), []);
  const serial = (value) => JSON.stringify(value);
  const pushHistory = useCallback((item, compare = true) => {
    if (compare && serial(item) === serial(capture())) return;
    if (!past.current.length || serial(past.current[past.current.length - 1]) !== serial(item)) past.current.push(item);
    if (past.current.length > HISTORY_LIMIT) past.current.shift();
    future.current = [];
  }, [capture]);
  const commitHistory = useCallback(() => {
    if (historyTimer.current) clearTimeout(historyTimer.current);
    historyTimer.current = null;
    if (pending.current) {
      pushHistory(pending.current);
      pending.current = null;
    }
  }, [pushHistory]);
  const beginHistory = useCallback(() => {
    if (!pending.current && !transaction.current) pending.current = capture();
    if (historyTimer.current) clearTimeout(historyTimer.current);
    historyTimer.current = setTimeout(commitHistory, DATA_HISTORY_DELAY);
  }, [capture, commitHistory]);
  const beginTransaction = useCallback(() => {
    commitHistory();
    if (!transaction.current) transaction.current = capture();
  }, [capture, commitHistory]);
  const finishTransaction = useCallback(() => {
    if (transaction.current) {
      pushHistory(transaction.current);
      transaction.current = null;
    }
  }, [pushHistory]);

  const undo = useCallback(() => {
    finishTransaction();
    commitHistory();
    const previous = past.current.pop();
    if (!previous) return;
    future.current.push(capture());
    setNodes(previous.nodes);
    setEdges(previous.edges);
  }, [capture, commitHistory, finishTransaction, setEdges, setNodes]);

  const redo = useCallback(() => {
    commitHistory();
    const next = future.current.pop();
    if (!next) return;
    past.current.push(capture());
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [capture, commitHistory, setEdges, setNodes]);

  const center = useCallback(() => rf.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }), [rf]);
  const updateNodeData = useCallback((id, partial) => {
    beginHistory();
    setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, ...partial } } : node));
  }, [beginHistory, setNodes]);
  const resizeNode = useCallback((id, partial) => {
    setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, ...partial } } : node));
  }, [setNodes]);
  const enterEdit = useCallback((id) => {
    setFocusedNodeId(id);
    setEditingNodeId(id);
    setEditingEdgeId(null);
    setContext(null);
  }, []);
  const enterEdgeEdit = useCallback((id) => {
    setEditingNodeId(null);
    setEditingEdgeId(id);
    setContext(null);
  }, []);
  const leaveEdit = useCallback(() => {
    commitHistory();
    setEditingNodeId(null);
    setEditingEdgeId(null);
  }, [commitHistory]);

  const createNode = useCallback((type, pos, data = {}) => {
    pushHistory(capture(), false);
    const node = {
      id: uid("node"),
      type,
      position: pos || center(),
      data: { ...initialData(type), ...data }
    };
    setNodes((current) => [...current, node]);
    setFocusedNodeId(node.id);
    setEditingNodeId(node.id);
    setAddOpen(false);
  }, [capture, center, pushHistory, setNodes]);

  const addNode = useCallback((type) => {
    const position = center();
    const offset = (nodesRef.current.length % 5) * 25;
    createNode(type, { x: position.x + offset, y: position.y + offset });
  }, [center, createNode]);

  const createImage = useCallback(async (file, pos) => {
    if (!file?.type?.startsWith("image/")) return alert("Escolha uma imagem válida.");
    if (file.size > IMAGE_MAX_BYTES) return alert("Imagem muito grande. Limite de 4 MB.");
    const src = await fileData(file);
    const dim = await imageDimensions(src);
    const max = 420;
    const scale = Math.min(1, max / dim.width, max / dim.height);
    createNode("IMAGE", pos, {
      label: file.name,
      src,
      mimeType: file.type,
      size: file.size,
      naturalWidth: dim.width,
      naturalHeight: dim.height,
      width: Math.max(40, Math.round(dim.width * scale)),
      height: Math.max(40, Math.round(dim.height * scale))
    });
  }, [createNode]);

  const replaceImage = useCallback(async (file) => {
    const id = replaceImageNode.current;
    if (!file || !id) return;
    if (!file.type?.startsWith("image/")) return alert("Escolha uma imagem válida.");
    if (file.size > IMAGE_MAX_BYTES) return alert("Imagem muito grande. Limite de 4 MB.");
    const src = await fileData(file);
    const dim = await imageDimensions(src);
    const max = 420;
    const scale = Math.min(1, max / dim.width, max / dim.height);
    updateNodeData(id, {
      src,
      label: file.name,
      naturalWidth: dim.width,
      naturalHeight: dim.height,
      width: Math.max(40, Math.round(dim.width * scale)),
      height: Math.max(40, Math.round(dim.height * scale))
    });
  }, [updateNodeData]);

  const createEdge = useCallback((connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    if (edgesRef.current.some((edge) => edge.source === connection.source && edge.target === connection.target && edge.sourceHandle === connection.sourceHandle && edge.targetHandle === connection.targetHandle)) return;
    pushHistory(capture(), false);
    setEdges((current) => addEdge({ ...connection, id: uid("edge"), style: EDGE_STYLE, label: "" }, current));
  }, [capture, pushHistory, setEdges]);

  const removeNode = useCallback((id) => {
    pushHistory(capture(), false);
    setNodes((current) => current.filter((node) => node.id !== id));
    setEdges((current) => current.filter((edge) => edge.source !== id && edge.target !== id));
    setContext(null);
  }, [capture, pushHistory, setEdges, setNodes]);

  const removeEdge = useCallback((id) => {
    pushHistory(capture(), false);
    setEdges((current) => current.filter((edge) => edge.id !== id));
    setContext(null);
  }, [capture, pushHistory, setEdges]);

  const addClipboardItem = useCallback((item) => {
    if (config.historico_clipboard_ativo === false) return;
    setClipboard((current) => [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, 6));
  }, [config.historico_clipboard_ativo]);

  const writeClipboard = useCallback(async (item) => {
    if (!navigator.clipboard) return;
    try {
      if (item.kind === "IMAGE" && item.imageSrc && window.ClipboardItem) {
        const response = await fetch(item.imageSrc);
        const blob = await response.blob();
        await navigator.clipboard.write([new ClipboardItem({ [item.mimeType || "image/png"]: blob })]);
        return;
      }
      if (item.kind === "TEXT") {
        await navigator.clipboard.writeText(item.text || "");
        return;
      }
      if (item.kind === "MULTI") {
        await navigator.clipboard.writeText("múltiplas seleções");
        return;
      }
      if (item.kind === "EDGE") {
        await navigator.clipboard.writeText(item.label || "");
        return;
      }
      if (item.kind === "NODE") {
        const node = item.nodes?.[0];
        const text = node?.type === "TEXT"
          ? node.data?.label || ""
          : item.label || node?.type || "node";
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Alguns navegadores bloqueiam acesso ao clipboard fora de HTTPS ou sem gesto do usuário.
    }
  }, []);

  const makeNodeItem = useCallback((node) => ({
    id: uid("clip"),
    label: node.type === "TEXT" ? (node.data?.label || "texto").slice(0, 80) : node.type.toLowerCase(),
    nodes: clone([{ id: node.id, type: node.type, position: node.position, data: cleanData(node.data) }]),
    edges: [],
    kind: "NODE",
    previewType: node.type
  }), []);

  const makeEdgeItem = useCallback((edge) => ({
    id: uid("clip"),
    label: edge.label || "",
    nodes: [],
    edges: clone([{ id: edge.id, source: edge.source, target: edge.target, sourceHandle: edge.sourceHandle, targetHandle: edge.targetHandle, label: edge.label || "" }]),
    kind: "EDGE"
  }), []);

  const copySelection = useCallback(async () => {
    const selectedNodes = nodesRef.current.filter((node) => node.selected);
    const selectedEdges = edgesRef.current.filter((edge) => edge.selected);
    let nodesToCopy = selectedNodes;
    if (!nodesToCopy.length && !selectedEdges.length && focusedNodeId) {
      const focused = nodesRef.current.find((node) => node.id === focusedNodeId);
      if (focused) nodesToCopy = [focused];
    }
    if (!nodesToCopy.length && !selectedEdges.length) return;

    const isMulti = nodesToCopy.length + selectedEdges.length > 1;
    const item = isMulti
      ? {
          id: uid("clip"),
          label: "múltiplas seleções",
          nodes: clone(nodesToCopy.map((node) => ({ id: node.id, type: node.type, position: node.position, data: cleanData(node.data) }))),
          edges: clone(selectedEdges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target, sourceHandle: edge.sourceHandle, targetHandle: edge.targetHandle, label: edge.label || "" }))),
          kind: "MULTI"
        }
      : makeNodeItem(nodesToCopy[0]);

    if (item.kind === "NODE" && item.previewType === "IMAGE") {
      item.kind = "IMAGE";
      item.imageSrc = item.nodes[0]?.data?.src;
      item.mimeType = item.nodes[0]?.data?.mimeType || "image/png";
    }
    await writeClipboard(item);
    addClipboardItem(item);
  }, [addClipboardItem, focusedNodeId, makeNodeItem, writeClipboard]);

  const copyEdge = useCallback(async (edge) => {
    if (!edge) return;
    const item = makeEdgeItem(edge);
    await writeClipboard(item);
    addClipboardItem(item);
  }, [addClipboardItem, makeEdgeItem, writeClipboard]);

  const recordTextSelection = useCallback((text, node) => {
    if (!text || !node) return;
    const item = {
      id: uid("clip"),
      label: text.slice(0, 80),
      text,
      nodes: [],
      edges: [],
      kind: "TEXT"
    };
    addClipboardItem(item);
  }, [addClipboardItem]);

  const activateClipboard = useCallback(async (item) => {
    if (!item) return;
    await writeClipboard(item);
    setClipboard((current) => [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, 6));
    setClipboardOpen(false);
  }, [writeClipboard]);

  const pasteItem = useCallback((item) => {
    if (item?.kind === "TEXT" && item.text) {
      createNode("TEXT", center(), { label: item.text });
      return;
    }
    if (!item?.nodes?.length) return;
    pushHistory(capture(), false);
    const idMap = new Map();
    const newNodes = item.nodes.map((node) => {
      const id = uid("node");
      idMap.set(node.id, id);
      return { ...clone(node), id, position: { x: node.position.x + 40, y: node.position.y + 40 } };
    });
    const newEdges = item.edges.filter((edge) => idMap.has(edge.source) && idMap.has(edge.target)).map((edge) => ({
      ...edge,
      id: uid("edge"),
      source: idMap.get(edge.source),
      target: idMap.get(edge.target),
      style: EDGE_STYLE
    }));
    setNodes((current) => [...current, ...newNodes]);
    setEdges((current) => [...current, ...newEdges]);
    if (newNodes[0]) setFocusedNodeId(newNodes[0].id);
  }, [capture, center, createNode, pushHistory, setEdges, setNodes]);

  const deleteSelected = useCallback(() => {
    const nodeIds = new Set(nodesRef.current.filter((node) => node.selected).map((node) => node.id));
    const edgeIds = new Set(edgesRef.current.filter((edge) => edge.selected).map((edge) => edge.id));
    if (!nodeIds.size && !edgeIds.size) return;
    pushHistory(capture(), false);
    setNodes((current) => current.filter((node) => !nodeIds.has(node.id)));
    setEdges((current) => current.filter((edge) => !edgeIds.has(edge.id) && !nodeIds.has(edge.source) && !nodeIds.has(edge.target)));
  }, [capture, pushHistory, setEdges, setNodes]);

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    const matches = [];
    nodes.forEach((node) => {
      if (node.type === "TEXT") {
        const text = node.data?.label || "";
        countOccurrences(text.toLowerCase(), query).forEach((index) => matches.push({ nodeId: node.id, index, type: "TEXT" }));
      }
      if (node.type === "CHECKLIST") {
        (node.data?.items || []).forEach((item, itemIndex) => {
          const text = item.label || "";
          countOccurrences(text.toLowerCase(), query).forEach((index) => matches.push({ nodeId: node.id, itemIndex, index, type: "CHECKLIST" }));
        });
      }
    });
    return matches;
  }, [nodes, search]);

  const activeSearchResult = results.length ? results[Math.min(searchIndex, results.length - 1)] : null;
  useEffect(() => {
    if (!activeSearchResult) return;
    const node = nodes.find((entry) => entry.id === activeSearchResult.nodeId);
    if (!node) return;
    setSearchIndex((index) => Math.min(index, results.length - 1));
    rf.setCenter(
      node.position.x + (Number(node.data?.width) || 240) / 2,
      node.position.y + (Number(node.data?.height) || 170) / 2,
      { zoom: rf.getViewport().zoom, duration: 250 }
    );
  }, [activeSearchResult, nodes, results.length, rf]);

  const saveQueue = useCallback((data) => {
    const next = saveQueueRef.current.catch(() => {}).then(() => salvarMapa(mapa.id, data));
    saveQueueRef.current = next;
    return next;
  }, [mapa.id]);

  const handleWheel = useCallback((e) => {
    if (e.target.closest?.("textarea,input,button,select")) return;
    e.preventDefault();
    const viewport = rf.getViewport();
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.ctrlKey) {
      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      const zoom = Math.min(4, Math.max(0.2, viewport.zoom * factor));
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      rf.setViewport({ x: px - (px - viewport.x) * (zoom / viewport.zoom), y: py - (py - viewport.y) * (zoom / viewport.zoom), zoom });
      return;
    }
    if (e.shiftKey) {
      rf.setViewport({ ...viewport, x: viewport.x - e.deltaY });
      return;
    }
    rf.setViewport({ ...viewport, y: viewport.y - e.deltaY });
  }, [rf]);

  const saveSettings = useCallback(async (patch) => {
    const response = await atualizarPreferenciasUsuario(patch);
    const next = response.configuracao || response;
    setConfig(next);
    updateUser({ configuracao: next });
    return response;
  }, [updateUser]);

  const saveNote = useCallback(async (value) => {
    setNote(value);
    await salvarConfiguracaoMapa(mapa.id, { nota_flutuante: value });
  }, [mapa.id]);

  useEffect(() => {
    if (leaving.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveQueue(payload(nodes, edges)).catch(console.error), 1000);
    return () => clearTimeout(saveTimer.current);
  }, [nodes, edges, saveQueue]);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setSearchIndex(0);
    setTimeout(() => document.querySelector(".bw-search-input")?.focus(), 0);
  }, []);

  useEffect(() => {
    const onKeyDown = async (e) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "f" && !e.altKey) {
        e.preventDefault();
        openSearch();
        return;
      }
      if (mod && !e.altKey && !isInput(e)) {
        if (key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
          return;
        }
        if (key === "y" || (key === "z" && e.shiftKey)) {
          e.preventDefault();
          redo();
          return;
        }
        if (key === "c") {
          e.preventDefault();
          await copySelection();
          return;
        }
        if (key === "v") {
          e.preventDefault();
          if (clipboard[0]) pasteItem(clipboard[0]);
          return;
        }
      }
      if (e.key === "Delete" && !isInput(e)) {
        e.preventDefault();
        deleteSelected();
        return;
      }
      if (e.key === "Escape") {
        setContext(null);
        setSearchOpen(false);
        setSettingsOpen(false);
        leaveEdit();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clipboard, copySelection, deleteSelected, leaveEdit, openSearch, pasteItem, redo, undo]);

  useEffect(() => {
    const onCopy = (event) => {
      const target = event.target;
      const nodeElement = target?.closest?.(".react-flow__node");
      if (!nodeElement) return;
      const id = nodeElement.getAttribute("data-id");
      const node = nodesRef.current.find((entry) => entry.id === id);
      if (!node) return;
      if ((target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) && target.selectionStart !== target.selectionEnd) {
        recordTextSelection(target.value.slice(target.selectionStart, target.selectionEnd), node);
        return;
      }
      if (target instanceof HTMLImageElement && node.type === "IMAGE") {
        const item = {
          id: uid("clip"),
          label: node.data?.label || "imagem",
          imageSrc: node.data?.src || "",
          mimeType: node.data?.mimeType || "image/png",
          nodes: clone([{ id: node.id, type: node.type, position: node.position, data: cleanData(node.data) }]),
          edges: [],
          kind: "IMAGE",
          previewType: "IMAGE"
        };
        addClipboardItem(item);
      }
    };
    document.addEventListener("copy", onCopy);
    return () => document.removeEventListener("copy", onCopy);
  }, [addClipboardItem, recordTextSelection]);

  useEffect(() => {
    let timerEdit = null;
    let timerContext = null;
    let active = null;
    let startX = 0;
    let startY = 0;

    const clear = () => {
      if (timerEdit) clearTimeout(timerEdit);
      if (timerContext) clearTimeout(timerContext);
      timerEdit = null;
      timerContext = null;
      active = null;
    };

    const onDown = (e) => {
      if (e.pointerType !== "touch") return;
      if (e.target.closest?.(".bw-context-menu,.bw-sticky,.bw-node-menu,input,textarea,button,select")) return;

      const nodeElement = e.target.closest?.(".react-flow__node");
      const edgeElement = e.target.closest?.(".react-flow__edge");
      const pane = !nodeElement && !edgeElement;
      const id = nodeElement?.getAttribute("data-id") || edgeElement?.getAttribute("data-id");
      if (!pane && !id) return;

      active = { type: pane ? "pane" : nodeElement ? "node" : "edge", id };
      startX = e.clientX;
      startY = e.clientY;

      timerEdit = setTimeout(() => {
        if (!active) return;
        if (active.type === "node") enterEdit(active.id);
        if (active.type === "edge") enterEdgeEdit(active.id);
      }, 3000);

      timerContext = setTimeout(() => {
        if (!active) return;
        setContext({ x: e.clientX, y: e.clientY, ...(active.type === "node" ? { nodeId: active.id } : active.type === "edge" ? { edgeId: active.id } : { general: true }) });
        if (active.type === "node") enterEdit(active.id);
        if (active.type === "edge") enterEdgeEdit(active.id);
      }, 8000);
    };

    const onMove = (e) => {
      if (!active || e.pointerType !== "touch") return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > 14) clear();
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", clear);
    window.addEventListener("pointercancel", clear);
    window.addEventListener("pointermove", onMove);
    return () => {
      clear();
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", clear);
      window.removeEventListener("pointercancel", clear);
      window.removeEventListener("pointermove", onMove);
    };
  }, [enterEdgeEdit, enterEdit]);

  useEffect(() => {
    const onDown = (e) => {
      if (e.button !== 2) return;
      const pane = !e.target.closest(".react-flow__node,.react-flow__edge,.bw-sticky,.bw-context-menu");
      if (!pane) return;
      const start = { x: e.clientX, y: e.clientY };
      setDragSelect({ start, current: start });
      const move = (event) => setDragSelect((current) => current ? { ...current, current: { x: event.clientX, y: event.clientY } } : current);
      const up = () => {
        setDragSelect((selection) => {
          if (!selection) return null;
          const left = Math.min(selection.start.x, selection.current.x);
          const right = Math.max(selection.start.x, selection.current.x);
          const top = Math.min(selection.start.y, selection.current.y);
          const bottom = Math.max(selection.start.y, selection.current.y);
          const viewport = rf.getViewport();
          setNodes((current) => current.map((node) => {
            const width = Number(node.data?.width) || 240;
            const height = Number(node.data?.height) || 170;
            const x = node.position.x * viewport.zoom + viewport.x;
            const y = node.position.y * viewport.zoom + viewport.y;
            const hit = x < right && x + width * viewport.zoom > left && y < bottom && y + height * viewport.zoom > top;
            return hit ? { ...node, selected: true } : node;
          }));
          return null;
        });
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [rf, setNodes]);

  const nodeContext = (event, node) => {
    event.preventDefault();
    event.stopPropagation();
    setContext({ x: event.clientX, y: event.clientY, nodeId: node.id });
  };
  const edgeContext = (event, edge) => {
    event.preventDefault();
    event.stopPropagation();
    setContext({ x: event.clientX, y: event.clientY, edgeId: edge.id });
  };
  const paneClick = () => {
    if (context) {
      setContext(null);
      return;
    }
    setClipboardOpen(false);
    setSettingsOpen(false);
    setAddOpen(false);
    setFocusedNodeId(null);
    if (searchOpen) setSearchOpen(false);
    leaveEdit();
  };
  const nodeClick = (event, node) => {
    if (context) {
      setContext(null);
      return;
    }
    if (event.nativeEvent?.pointerType === "touch" && editingNodeId) {
      setNodes((current) => current.map((entry) => entry.id === node.id ? { ...entry, selected: !entry.selected } : entry));
      return;
    }
    setFocusedNodeId(node.id);
  };
  const nodeDouble = (event, node) => {
    event.stopPropagation();
    enterEdit(node.id);
  };
  const onChanges = (changes) => setNodes((current) => applyNodeChanges(changes, current));
  const edgeChanges = (changes) => {
    if (changes.some((change) => change.type === "remove")) pushHistory(capture(), false);
    setEdges((current) => applyEdgeChanges(changes, current));
  };
  const onResizeConfig = async (key, value) => {
    setConfig((current) => ({ ...current, [key]: value }));
    await saveSettings({ [key]: value });
  };
  const chooseTheme = async (name) => {
    const next = { ...config, cor_mapa: name };
    setConfig(next);
    updateUser({ configuracao: next });
    await saveSettings({ cor_mapa: name });
  };
  const copySelectionForNode = useCallback(async (node) => {
    if (!node) return;
    const item = makeNodeItem(node);
    if (item.previewType === "IMAGE") {
      item.kind = "IMAGE";
      item.imageSrc = item.nodes[0]?.data?.src;
      item.mimeType = item.nodes[0]?.data?.mimeType || "image/png";
    }
    await writeClipboard(item);
    addClipboardItem(item);
  }, [addClipboardItem, makeNodeItem, writeClipboard]);

  const contextNode = nodes.find((node) => node.id === context?.nodeId);
  const contextEdge = edges.find((edge) => edge.id === context?.edgeId);

  return (
    <div
      className="bw-map-root"
      style={{ background: theme.secondary }}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDownCapture={(e) => {
        if (context && !e.target.closest?.(".bw-context-menu")) setContext(null);
      }}
      onClick={(e) => { if (e.target === e.currentTarget) paneClick(); }}
      onDragOver={(e) => {
        if ([...e.dataTransfer.types].includes("Files")) {
          e.preventDefault();
          setImageDrag(true);
        }
      }}
      onDragLeave={() => setImageDrag(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setImageDrag(false);
        const file = [...e.dataTransfer.files].find((entry) => entry.type.startsWith("image/"));
        if (file) await createImage(file, rf.screenToFlowPosition({ x: e.clientX, y: e.clientY }));
      }}
    >
      {searchOpen && (
        <div className="bw-search-sticky">
          <input className="bw-search-input" value={search} onChange={(e) => { setSearch(e.target.value); setSearchIndex(0); }} placeholder="pesquisar no mapa..." />
          <button onClick={() => setSearchIndex((index) => results.length ? (index - 1 + results.length) % results.length : 0)} aria-label="resultado anterior">←</button>
          <span>{results.length ? `${Math.min(searchIndex + 1, results.length)}/${results.length}` : "0/0"}</span>
          <button onClick={() => setSearchIndex((index) => results.length ? (index + 1) % results.length : 0)} aria-label="próximo resultado">→</button>
        </div>
      )}

      <div className="bw-topbar bw-sticky">
        <div style={{ position: "relative" }}>
          <button className="bw-toolbar-button" onClick={() => setAddOpen((value) => !value)}>+ adicionar nó</button>
          {addOpen && <div className="bw-node-menu">
            <button onClick={() => addNode("TEXT")}>caixa de texto</button>
            <button onClick={() => addNode("CHECKLIST")}>lista</button>
            <button onClick={() => imageInput.current?.click()}>imagem</button>
            <button onClick={() => addNode("EMBED")}>embed</button>
            <button onClick={() => addNode("CALCULATOR")}>calculadora</button>
          </div>}
        </div>
        <input ref={imageInput} type="file" accept="image/*" hidden onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (replaceImageNode.current) {
            await replaceImage(file);
            replaceImageNode.current = null;
          } else if (file) await createImage(file);
        }} />
        <button className="bw-toolbar-button bw-logout" onClick={async () => {
          leaving.current = true;
          commitHistory();
          await saveQueue(payload(nodesRef.current, edgesRef.current)).catch(() => {});
          logout();
        }}>salvar e sair</button>
      </div>

      {config.nota_flutuante_ativa !== false && (
        <div className={`bw-floating-note bw-sticky ${noteOpen ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
          {noteOpen
            ? <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => { setNoteOpen(false); saveNote(note); }} placeholder="nota rápida..." />
            : <button onClick={() => setNoteOpen(true)} aria-label="nota rápida">✎</button>}
        </div>
      )}

      {config.relogio_ativo !== false && (
        <div className="bw-map-clock bw-sticky">
          <span className="bw-clock-long">{clock.long}</span>
          <span className="bw-clock-short">{clock.short}</span>
        </div>
      )}

      {config.historico_clipboard_ativo !== false && (
        <div className={`bw-clipboard ${clipboardOpen ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setClipboardOpen((value) => !value)} className="bw-clipboard-peek" aria-label="histórico de clipboard">▣</button>
          {clipboardOpen && (
            <div className="bw-clipboard-list">
              {clipboard.length
                ? clipboard.map((item) => (
                    <button key={item.id} className="bw-clipboard-entry" onClick={() => activateClipboard(item)}>
                      <ClipboardPreview item={item} />
                    </button>
                  ))
                : <span>clipboard vazio</span>}
            </div>
          )}
        </div>
      )}

      <button className="bw-config-sticky bw-sticky" onClick={(e) => { e.stopPropagation(); setSettingsOpen((value) => !value); }} aria-label="configurações">⚙</button>
      {settingsOpen && <div className="bw-config-panel bw-sticky" onClick={(e) => e.stopPropagation()}>
        <strong>CONFIG</strong>
        <label>tema<select value={config.cor_mapa || "BRAINWEB"} onChange={(e) => chooseTheme(e.target.value)}>{Object.keys(THEMES).map((key) => <option key={key} value={key}>{THEMES[key].name}</option>)}</select></label>
        {[1, 2].map((index) => <React.Fragment key={index}>
          <label>custom {index} primária<input value={config[`custom_${index}_primaria`] || "#48abb3"} onChange={(e) => setConfig((current) => ({ ...current, [`custom_${index}_primaria`]: e.target.value }))} onBlur={() => saveSettings({ [`custom_${index}_primaria`]: config[`custom_${index}_primaria`] })} /></label>
          <label>custom {index} secundária<input value={config[`custom_${index}_secundaria`] || "#0f2f33"} onChange={(e) => setConfig((current) => ({ ...current, [`custom_${index}_secundaria`]: e.target.value }))} onBlur={() => saveSettings({ [`custom_${index}_secundaria`]: config[`custom_${index}_secundaria`] })} /></label>
        </React.Fragment>)}
        <label><input type="checkbox" checked={config.historico_clipboard_ativo !== false} onChange={(e) => onResizeConfig("historico_clipboard_ativo", e.target.checked)} /> histórico de clipboard</label>
        <label><input type="checkbox" checked={!!config.imagem_deformavel} onChange={(e) => onResizeConfig("imagem_deformavel", e.target.checked)} /> deformar imagens livremente</label>
        <label><input type="checkbox" checked={config.nota_flutuante_ativa !== false} onChange={(e) => onResizeConfig("nota_flutuante_ativa", e.target.checked)} /> nota flutuante</label>
        <label><input type="checkbox" checked={config.relogio_ativo !== false} onChange={(e) => onResizeConfig("relogio_ativo", e.target.checked)} /> relógio</label>
      </div>}

      {context && <div className="bw-context-menu" style={{ left: context.x, top: context.y }} onClick={(e) => e.stopPropagation()}>
        {contextNode && <>
          <button onClick={() => enterEdit(contextNode.id)}>MODIFICAR TEXTO</button>
          <button onClick={() => { copySelectionForNode(contextNode); setContext(null); }}>COPIAR</button>
          <button onClick={() => removeNode(contextNode.id)}>EXCLUIR</button>
          {contextNode.type === "TEXT" && <div className="bw-color-grid">{["default", "green", "yellow", "red", "white", "transparent"].map((color) => <button key={color} title={color} style={{ background: color === "default" ? theme.primary : color === "green" ? "#34d46a" : color === "yellow" ? "#f1d44b" : color === "red" ? "#f05252" : color === "white" ? "#fff" : "rgba(255,255,255,.3)" }} onClick={() => { updateNodeData(contextNode.id, { textColor: color }); setContext(null); }} />)}</div>}
          {contextNode.type === "IMAGE" && <>
            <button onClick={() => { replaceImageNode.current = contextNode.id; imageInput.current?.click(); setContext(null); }}>TROCAR IMAGEM</button>
            <button onClick={() => {
              const naturalWidth = Number(contextNode.data.naturalWidth) || 240;
              const naturalHeight = Number(contextNode.data.naturalHeight) || 180;
              const scale = Math.min(1, 420 / naturalWidth, 420 / naturalHeight);
              updateNodeData(contextNode.id, { width: Math.max(40, Math.round(naturalWidth * scale)), height: Math.max(40, Math.round(naturalHeight * scale)) });
              setContext(null);
            }}>RESETAR DIMENSÕES</button>
          </>}
          {contextNode.type === "CHECKLIST" && <button onClick={() => { const items = contextNode.data.items || []; const all = items.length > 0 && items.every((item) => item.checked); updateNodeData(contextNode.id, { items: items.map((item) => ({ ...item, checked: !all })) }); setContext(null); }}>MARCAR/DESMARCAR TODOS</button>}
          {contextNode.type === "EMBED" && <button onClick={() => enterEdit(contextNode.id)}>TROCAR LINK</button>}
        </>}
        {contextEdge && <>
          <button onClick={() => enterEdgeEdit(contextEdge.id)}>MODIFICAR TEXTO</button>
          <button onClick={() => { copyEdge(contextEdge); setContext(null); }}>COPIAR</button>
          <button onClick={() => removeEdge(contextEdge.id)}>EXCLUIR</button>
        </>}
        {context?.general && <>
          <button onClick={() => { createNode("TEXT", rf.screenToFlowPosition({ x: context.x, y: context.y })); setContext(null); }}>CRIAR NÓ</button>
          <button onClick={() => { if (clipboard[0]) pasteItem(clipboard[0]); setContext(null); }}>COLAR</button>
          <button onClick={() => { setContext(null); openSearch(); }}>PESQUISAR</button>
        </>}
      </div>}

      {imageDrag && <div className="bw-image-drop">solte a imagem para criar um nó</div>}
      {dragSelect && <div className="bw-selection-box" style={{ left: Math.min(dragSelect.start.x, dragSelect.current.x), top: Math.min(dragSelect.start.y, dragSelect.current.y), width: Math.abs(dragSelect.current.x - dragSelect.start.x), height: Math.abs(dragSelect.current.y - dragSelect.start.y) }} />}

      <ReactFlow
        nodes={nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            editing: editingNodeId === node.id,
            imageDeformable: !!config.imagem_deformavel,
            onChange: updateNodeData,
            onResize: resizeNode,
            onResizeStart: beginTransaction,
            onResizeEnd: finishTransaction
          }
        }))}
        edges={edges.map((edge) => ({ ...edge, style: EDGE_STYLE }))}
        nodeTypes={nodeTypes}
        onNodesChange={onChanges}
        onEdgesChange={edgeChanges}
        onConnect={createEdge}
        onNodeClick={nodeClick}
        onNodeDoubleClick={nodeDouble}
        onNodeContextMenu={nodeContext}
        onEdgeContextMenu={edgeContext}
        onPaneClick={paneClick}
        onPaneDoubleClick={(e) => { e.preventDefault(); rf.fitView({ duration: 250, padding: 0.1 }); }}
        onPaneContextMenu={(e) => e.preventDefault()}
        onNodeDragStart={beginTransaction}
        onNodeDragStop={finishTransaction}
        onEdgeDoubleClick={(e, edge) => { e.stopPropagation(); enterEdgeEdit(edge.id); }}
        selectionOnDrag
        selectNodesOnDrag
        elementsSelectable
        nodesConnectable
        nodesDraggable
        panOnDrag
        zoomOnScroll={false}
        zoomOnPinch
        zoomOnDoubleClick={false}
        deleteKeyCode={null}
        fitView
        defaultEdgeOptions={{ style: EDGE_STYLE, type: "default" }}
        connectionLineStyle={EDGE_STYLE}
      >
        <Background color="rgba(255,255,255,.12)" gap={24} size={1.5} />
        <Controls className="bw-flow-controls" />
        {edges.map((edge) => editingEdgeId === edge.id && <EdgeLabelRenderer key={edge.id}>
          <div className="bw-edge-editor" style={{ left: 0, top: 0 }}>
            <input autoFocus value={edge.label || ""} onChange={(event) => { beginHistory(); setEdges((current) => current.map((entry) => entry.id === edge.id ? { ...entry, label: event.target.value } : entry)); }} onBlur={leaveEdit} />
          </div>
        </EdgeLabelRenderer>)}
      </ReactFlow>
    </div>
  );
}