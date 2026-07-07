const API = (process.env.REACT_APP_API_URL || "http://localhost:8000").replace(
  /\/$/,
  ""
);

async function requestJson(path, options = {}) {
  const resposta = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

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
