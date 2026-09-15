import { buildApiUrl, normalizeNetworkError } from "./apiConfig";

const LOCAL_MAPA_ID = "local";
const LOCAL_FLOW_KEY = "brainweb.flow.local";

function getToken() {
  return localStorage.getItem("bw_token") || sessionStorage.getItem("bw_token");
}

function headers(extra = {}) {
  const t = getToken();
  return { ...extra, ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

function localFlow() {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_FLOW_KEY) || "{}");

    return {
      nodes: Array.isArray(value.nodes) ? value.nodes : [],
      edges: Array.isArray(value.edges) ? value.edges : []
    };
  } catch {
    return { nodes: [], edges: [] };
  }
}

function saveLocal(data) {
  try { localStorage.setItem(LOCAL_FLOW_KEY, JSON.stringify(data)); } catch {}
}

async function fetchJson(path, options = {}) {
  let res;

  try {
    res = await fetch(buildApiUrl(path), options);
  } catch (e) {
    throw normalizeNetworkError(e);
  }

  if (!res.ok) {
    let message = `Erro HTTP ${res.status}`;

    try { message = (await res.json()).detail || message; } catch {}

    throw new Error(message);
  }

  return res.json();
}

export async function getMapaPrincipal() {
  try {
    return await fetchJson("/mapas/principal", { headers: headers() });
  } catch {
    return {
      id: LOCAL_MAPA_ID,
      id_usuario: 0,
      titulo: "Mapa local",
      criado_em: new Date().toISOString(),
      nota_flutuante_ativa: true,
      relogio_ativo: true,
      nota_flutuante: ""
    };
  }
}

export async function getFlowPrincipal() {
  try {
    return await fetchJson("/mapas/principal/flow", { headers: headers() });
  } catch {
    return localFlow();
  }
}

export async function salvarMapa(id, data) {
  if (id === LOCAL_MAPA_ID) {
    saveLocal(data);
    return { status: "ok", storage: "local" };
  }

  try {
    const result = await fetchJson(`/mapas/${id}/flow`, {
      method: "PUT",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(data)
    });

    saveLocal(data);
    return result;
  } catch {
    saveLocal(data);
    return { status: "ok", storage: "local" };
  }
}

export async function salvarConfiguracaoMapa(id, data) {
  if (id === LOCAL_MAPA_ID) return data;

  return fetchJson(`/mapas/${id}/configuracao`, {
    method: "PUT",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(data)
  });
}