import { buildApiUrl, normalizeNetworkError } from "./apiConfig";

const LOCAL_MAPA_ID = "local";
const LOCAL_FLOW_KEY = "brainweb.flow.local";

const MAPA_LOCAL = {
  id: LOCAL_MAPA_ID,
  id_usuario: 0,
  titulo: "Mapa local",
  criado_em: new Date().toISOString(),
};

function getToken() {
  return localStorage.getItem("bw_token") || sessionStorage.getItem("bw_token");
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getToken();

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getLocalFlow() {
  try {
    const savedFlow = localStorage.getItem(LOCAL_FLOW_KEY);

    if (!savedFlow) {
      return { nodes: [], edges: [] };
    }

    const parsedFlow = JSON.parse(savedFlow);

    return {
      nodes: Array.isArray(parsedFlow.nodes) ? parsedFlow.nodes : [],
      edges: Array.isArray(parsedFlow.edges) ? parsedFlow.edges : [],
    };
  } catch (error) {
    console.error("Erro ao ler mapa local:", error);
    return { nodes: [], edges: [] };
  }
}

function saveLocalFlow(data) {
  try {
    localStorage.setItem(
      LOCAL_FLOW_KEY,
      JSON.stringify({
        nodes: Array.isArray(data?.nodes) ? data.nodes : [],
        edges: Array.isArray(data?.edges) ? data.edges : [],
      })
    );
  } catch (error) {
    console.error("Erro ao salvar mapa local:", error);
  }
}

async function fetchJson(path, options = {}) {
  let res;

  try {
    res = await fetch(buildApiUrl(path), options);
  } catch (error) {
    throw normalizeNetworkError(error);
  }

  if (!res.ok) {
    let message = `Erro HTTP ${res.status}`;

    try {
      const data = await res.json();
      message = data.detail || message;
    } catch {
      // Mantém a mensagem padrão caso a resposta não seja JSON.
    }

    throw new Error(message);
  }

  return res.json();
}

export async function getMapaPrincipal() {
  try {
    return await fetchJson("/mapas/principal", {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.warn(
      "Backend indisponível ou sessão inválida. Usando mapa local temporário.",
      error
    );

    return MAPA_LOCAL;
  }
}

export async function getFlowPrincipal() {
  try {
    return await fetchJson("/mapas/principal/flow", {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.warn(
      "Backend indisponível ou sessão inválida. Carregando flow salvo localmente.",
      error
    );

    return getLocalFlow();
  }
}

export async function salvarMapa(mapaId, data) {
  if (mapaId === LOCAL_MAPA_ID) {
    saveLocalFlow(data);
    return { status: "ok", storage: "local" };
  }

  try {
    const resposta = await fetchJson(`/mapas/${mapaId}/flow`, {
      method: "PUT",
      headers: getAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(data),
    });

    saveLocalFlow(data);
    return resposta;
  } catch (error) {
    console.warn(
      "Erro ao salvar no backend. Salvando cópia local temporária.",
      error
    );

    saveLocalFlow(data);
    return { status: "ok", storage: "local" };
  }
}