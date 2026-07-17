import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  useReactFlow,
} from "reactflow";

import "reactflow/dist/style.css";

import { AuthContext } from "../../context/AuthContext";
import { nodeTypes } from "./nodeTypes";
import { salvarMapa } from "../../services/mapasApi";

const EDGE_STYLE = {
  stroke: "rgba(255,255,255,0.9)",
  strokeWidth: 2,
};

const IMAGE_MAX_BYTES = 4 * 1024 * 1024;
const DRAG_HANDLE_SELECTOR = ".node-drag-handle";
const HISTORY_LIMIT = 80;
const DATA_HISTORY_DELAY = 650;

function getDragHandleByType() {
  return DRAG_HANDLE_SELECTOR;
}

const toolbarStyle = {
  position: "absolute",
  top: 12,
  left: 12,
  right: 12,
  zIndex: 30,
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  pointerEvents: "none",
};

const buttonStyle = {
  minHeight: 42,
  padding: "9px 13px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.5)",
  background: "#48abb3",
  color: "white",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 14,
  pointerEvents: "auto",
  touchAction: "manipulation",
};

const dangerButtonStyle = {
  ...buttonStyle,
  background: "#b34848",
};

const logoutButtonStyle = {
  ...dangerButtonStyle,
  minHeight: 36,
  padding: "7px 11px",
  fontSize: 12,
  marginLeft: "auto",
};

const activeButtonStyle = {
  ...buttonStyle,
  background: "#effff1",
  color: "#143b2a",
  border: "2px solid #baf7c2",
  boxShadow: "0 0 0 4px rgba(186,247,194,0.24)",
  fontWeight: 700,
};

const statusStyle = {
  minHeight: 42,
  display: "flex",
  alignItems: "center",
  padding: "8px 11px",
  borderRadius: 8,
  border: "1px solid rgba(186,247,194,0.55)",
  background: "rgba(15,47,51,0.94)",
  color: "white",
  fontSize: 13,
  pointerEvents: "none",
};

const nodeMenuStyle = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  minWidth: 170,
  display: "grid",
  gap: 5,
  padding: 6,
  borderRadius: 9,
  border: "1px solid rgba(255,255,255,0.42)",
  background: "rgba(15,47,51,0.97)",
  boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
  pointerEvents: "auto",
};

const nodeMenuButtonStyle = {
  ...buttonStyle,
  width: "100%",
  minHeight: 38,
  textAlign: "left",
  background: "rgba(72,171,179,0.38)",
};

function generateId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getInitialDataByType(type) {
  switch (type) {
    case "CHECKLIST":
      return {
        width: 260,
        height: 220,
        items: [
          {
            id: generateId("item"),
            label: "Novo item",
            checked: false,
          },
        ],
      };

    case "IMAGE":
      return {
        width: 240,
        height: 190,
        label: "Imagem",
        src: "",
      };

    case "TEXT":
    default:
      return {
        width: 240,
        height: 170,
        label: "Novo texto",
      };
  }
}

function isTextEditingElement(element) {
  if (!element) return false;

  const tagName = element.tagName?.toLowerCase();
  return tagName === "input" || tagName === "textarea" || element.isContentEditable;
}

function removeRuntimeData(data = {}) {
  return Object.fromEntries(
    Object.entries(data || {}).filter(
      ([key]) =>
        ![
          "onChange",
          "onEditEnd",
          "onResize",
          "onResizeStart",
          "onResizeEnd",
          "edgeMode",
          "isEdgeSource",
          "isSelected",
        ].includes(key)
    )
  );
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
    })),
  };
}

function createFlowSnapshot(nodes, edges) {
  const payload = buildFlowPayload(nodes, edges);

  return {
    nodes: payload.nodes.map((node) => ({
      ...node,
      position: { ...node.position },
      data: JSON.parse(JSON.stringify(node.data || {})),
      dragHandle: getDragHandleByType(node.type),
    })),
    edges: payload.edges.map((edge) => ({
      ...edge,
      style: EDGE_STYLE,
    })),
  };
}

function serializeSnapshot(snapshot) {
  return JSON.stringify(buildFlowPayload(snapshot.nodes, snapshot.edges));
}

function readImageFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function MapEditor({ mapa }) {
  const { logout } = useContext(AuthContext);
  const imageInputRef = useRef(null);

  const initialNodes = useMemo(
    () =>
      (mapa.nodes || []).map((node) => ({
        id: node.id,
        type: node.type || "TEXT",
        position: node.position || { x: 100, y: 100 },
        data: {
          ...getInitialDataByType(node.type || "TEXT"),
          ...(node.data || {}),
        },
        dragHandle: getDragHandleByType(node.type || "TEXT"),
      })),
    [mapa.nodes]
  );

  const initialEdges = useMemo(
    () =>
      (mapa.edges || []).map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        style: EDGE_STYLE,
      })),
    [mapa.edges]
  );

  const [nodesState, setNodesState] = useState(initialNodes);
  const [edgesState, setEdgesState] = useState(initialEdges);
  const nodesRef = useRef(initialNodes);
  const edgesRef = useRef(initialEdges);

  const setNodes = useCallback((updater) => {
    setNodesState((currentNodes) => {
      const nextNodes =
        typeof updater === "function" ? updater(currentNodes) : updater;
      nodesRef.current = nextNodes;
      return nextNodes;
    });
  }, []);

  const setEdges = useCallback((updater) => {
    setEdgesState((currentEdges) => {
      const nextEdges =
        typeof updater === "function" ? updater(currentEdges) : updater;
      edgesRef.current = nextEdges;
      return nextEdges;
    });
  }, []);

  const [edgeMode, setEdgeMode] = useState(false);
  const [connectionSourceId, setConnectionSourceId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [nodeMenuOpen, setNodeMenuOpen] = useState(false);
  const [isImageDragActive, setIsImageDragActive] = useState(false);

  const saveTimeoutRef = useRef(null);
  const saveQueueRef = useRef(Promise.resolve());
  const isLeavingRef = useRef(false);

  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const pendingDataSnapshotRef = useRef(null);
  const dataHistoryTimeoutRef = useRef(null);
  const activeTransactionSnapshotRef = useRef(null);

  const reactFlow = useReactFlow();

  const captureSnapshot = useCallback(
    () => createFlowSnapshot(nodesRef.current, edgesRef.current),
    []
  );

  const restoreSnapshot = useCallback(
    (snapshot) => {
      setNodes(createFlowSnapshot(snapshot.nodes, snapshot.edges).nodes);
      setEdges(createFlowSnapshot(snapshot.nodes, snapshot.edges).edges);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setConnectionSourceId(null);
      setEdgeMode(false);
      setNodeMenuOpen(false);
    },
    [setEdges, setNodes]
  );

  const pushPastSnapshot = useCallback((snapshot, compareWithCurrent = true) => {
    const currentSnapshot = createFlowSnapshot(
      nodesRef.current,
      edgesRef.current
    );

    if (
      compareWithCurrent &&
      serializeSnapshot(snapshot) === serializeSnapshot(currentSnapshot)
    ) {
      return;
    }

    const past = pastRef.current;
    const lastSnapshot = past[past.length - 1];

    if (!lastSnapshot || serializeSnapshot(lastSnapshot) !== serializeSnapshot(snapshot)) {
      past.push(snapshot);
    }

    if (past.length > HISTORY_LIMIT) {
      past.splice(0, past.length - HISTORY_LIMIT);
    }

    futureRef.current = [];
  }, []);

  const commitPendingDataHistory = useCallback(() => {
    if (dataHistoryTimeoutRef.current) {
      clearTimeout(dataHistoryTimeoutRef.current);
      dataHistoryTimeoutRef.current = null;
    }

    const pendingSnapshot = pendingDataSnapshotRef.current;
    pendingDataSnapshotRef.current = null;

    if (pendingSnapshot) {
      pushPastSnapshot(pendingSnapshot);
    }
  }, [pushPastSnapshot]);

  const beginDataHistory = useCallback(() => {
    if (activeTransactionSnapshotRef.current) return;

    if (!pendingDataSnapshotRef.current) {
      pendingDataSnapshotRef.current = captureSnapshot();
      futureRef.current = [];
    }

    if (dataHistoryTimeoutRef.current) {
      clearTimeout(dataHistoryTimeoutRef.current);
    }

    dataHistoryTimeoutRef.current = setTimeout(
      commitPendingDataHistory,
      DATA_HISTORY_DELAY
    );
  }, [captureSnapshot, commitPendingDataHistory]);

  const startHistoryTransaction = useCallback(() => {
    commitPendingDataHistory();

    if (!activeTransactionSnapshotRef.current) {
      activeTransactionSnapshotRef.current = captureSnapshot();
      futureRef.current = [];
    }
  }, [captureSnapshot, commitPendingDataHistory]);

  const finishHistoryTransaction = useCallback(() => {
    const transactionSnapshot = activeTransactionSnapshotRef.current;
    activeTransactionSnapshotRef.current = null;

    if (transactionSnapshot) {
      pushPastSnapshot(transactionSnapshot);
    }
  }, [pushPastSnapshot]);

  const undo = useCallback(() => {
    if (activeTransactionSnapshotRef.current) {
      finishHistoryTransaction();
    }

    if (pendingDataSnapshotRef.current) {
      if (dataHistoryTimeoutRef.current) {
        clearTimeout(dataHistoryTimeoutRef.current);
        dataHistoryTimeoutRef.current = null;
      }

      const previousSnapshot = pendingDataSnapshotRef.current;
      pendingDataSnapshotRef.current = null;
      futureRef.current.push(captureSnapshot());
      restoreSnapshot(previousSnapshot);
      return;
    }

    const previousSnapshot = pastRef.current.pop();
    if (!previousSnapshot) return;

    futureRef.current.push(captureSnapshot());
    restoreSnapshot(previousSnapshot);
  }, [captureSnapshot, finishHistoryTransaction, restoreSnapshot]);

  const redo = useCallback(() => {
    commitPendingDataHistory();

    const nextSnapshot = futureRef.current.pop();
    if (!nextSnapshot) return;

    pastRef.current.push(captureSnapshot());
    restoreSnapshot(nextSnapshot);
  }, [captureSnapshot, commitPendingDataHistory, restoreSnapshot]);

  const recordImmediateChange = useCallback(() => {
    commitPendingDataHistory();
    pushPastSnapshot(captureSnapshot(), false);
  }, [captureSnapshot, commitPendingDataHistory, pushPastSnapshot]);

  const screenToFlowPosition = useCallback(
    (point) => {
      if (typeof reactFlow.screenToFlowPosition === "function") {
        return reactFlow.screenToFlowPosition(point);
      }

      if (typeof reactFlow.project === "function") {
        return reactFlow.project(point);
      }

      return { x: 200, y: 200 };
    },
    [reactFlow]
  );

  const getViewportCenterPosition = useCallback(() => {
    return screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
  }, [screenToFlowPosition]);

  const updateNodeData = useCallback(
    (nodeId, partialData) => {
      beginDataHistory();
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...partialData,
                },
              }
            : node
        )
      );
    },
    [beginDataHistory, setNodes]
  );

  const resizeNodeData = useCallback(
    (nodeId, partialData) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...partialData,
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  const createNode = useCallback(
    (type, position, customData = {}) => {
      recordImmediateChange();

      const newNode = {
        id: generateId("node"),
        type,
        position,
        data: {
          ...getInitialDataByType(type),
          ...customData,
        },
        dragHandle: getDragHandleByType(type),
      };

      setNodes((nodes) => nodes.concat(newNode));
      setSelectedNodeId(newNode.id);
      setSelectedEdgeId(null);
      setNodeMenuOpen(false);
    },
    [recordImmediateChange, setNodes]
  );

  const addNode = useCallback(
    (type, customData = {}) => {
      const center = getViewportCenterPosition();
      const offset = (nodesRef.current.length % 6) * 24;

      createNode(
        type,
        {
          x: center.x + offset,
          y: center.y + offset,
        },
        customData
      );
    },
    [createNode, getViewportCenterPosition]
  );

  const requestImageFile = useCallback(() => {
    setNodeMenuOpen(false);
    imageInputRef.current?.click();
  }, []);

  const createImageNodeFromFile = useCallback(
    async (file, position) => {
      if (!file.type.startsWith("image/")) {
        alert("Escolha um arquivo de imagem válido.");
        return;
      }

      if (file.size > IMAGE_MAX_BYTES) {
        alert("Imagem muito grande. Escolha um arquivo com até 4 MB.");
        return;
      }

      try {
        const src = await readImageFileAsDataUrl(file);
        const imageData = {
          label: file.name,
          src,
          mimeType: file.type,
          size: file.size,
        };

        if (position) {
          createNode("IMAGE", position, imageData);
        } else {
          addNode("IMAGE", imageData);
        }
      } catch (error) {
        console.error("Erro ao carregar imagem:", error);
        alert("Não foi possível carregar a imagem selecionada.");
      }
    },
    [addNode, createNode]
  );

  const handleImageSelected = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (file) {
        await createImageNodeFromFile(file);
      }
    },
    [createImageNodeFromFile]
  );

  const handleImageDragOver = useCallback((event) => {
    const dragTypes = Array.from(event.dataTransfer?.types || []);
    if (!dragTypes.includes("Files")) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsImageDragActive(true);
  }, []);

  const handleImageDragLeave = useCallback((event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setIsImageDragActive(false);
  }, []);

  const handleImageDrop = useCallback(
    async (event) => {
      event.preventDefault();
      setIsImageDragActive(false);

      const imageFile = Array.from(event.dataTransfer?.files || []).find(
        (file) => file.type.startsWith("image/")
      );

      if (!imageFile) return;

      const dropPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      await createImageNodeFromFile(imageFile, {
        x: dropPosition.x - 120,
        y: dropPosition.y - 95,
      });
    },
    [createImageNodeFromFile, screenToFlowPosition]
  );

  const deleteNode = useCallback(
    (nodeId) => {
      if (!nodeId) return;

      recordImmediateChange();
      setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
      setEdges((edges) =>
        edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );

      setSelectedNodeId(null);
      setSelectedEdgeId(null);

      if (connectionSourceId === nodeId) {
        setConnectionSourceId(null);
      }
    },
    [connectionSourceId, recordImmediateChange, setEdges, setNodes]
  );

  const deleteEdge = useCallback(
    (edgeId) => {
      if (!edgeId) return;

      recordImmediateChange();
      setEdges((edges) => edges.filter((edge) => edge.id !== edgeId));
      setSelectedEdgeId(null);
    },
    [recordImmediateChange, setEdges]
  );

  const createEdgeBetweenNodes = useCallback(
    (sourceId, targetId) => {
      if (!sourceId || !targetId || sourceId === targetId) return;

      const edgeAlreadyExists = edgesRef.current.some(
        (edge) =>
          (edge.source === sourceId && edge.target === targetId) ||
          (edge.source === targetId && edge.target === sourceId)
      );

      if (edgeAlreadyExists) return;

      recordImmediateChange();
      setEdges((edges) =>
        addEdge(
          {
            id: generateId("edge"),
            source: sourceId,
            target: targetId,
            style: EDGE_STYLE,
          },
          edges
        )
      );
    },
    [recordImmediateChange, setEdges]
  );

  const onConnect = useCallback(
    (connection) => {
      createEdgeBetweenNodes(connection.source, connection.target);
    },
    [createEdgeBetweenNodes]
  );

  const toggleEdgeMode = useCallback(() => {
    setEdgeMode((current) => !current);
    setConnectionSourceId(null);
    setNodeMenuOpen(false);
  }, []);

  const cancelEdgeMode = useCallback(() => {
    setEdgeMode(false);
    setConnectionSourceId(null);
  }, []);

  const onNodeClick = useCallback(
    (event, node) => {
      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
      setNodeMenuOpen(false);

      if (!edgeMode) return;

      event.stopPropagation();

      if (!connectionSourceId) {
        setConnectionSourceId(node.id);
        return;
      }

      createEdgeBetweenNodes(connectionSourceId, node.id);
      setConnectionSourceId(null);
      setEdgeMode(false);
    },
    [connectionSourceId, createEdgeBetweenNodes, edgeMode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setNodeMenuOpen(false);

    if (edgeMode) {
      setConnectionSourceId(null);
    }
  }, [edgeMode]);

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      setSelectedNodeId(selectedNodes[0]?.id || null);
      setSelectedEdgeId(selectedEdges[0]?.id || null);
    },
    []
  );

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nodes) => applyNodeChanges(changes, nodes));
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      const hasRemoval = changes.some((change) => change.type === "remove");
      if (hasRemoval) {
        recordImmediateChange();
      }

      setEdges((edges) => applyEdgeChanges(changes, edges));
    },
    [recordImmediateChange, setEdges]
  );

  const nodesWithHandlers = useMemo(
    () =>
      nodesState.map((node) => ({
        ...node,
        dragHandle: getDragHandleByType(node.type || "TEXT"),
        data: {
          ...node.data,
          onChange: updateNodeData,
          onEditEnd: commitPendingDataHistory,
          onResize: resizeNodeData,
          onResizeStart: startHistoryTransaction,
          onResizeEnd: finishHistoryTransaction,
          edgeMode,
          isEdgeSource: node.id === connectionSourceId,
          isSelected: node.id === selectedNodeId,
        },
      })),
    [
      commitPendingDataHistory,
      connectionSourceId,
      edgeMode,
      finishHistoryTransaction,
      nodesState,
      resizeNodeData,
      selectedNodeId,
      startHistoryTransaction,
      updateNodeData,
    ]
  );

  const queueSave = useCallback(
    (payload) => {
      const nextSave = saveQueueRef.current
        .catch(() => undefined)
        .then(() => salvarMapa(mapa.id, payload));

      saveQueueRef.current = nextSave;
      return nextSave;
    },
    [mapa.id]
  );

  const saveCurrentFlow = useCallback(() => {
    return queueSave(buildFlowPayload(nodesRef.current, edgesRef.current));
  }, [queueSave]);

  const handleSaveAndLogout = useCallback(async () => {
    isLeavingRef.current = true;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    commitPendingDataHistory();

    try {
      await saveQueueRef.current.catch(() => undefined);
      await saveCurrentFlow();
    } catch (error) {
      console.error("Erro ao salvar antes de sair:", error);
    } finally {
      logout();
    }
  }, [commitPendingDataHistory, logout, saveCurrentFlow]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const modifierPressed = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (modifierPressed && !event.altKey) {
        if (isTextEditingElement(event.target)) return;

        const isUndo = key === "z" && !event.shiftKey;
        const isRedo = key === "y" || (key === "z" && event.shiftKey);

        if (isUndo) {
          event.preventDefault();
          undo();
          return;
        }

        if (isRedo) {
          event.preventDefault();
          redo();
          return;
        }
      }

      if (event.key === "Escape" && edgeMode) {
        event.preventDefault();
        cancelEdgeMode();
        return;
      }

      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (isTextEditingElement(event.target)) return;

      event.preventDefault();

      if (selectedNodeId) {
        deleteNode(selectedNodeId);
      } else if (selectedEdgeId) {
        deleteEdge(selectedEdgeId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cancelEdgeMode,
    deleteEdge,
    deleteNode,
    edgeMode,
    redo,
    selectedEdgeId,
    selectedNodeId,
    undo,
  ]);

  useEffect(() => {
    if (!mapa?.id || isLeavingRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const payload = buildFlowPayload(nodesState, edgesState);

    saveTimeoutRef.current = setTimeout(() => {
      queueSave(payload).catch((error) => {
        console.error("Erro ao salvar mapa:", error);
      });
    }, 2500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [edgesState, mapa?.id, nodesState, queueSave]);

  useEffect(() => {
    return () => {
      if (dataHistoryTimeoutRef.current) {
        clearTimeout(dataHistoryTimeoutRef.current);
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      onDragOver={handleImageDragOver}
      onDragLeave={handleImageDragLeave}
      onDrop={handleImageDrop}
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0f2f33",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={toolbarStyle}>
        <div style={{ position: "relative", pointerEvents: "auto" }}>
          <button
            style={buttonStyle}
            onClick={() => setNodeMenuOpen((open) => !open)}
            aria-expanded={nodeMenuOpen}
          >
            + adicionar nó
          </button>

          {nodeMenuOpen && (
            <div style={nodeMenuStyle}>
              <button style={nodeMenuButtonStyle} onClick={() => addNode("TEXT")}>
                caixa de texto
              </button>
              <button
                style={nodeMenuButtonStyle}
                onClick={() => addNode("CHECKLIST")}
              >
                lista
              </button>
              <button style={nodeMenuButtonStyle} onClick={requestImageFile}>
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
          style={edgeMode ? activeButtonStyle : buttonStyle}
          onClick={toggleEdgeMode}
          aria-pressed={edgeMode}
        >
          {edgeMode ? "conexão ativa" : "conectar nós"}
        </button>

        {edgeMode && (
          <button style={buttonStyle} onClick={cancelEdgeMode}>
            cancelar
          </button>
        )}

        {selectedNodeId && !edgeMode && (
          <button style={dangerButtonStyle} onClick={() => deleteNode(selectedNodeId)}>
            excluir nó
          </button>
        )}

        {selectedEdgeId && !selectedNodeId && !edgeMode && (
          <button style={dangerButtonStyle} onClick={() => deleteEdge(selectedEdgeId)}>
            excluir conexão
          </button>
        )}

        {edgeMode && (
          <span style={statusStyle}>
            {connectionSourceId
              ? "Origem marcada. Toque em qualquer área do nó de destino."
              : "Modo de conexão ativo: toque em qualquer área do primeiro nó."}
          </span>
        )}

        <button style={logoutButtonStyle} onClick={handleSaveAndLogout}>
          salvar e sair
        </button>
      </div>

      {isImageDragActive && (
        <div
          style={{
            position: "absolute",
            inset: 18,
            zIndex: 25,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "3px dashed rgba(255,255,255,0.82)",
            borderRadius: 14,
            background: "rgba(72,171,179,0.2)",
            color: "white",
            fontSize: 18,
            fontWeight: 700,
            pointerEvents: "none",
          }}
        >
          solte a imagem para criar um nó
        </div>
      )}

      <ReactFlow
        nodes={nodesWithHandlers}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStart={startHistoryTransaction}
        onNodeDragStop={finishHistoryTransaction}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={{ style: EDGE_STYLE }}
        connectionLineStyle={EDGE_STYLE}
        connectionRadius={40}
        nodesConnectable={!edgeMode}
        nodesDraggable={!edgeMode}
        deleteKeyCode={null}
        zoomOnPinch
        panOnDrag
        style={{ cursor: edgeMode ? "crosshair" : "default" }}
      >
        <Background color="rgba(72,171,179,.25)" gap={24} size={1.5} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
