const API = (process.env.REACT_APP_API_URL || "http://localhost:8000").replace(
  /\/$/,
  ""
);

export async function login(email, senha) {
  const resposta = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      senha,
    }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.detail || "Erro ao fazer login.");
  }

  return dados;
}