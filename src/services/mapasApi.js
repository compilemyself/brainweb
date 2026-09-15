import { buildApiUrl, normalizeNetworkError } from "./apiConfig";

function getToken() {
  return localStorage.getItem("bw_token") || sessionStorage.getItem("bw_token");
}

function headers(extra = {}) {
  const t = getToken();
  return { ...extra, ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

async function fetchJson(path, options = {}) {
  let res;

  try {
    res = await fetch(buildApiUrl(path), options);
  } catch (e) {
    throw normalizeNetworkError(e);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Erro HTTP ${res.status}`);
  }

  return res.json();
}

export async function getMapaPrincipal() {
  return fetchJson("/mapas/principal", { headers: headers() });
}

export async function getFlowPrincipal() {
  return fetchJson("/mapas/principal/flow", { headers: headers() });
}

export async function salvarMapa(id, data) {
  return fetchJson(`/mapas/${id}/flow`, {
    method: "PUT",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(data)
  });
}

export async function salvarConfiguracaoMapa(id, data) {
  return fetchJson(`/mapas/${id}/configuracao`, {
    method: "PUT",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(data)
  });
}