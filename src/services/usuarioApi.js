import { buildApiUrl } from "./apiConfig";

function token() {
  return localStorage.getItem("bw_token") || sessionStorage.getItem("bw_token");
}

export async function atualizarPreferenciasUsuario(preferencias) {
  const response = await fetch(buildApiUrl("/auth/preferencias"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token() ? { Authorization: `Bearer ${token()}` } : {})
    },
    body: JSON.stringify(preferencias)
  });

  if (!response.ok) throw new Error("Não foi possível salvar as preferências.");
  return response.json();
}