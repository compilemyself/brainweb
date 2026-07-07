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
  Background,
  Controls,
  useEdgesState,
  useNodesState,
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

function getDragHandleByType(type) {
  return type === "TEXT" || type === "CHECKLIST" ? DRAG_HANDLE_SELECTOR : undefined;
}

const toolbarStyle = {
  position: "absolute",
  top: 12,
  left: 12,
  right: 12,
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  pointerEvents: "none",
};

const buttonStyle = {
  minHeight: 40,
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.5)",
  background: "#48abb3",
  color: "white",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 14,
  pointerEvents: "auto",
};

const dangerButtonStyle = {
  ...buttonStyle,
  background: "#b34848",
};

const logoutButtonStyle = {
  ...dangerButtonStyle,
  minHeight: 34,
  padding: "6px 10px",
  fontSize: 12,
  marginLeft: "auto",
};

const activeButtonStyle = {
  ...buttonStyle,
  background: "#ffffff",
  color: "#0f2f33",
  border: "1px solid #ffffff",
};

const statusStyle = {
  minHeight: 40,
  display: "flex",
  alignItems: "center",
  padding: "8px 10px",
  borderRadius: 8,
  background: "rgba(15,47,51,0.86)",
  color: "white",
  fontSize: 13,
  pointerEvents: "none",
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
          "edgeMode",
          "isEdgeSource",
          "isSelected",
        ].includes(key)
    )
  );
}

function buildFlowPayload(nodes, edges) {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type || "TEXT",
      position: n.position,
      data: removeRuntimeData(n.data),
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    })),
  };
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
      (mapa.nodes || []).map((n) => ({
        id: n.id,
        type: n.type || "TEXT",
        position: n.position || { x: 100, y: 100 },
        data: n.data || getInitialDataByType(n.type || "TEXT"),
        dragHandle: getDragHandleByType(n.type || "TEXT"),
      })),
    [mapa.nodes]
  );

  const initialEdges = useMemo(
    () =>
      (mapa.edges || []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        style: EDGE_STYLE,
      })),
    [mapa.edges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [edgeMode, setEdgeMode] = useState(false);
  const [connectionSourceId, setConnectionSourceId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const saveTimeoutRef = useRef(null);
  const reactFlow = useReactFlow();

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
      setNodes((nds) =>
        nds.map((node) =>
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

      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNode.id);
    },
    [setNodes]
  );

  const addNode = useCallback(
    (type, customData = {}) => {
      const center = getViewportCenterPosition();
      const offset = (nodes.length % 6) * 24;

      createNode(
        type,
        {
          x: center.x + offset,
          y: center.y + offset,
        },
        customData
      );
    },
    [createNode, getViewportCenterPosition, nodes.length]
  );

  const requestImageFile = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleImageSelected = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) return;

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
        addNode("IMAGE", {
          label: file.name,
          src,
          mimeType: file.type,
          size: file.size,
        });
      } catch (error) {
        console.error("Erro ao carregar imagem:", error);
        alert("Não foi possível carregar a imagem selecionada.");
      }
    },
    [addNode]
  );

  const deleteNode = useCallback(
    (nodeId) => {
      if (!nodeId) return;

      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );

      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }

      if (connectionSourceId === nodeId) {
        setConnectionSourceId(null);
      }
    },
    [connectionSourceId, selectedNodeId, setEdges, setNodes]
  );

  const createEdgeBetweenNodes = useCallback(
    (sourceId, targetId) => {
      if (!sourceId || !targetId || sourceId === targetId) return;

      setEdges((eds) => {
        const edgeAlreadyExists = eds.some(
          (edge) =>
            (edge.source === sourceId && edge.target === targetId) ||
            (edge.source === targetId && edge.target === sourceId)
        );

        if (edgeAlreadyExists) return eds;

        return addEdge(
          {
            id: generateId("edge"),
            source: sourceId,
            target: targetId,
            style: EDGE_STYLE,
          },
          eds
        );
      });
    },
    [setEdges]
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
  }, []);

  const cancelEdgeMode = useCallback(() => {
    setEdgeMode(false);
    setConnectionSourceId(null);
  }, []);

  const onNodeClick = useCallback(
    (event, node) => {
      setSelectedNodeId(node.id);

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

    if (edgeMode) {
      setConnectionSourceId(null);
    }
  }, [edgeMode]);

  const onSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    setSelectedNodeId(selectedNodes[0]?.id || null);
  }, []);

  const nodesWithHandlers = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        dragHandle: getDragHandleByType(node.type || "TEXT"),
        data: {
          ...node.data,
          onChange: updateNodeData,
          edgeMode,
          isEdgeSource: node.id === connectionSourceId,
          isSelected: node.id === selectedNodeId,
        },
      })),
    [connectionSourceId, edgeMode, nodes, selectedNodeId, updateNodeData]
  );

  const saveCurrentFlow = useCallback(() => {
    return salvarMapa(mapa.id, buildFlowPayload(nodes, edges));
  }, [edges, mapa.id, nodes]);

  const handleSaveAndLogout = useCallback(async () => {
    try {
      await saveCurrentFlow();
    } catch (error) {
      console.error("Erro ao salvar antes de sair:", error);
    } finally {
      logout();
    }
  }, [logout, saveCurrentFlow]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (isTextEditingElement(event.target)) return;

      deleteNode(selectedNodeId);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteNode, selectedNodeId]);

  useEffect(() => {
    if (!mapa?.id) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      salvarMapa(mapa.id, buildFlowPayload(nodes, edges)).catch((error) => {
        console.error("Erro ao salvar mapa:", error);
      });
    }, 2500);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [nodes, edges, mapa?.id]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0f2f33",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={toolbarStyle}>
        <button style={buttonStyle} onClick={() => addNode("TEXT")}>
          + texto
        </button>

        <button style={buttonStyle} onClick={requestImageFile}>
          + imagem
        </button>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelected}
          style={{ display: "none" }}
        />

        <button style={buttonStyle} onClick={() => addNode("CHECKLIST")}>
          + checklist
        </button>

        <button
          style={edgeMode ? activeButtonStyle : buttonStyle}
          onClick={toggleEdgeMode}
        >
          conectar nós
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

        {edgeMode && (
          <span style={statusStyle}>
            {connectionSourceId
              ? "Agora toque no nó de destino."
              : "Toque no primeiro nó para iniciar a conexão."}
          </span>
        )}

        <button style={logoutButtonStyle} onClick={handleSaveAndLogout}>
          salvar e sair
        </button>
      </div>

      <ReactFlow
        nodes={nodesWithHandlers}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={{ style: EDGE_STYLE }}
        nodesConnectable
        zoomOnPinch
        panOnDrag
      >
        <Background color="rgba(72,171,179,.25)" gap={24} size={1.5} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
