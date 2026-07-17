import {
  buildApiUrl,
  normalizeNetworkError,
} from "./apiConfig";

async function requestJson(path, options = {}) {
  let resposta;

  try {
    resposta = await fetch(buildApiUrl(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    throw normalizeNetworkError(error);
  }

  let dados = null;

  try {
    dados = await resposta.json();
  } catch {
    // Algumas respostas de erro podem vir sem corpo JSON.
  }

  if (!resposta.ok) {
    throw new Error(dados?.detail || `Erro HTTP ${resposta.status}`);
  }

  return dados;
}

export async function registrar(nome, email, senha) {
  return requestJson("/auth/registrar", {
    method: "POST",
    body: JSON.stringify({
      nome,
      email,
      senha,
    }),
  });
}

export async function login(email, senha) {
  return requestJson("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      senha,
    }),
  });
}
