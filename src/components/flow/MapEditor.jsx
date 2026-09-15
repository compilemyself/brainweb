import React, {
  useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import ReactFlow, {
  addEdge, applyEdgeChanges, applyNodeChanges,
  Background, Controls, EdgeLabelRenderer, getBezierPath,
  Position, useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import { AuthContext } from "../../context/AuthContext";
import { nodeTypes } from "./nodeTypes";
import { salvarMapa, salvarConfiguracaoMapa } from "../../services/mapasApi";
import { atualizarPreferenciasUsuario } from "../../services/usuarioApi";

const EDGE_STYLE = { stroke: "rgba(255,255,255,0.72)", strokeWidth: 2 };
const IMAGE_MAX_BYTES = 4 * 1024 * 1024;
const HISTORY_LIMIT = 80;
const DATA_HISTORY_DELAY = 650;
const COLORS = [
  "#48abb3", "#47b393", "#47b36d", "#74b347", "#b3af47", "#b37d47",
  "#b34747", "#b3479a", "#8d47b3", "#5d47b3", "#4768b3",
];

function generateId(prefix) {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getInitialDataByType(type) {
  if (type === "CHECKLIST") {
    return {
      width: 260, height: 220,
      items: [{ id: generateId("item"), label: "Novo item", checked: false }],
    };
  }
  if (type === "IMAGE") return { width: 240, height: 190, label: "Imagem", src: "" };
  return { width: 240, height: 170, label: "Novo texto" };
}

function isTextEditingElement(element) {
  const tag = element?.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || !!element?.isContentEditable;
}

function removeRuntimeData(data = {}) {
  return Object.fromEntries(Object.entries(data).filter(([key]) => ![
    "onChange", "onEditEnd", "onResize", "onResizeStart", "onResizeEnd",
    "edgeMode", "isEdgeSource", "isSelected", "editing", "accentColor",
  ].includes(key)));
}

function buildFlowPayload(nodes, edges) {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type || "TEXT",
      position: node.position,
      data: removeRuntimeData(node.data),
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label || "",
    })),
  };
}

function snapshot(nodes, edges) {
  const payload = buildFlowPayload(nodes, edges);

  return {
    nodes: payload.nodes.map((node) => ({
      ...node,
      position: { ...node.position },
      data: JSON.parse(JSON.stringify(node.data || {})),
    })),
    edges: payload.edges.map((edge) => ({ ...edge, style: EDGE_STYLE })),
  };
}

function serialize(value) {
  return JSON.stringify(buildFlowPayload(value.nodes, value.edges));
}

function readImageFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getClockText() {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date());
}

export default function MapEditor({ mapa }) {
  const { user, logout, updateUser } = useContext(AuthContext);
  const reactFlow = useReactFlow();
  const imageInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const saveQueueRef = useRef(Promise.resolve());
  const leavingRef = useRef(false);
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const pendingHistoryRef = useRef(null);
  const historyTimeoutRef = useRef(null);
  const transactionRef = useRef(null);

  const initialNodes = useMemo(() => (mapa.nodes || []).map((node) => ({
    id: String(node.id),
    type: node.type || "TEXT",
    position: node.position || { x: 100, y: 100 },
    data: { ...getInitialDataByType(node.type || "TEXT"), ...(node.data || {}) },
  })), [mapa.nodes]);

  const initialEdges = useMemo(() => (mapa.edges || []).map((edge) => ({
    id: String(edge.id),
    source: String(edge.source),
    target: String(edge.target),
    label: edge.label || "",
    style: EDGE_STYLE,
  })), [mapa.edges]);

  const [nodes, setNodesState] = useState(initialNodes);
  const [edges, setEdgesState] = useState(initialEdges);
  const nodesRef = useRef(initialNodes);
  const edgesRef = useRef(initialEdges);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [focusedNodeId, setFocusedNodeId] = useState(null);
  const [editingEdgeId, setEditingEdgeId] = useState(null);
  const copiedNodeRef = useRef(null);
  const [nodeMenuOpen, setNodeMenuOpen] = useState(false);
  const [edgeMode, setEdgeMode] = useState(false);
  const [connectionSourceId, setConnectionSourceId] = useState(null);
  const [isImageDragActive, setIsImageDragActive] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clock, setClock] = useState(getClockText());
  const [noteOpen, setNoteOpen] = useState(!!mapa.nota_flutuante);
  const [note, setNote] = useState(mapa.nota_flutuante || "");
  const [calendarEnabled, setCalendarEnabled] = useState(mapa.relogio_ativo !== false);
  const [noteEnabled, setNoteEnabled] = useState(mapa.nota_flutuante_ativa !== false);
  const [accentColor, setAccentColor] = useState(user?.cor_mapa || "#48abb3");

  const setNodes = useCallback((updater) => setNodesState((current) => {
    const next = typeof updater === "function" ? updater(current) : updater;
    nodesRef.current = next;
    return next;
  }), []);

  const setEdges = useCallback((updater) => setEdgesState((current) => {
    const next = typeof updater === "function" ? updater(current) : updater;
    edgesRef.current = next;
    return next;
  }), []);

  useEffect(() => {
    document.documentElement.style.setProperty("--bw-accent", accentColor);
  }, [accentColor]);

  useEffect(() => {
    const id = setInterval(() => setClock(getClockText()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (user?.cor_mapa) setAccentColor(user.cor_mapa);
  }, [user?.cor_mapa]);

  const capture = useCallback(() => snapshot(nodesRef.current, edgesRef.current), []);

  const pushHistory = useCallback((item, compare = true) => {
    if (compare && serialize(item) === serialize(capture())) return;

    const past = pastRef.current;
    if (!past.length || serialize(past[past.length - 1]) !== serialize(item)) past.push(item);
    if (past.length > HISTORY_LIMIT) past.splice(0, past.length - HISTORY_LIMIT);
    futureRef.current = [];
  }, [capture]);

  const commitHistory = useCallback(() => {
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    historyTimeoutRef.current = null;

    if (pendingHistoryRef.current) {
      pushHistory(pendingHistoryRef.current);
      pendingHistoryRef.current = null;
    }
  }, [pushHistory]);

  const beginDataHistory = useCallback(() => {
    if (!pendingHistoryRef.current && !transactionRef.current) {
      pendingHistoryRef.current = capture();
    }

    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    historyTimeoutRef.current = setTimeout(commitHistory, DATA_HISTORY_DELAY);
  }, [capture, commitHistory]);

  const beginTransaction = useCallback(() => {
    commitHistory();
    if (!transactionRef.current) transactionRef.current = capture();
  }, [capture, commitHistory]);

  const finishTransaction = useCallback(() => {
    if (transactionRef.current) {
      pushHistory(transactionRef.current);
      transactionRef.current = null;
    }
  }, [pushHistory]);

  const undo = useCallback(() => {
    finishTransaction();
    commitHistory();

    const previous = pastRef.current.pop();
    if (!previous) return;

    futureRef.current.push(capture());
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setEditingNodeId(null);
    setEditingEdgeId(null);
  }, [capture, commitHistory, finishTransaction, setEdges, setNodes]);

  const redo = useCallback(() => {
    commitHistory();

    const next = futureRef.current.pop();
    if (!next) return;

    pastRef.current.push(capture());
    setNodes(next.nodes);
    setEdges(next.edges);
    setEditingNodeId(null);
    setEditingEdgeId(null);
  }, [capture, commitHistory, setEdges, setNodes]);

  const screenToFlowPosition = useCallback((point) => {
    if (reactFlow.screenToFlowPosition) return reactFlow.screenToFlowPosition(point);
    return reactFlow.project(point);
  }, [reactFlow]);

  const center = useCallback(
    () => screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }),
    [screenToFlowPosition]
  );

  const updateNodeData = useCallback((id, partial) => {
    beginDataHistory();
    setNodes((items) => items.map((node) => node.id === id
      ? { ...node, data: { ...node.data, ...partial } }
      : node
    ));
  }, [beginDataHistory, setNodes]);

  const resizeNodeData = useCallback((id, partial) => setNodes((items) => items.map(
    (node) => node.id === id
      ? { ...node, data: { ...node.data, ...partial } }
      : node
  )), [setNodes]);

  const enterNodeEdit = useCallback((id) => {
    setFocusedNodeId(id);
    setEditingNodeId(id);
    setEditingEdgeId(null);
    setNodeMenuOpen(false);
  }, []);

  const leaveEditing = useCallback(() => {
    commitHistory();
    setEditingNodeId(null);
    setEditingEdgeId(null);
  }, [commitHistory]);

  const createNode = useCallback((type, position, data = {}) => {
    pushHistory(capture(), false);

    const node = {
      id: generateId("node"),
      type,
      position,
      data: { ...getInitialDataByType(type), ...data },
    };

    setNodes((items) => [...items, node]);
    setFocusedNodeId(node.id);
    setEditingNodeId(node.id);
    setEditingEdgeId(null);
    setNodeMenuOpen(false);
  }, [capture, pushHistory, setNodes]);

  const addNode = useCallback((type, data = {}) => {
    const p = center();
    const offset = (nodesRef.current.length % 6) * 24;
    createNode(type, { x: p.x + offset, y: p.y + offset }, data);
  }, [center, createNode]);

  const createImageNodeFromFile = useCallback(async (file, position) => {
    if (!file?.type?.startsWith("image/")) {
      return alert("Escolha um arquivo de imagem válido.");
    }

    if (file.size > IMAGE_MAX_BYTES) {
      return alert("Imagem muito grande. Escolha um arquivo com até 4 MB.");
    }

    try {
      const src = await readImageFileAsDataUrl(file);
      createNode(
        "IMAGE",
        position || center(),
        { label: file.name, src, mimeType: file.type, size: file.size }
      );
    } catch (error) {
      console.error(error);
      alert("Não foi possível carregar a imagem selecionada.");
    }
  }, [center, createNode]);

  const handleImageSelected = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await createImageNodeFromFile(file);
  }, [createImageNodeFromFile]);

  const createTextFromClipboard = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read?.();

      if (items) {
        for (const item of items) {
          const imageType = item.types.find((type) => type.startsWith("image/"));

          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], "imagem-colada", { type: imageType });
            await createImageNodeFromFile(file);
            return true;
          }
        }
      }

      const text = await navigator.clipboard.readText();
      if (text) {
        createNode("TEXT", center(), { label: text });
        return true;
      }
    } catch (error) {
      console.warn("Clipboard indisponível:", error);
    }

    return false;
  }, [center, createImageNodeFromFile, createNode]);

  const deleteNode = useCallback((id) => {
    pushHistory(capture(), false);
    setNodes((items) => items.filter((n) => n.id !== id));
    setEdges((items) => items.filter((e) => e.source !== id && e.target !== id));
    setEditingNodeId(null);
    setFocusedNodeId(null);
  }, [capture, pushHistory, setEdges, setNodes]);

  const deleteEdge = useCallback((id) => {
    pushHistory(capture(), false);
    setEdges((items) => items.filter((e) => e.id !== id));
    setEditingEdgeId(null);
  }, [capture, pushHistory, setEdges]);

  const createEdgeBetweenNodes = useCallback((source, target) => {
    if (!source || !target || source === target) return;

    if (edgesRef.current.some((e) =>
      (e.source === source && e.target === target) ||
      (e.source === target && e.target === source)
    )) return;

    pushHistory(capture(), false);
    setEdges((items) => addEdge({
      id: generateId("edge"),
      source,
      target,
      style: EDGE_STYLE,
      label: "",
    }, items));
  }, [capture, pushHistory, setEdges]);

  const onConnect = useCallback(
    (connection) => createEdgeBetweenNodes(connection.source, connection.target),
    [createEdgeBetweenNodes]
  );

  const onNodeClick = useCallback((event, node) => {
    if (edgeMode) {
      event.stopPropagation();

      if (!connectionSourceId) {
        setConnectionSourceId(node.id);
      } else {
        createEdgeBetweenNodes(connectionSourceId, node.id);
        setConnectionSourceId(null);
        setEdgeMode(false);
      }

      return;
    }

    setFocusedNodeId(node.id);
    if (editingNodeId === node.id) return;
    setEditingEdgeId(null);
  }, [connectionSourceId, createEdgeBetweenNodes, edgeMode, editingNodeId]);

  const onNodeDoubleClick = useCallback((event, node) => {
    event.stopPropagation();
    enterNodeEdit(node.id);
  }, [enterNodeEdit]);

  const onPaneClick = useCallback(() => {
    setFocusedNodeId(null);
    setNodeMenuOpen(false);
    setConnectionSourceId(null);
    setEdgeMode(false);
    leaveEditing();
  }, [leaveEditing]);

  const onCanvasDoubleClick = useCallback((event) => {
  if (
    event.target.closest?.(".react-flow__node") ||
    event.target.closest?.(".react-flow__edge") ||
    event.target.closest?.(".react-flow__controls") ||
    event.target.closest?.(".bw-toolbar-button") ||
    event.target.closest?.(".bw-map-settings") ||
    event.target.closest?.(".bw-floating-note")
  ) {
    return;
  }

  event.preventDefault();
  reactFlow.fitView({ duration: 200 });
}, [reactFlow]);

  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    setEditingNodeId(null);
    setEditingEdgeId(null);
  }, []);

  const onEdgeDoubleClick = useCallback((event, edge) => {
    event.stopPropagation();
    setEditingNodeId(null);
    setEditingEdgeId(edge.id);
  }, []);

  const onNodesChange = useCallback((changes) => {
    setNodes((items) => applyNodeChanges(changes, items));
  }, [setNodes]);

  const onEdgesChange = useCallback((changes) => {
    if (changes.some((c) => c.type === "remove")) pushHistory(capture(), false);
    setEdges((items) => applyEdgeChanges(changes, items));
  }, [capture, pushHistory, setEdges]);

  const updateEdgeLabel = useCallback((id, label) => {
    beginDataHistory();
    setEdges((items) => items.map((edge) =>
      edge.id === id ? { ...edge, label } : edge
    ));
  }, [beginDataHistory, setEdges]);

  const nodesWithHandlers = useMemo(() => nodes.map((node) => ({
    ...node,
    selected: false,
    draggable: true,
    data: {
      ...node.data,
      accentColor,
      editing: editingNodeId === node.id,
      edgeMode,
      isEdgeSource: node.id === connectionSourceId,
      onChange: updateNodeData,
      onEditEnd: leaveEditing,
      onResize: resizeNodeData,
      onResizeStart: beginTransaction,
      onResizeEnd: finishTransaction,
    },
  })), [
    accentColor, beginTransaction, connectionSourceId, edgeMode,
    editingNodeId, finishTransaction, leaveEditing, nodes,
    resizeNodeData, updateNodeData,
  ]);

  const queueSave = useCallback((payload) => {
    const next = saveQueueRef.current
      .catch(() => undefined)
      .then(() => salvarMapa(mapa.id, payload));

    saveQueueRef.current = next;
    return next;
  }, [mapa.id]);

  const saveCurrent = useCallback(
    () => queueSave(buildFlowPayload(nodesRef.current, edgesRef.current)),
    [queueSave]
  );

  const saveMapSettings = useCallback(async (next) => {
    const data = await salvarConfiguracaoMapa(mapa.id, next);

    setNoteEnabled(data.nota_flutuante_ativa !== false);
    setCalendarEnabled(data.relogio_ativo !== false);
    setNote(data.nota_flutuante || "");
  }, [mapa.id]);

  const cycleColor = useCallback(async () => {
    const index = COLORS.indexOf((accentColor || "#48abb3").toLowerCase());
    const nextColor = COLORS[(index + 1) % COLORS.length];

    setAccentColor(nextColor);
    updateUser({ cor_mapa: nextColor });

    try {
      await atualizarPreferenciasUsuario({ cor_mapa: nextColor });
    } catch (error) {
      console.error("Erro ao salvar cor do mapa:", error);
    }
  }, [accentColor, updateUser]);

  const handleLogout = useCallback(async () => {
    leavingRef.current = true;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    commitHistory();

    await saveQueueRef.current.catch(() => undefined);
    await saveCurrent().catch(() => undefined);
    logout();
  }, [commitHistory, logout, saveCurrent]);

  useEffect(() => {
    const handler = async (event) => {
      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (modifier && !event.altKey) {
        if (key === "z" && !event.shiftKey && !isTextEditingElement(event.target)) {
          event.preventDefault();
          undo();
          return;
        }

        if (
          (key === "y" || (key === "z" && event.shiftKey)) &&
          !isTextEditingElement(event.target)
        ) {
          event.preventDefault();
          redo();
          return;
        }

        if (key === "c" && !isTextEditingElement(event.target)) {
          const node = nodesRef.current.find((n) => n.id === focusedNodeId);

          if (node) {
            event.preventDefault();
            copiedNodeRef.current = JSON.parse(
              JSON.stringify({ ...node, data: removeRuntimeData(node.data) })
            );
          }

          return;
        }

        if (key === "v" && !isTextEditingElement(event.target)) {
          event.preventDefault();

          if (copiedNodeRef.current) {
            const original = copiedNodeRef.current;
            const clone = {
              ...original,
              id: generateId("node"),
              position: {
                x: original.position.x + 36,
                y: original.position.y + 36,
              },
              data: JSON.parse(JSON.stringify(original.data || {})),
            };

            pushHistory(capture(), false);
            setNodes((items) => [...items, clone]);
            setFocusedNodeId(clone.id);
            setEditingNodeId(clone.id);
          } else {
            await createTextFromClipboard();
          }

          return;
        }
      }

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        !isTextEditingElement(event.target)
      ) {
        event.preventDefault();
        if (editingNodeId) deleteNode(editingNodeId);
        else if (editingEdgeId) deleteEdge(editingEdgeId);
      }

      if (event.key === "Escape") {
        setEdgeMode(false);
        setConnectionSourceId(null);
        leaveEditing();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    createTextFromClipboard, deleteEdge, deleteNode, editingEdgeId,
    editingNodeId, focusedNodeId, leaveEditing, pushHistory,
    redo, setNodes, undo, capture,
  ]);

  useEffect(() => {
    if (!mapa?.id || leavingRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(
      () => queueSave(buildFlowPayload(nodes, edges)).catch(console.error),
      2500
    );

    return () => clearTimeout(saveTimeoutRef.current);
  }, [edges, mapa?.id, nodes, queueSave]);

  useEffect(() => () => {
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  }, []);

  const handleWheel = useCallback((event) => {
    if (event.target.closest?.("textarea,input,button")) return;
    event.preventDefault();

    const viewport = reactFlow.getViewport();
    const rect = event.currentTarget.getBoundingClientRect();

    if (event.ctrlKey) {
      const factor = event.deltaY < 0 ? 1.08 : 0.92;
      const nextZoom = Math.min(4, Math.max(0.2, viewport.zoom * factor));
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;

      reactFlow.setViewport({
        x: px - (px - viewport.x) * (nextZoom / viewport.zoom),
        y: py - (py - viewport.y) * (nextZoom / viewport.zoom),
        zoom: nextZoom,
      });
      return;
    }

    reactFlow.setViewport({ ...viewport, y: viewport.y - event.deltaY });
  }, [reactFlow]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0f2f33",
        position: "relative",
        overflow: "hidden",
      }}
      onWheel={handleWheel}
      onDragOver={(e) => {
        if ([...(e.dataTransfer?.types || [])].includes("Files")) {
          e.preventDefault();
          setIsImageDragActive(true);
        }
      }}
      onDragLeave={() => setIsImageDragActive(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setIsImageDragActive(false);

        const file = [...(e.dataTransfer?.files || [])]
          .find((f) => f.type.startsWith("image/"));

        if (file) {
          await createImageNodeFromFile(
            file,
            screenToFlowPosition({ x: e.clientX, y: e.clientY })
          );
        }
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          zIndex: 30,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          pointerEvents: "none",
        }}
      >
        <div style={{ position: "relative", pointerEvents: "auto" }}>
          <button
            className="bw-toolbar-button"
            onClick={() => setNodeMenuOpen((v) => !v)}
          >
            + adicionar nó
          </button>

          {nodeMenuOpen && (
            <div className="bw-node-menu">
              <button className="bw-menu-button" onClick={() => addNode("TEXT")}>
                caixa de texto
              </button>
              <button className="bw-menu-button" onClick={() => addNode("CHECKLIST")}>
                lista
              </button>
              <button className="bw-menu-button" onClick={() => imageInputRef.current?.click()}>
                imagem
              </button>
            </div>
          )}
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelected}
          style={{ display: "none" }}
        />

        <button
          className="bw-toolbar-button"
          onClick={() => {
            setEdgeMode((v) => !v);
            setConnectionSourceId(null);
          }}
        >
          {edgeMode ? "conexão ativa" : "conectar nós"}
        </button>

        <button
          className="bw-toolbar-button"
          onClick={() => setSettingsOpen((v) => !v)}
        >
          editar mapa
        </button>

        <button className="bw-toolbar-button bw-logout" onClick={handleLogout}>
          salvar e sair
        </button>
      </div>

      {settingsOpen && (
        <div className="bw-map-settings">
          <button className="bw-settings-action" onClick={cycleColor}>
            mudar cor do mapa
          </button>

          <label>
            <input
              type="checkbox"
              checked={noteEnabled}
              onChange={async (e) => {
                const value = e.target.checked;
                setNoteEnabled(value);
                await saveMapSettings({ nota_flutuante_ativa: value });
              }}
            />
            nota flutuante
          </label>

          <label>
            <input
              type="checkbox"
              checked={calendarEnabled}
              onChange={async (e) => {
                const value = e.target.checked;
                setCalendarEnabled(value);
                await saveMapSettings({ relogio_ativo: value });
              }}
            />
            calendário / relógio
          </label>
        </div>
      )}

      {noteEnabled && (
        <div
          className={`bw-floating-note ${noteOpen ? "open" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {noteOpen ? (
            <textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={async () => {
                setNoteOpen(false);
                await saveMapSettings({ nota_flutuante: note });
              }}
              placeholder="nota rápida..."
            />
          ) : (
            <button aria-label="Abrir nota" onClick={() => setNoteOpen(true)}>
              ✎
            </button>
          )}
        </div>
      )}

      {calendarEnabled && <div className="bw-map-clock">{clock}</div>}
      {isImageDragActive && (
        <div className="bw-image-drop">solte a imagem para criar um nó</div>
      )}

      <ReactFlow
        nodes={nodesWithHandlers}
        edges={edges}
        onDoubleClick={onCanvasDoubleClick}
        zoomOnDoubleClick={false}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeDragStart={beginTransaction}
        onNodeDragStop={finishTransaction}
        onPaneClick={onPaneClick}
        onEdgeClick={onEdgeClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={{ style: EDGE_STYLE, type: "default" }}
        connectionLineStyle={EDGE_STYLE}
        nodesConnectable={edgeMode}
        nodesDraggable={!!editingNodeId}
        elementsSelectable={false}
        deleteKeyCode={null}
        panOnDrag
        zoomOnScroll={false}
        zoomOnPinch
        style={{ cursor: edgeMode ? "crosshair" : "default" }}
      >
        <Background color="rgba(72,171,179,.25)" gap={24} size={1.5} />
        <Controls className="bw-flow-controls" />

        {edges.map((edge) => {
          if (!editingEdgeId || editingEdgeId !== edge.id) return null;

          const source = nodes.find((n) => n.id === edge.source);
          const target = nodes.find((n) => n.id === edge.target);
          if (!source || !target) return null;

          const [, x, y] = getBezierPath({
            sourceX: source.position.x,
            sourceY: source.position.y,
            targetX: target.position.x,
            targetY: target.position.y,
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          });

          return (
            <EdgeLabelRenderer key={`editor-${edge.id}`}>
              <div
                className="bw-edge-editor"
                style={{
                  transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
                }}
              >
                <input
                  autoFocus
                  value={edge.label || ""}
                  onChange={(e) => updateEdgeLabel(edge.id, e.target.value)}
                  onBlur={leaveEditing}
                />
              </div>
            </EdgeLabelRenderer>
          );
        })}
      </ReactFlow>
    </div>
  );
}