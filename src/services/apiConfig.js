function normalizeUrl(value) {
  if (!value) return "";

  return String(value)
    .trim()
    .replace(/^(["'])(.*)\1$/, "$2")
    .replace(/\/+$/, "");
}

const configuredApiUrl = normalizeUrl(process.env.REACT_APP_API_URL);

const isBrowser = typeof window !== "undefined";
const isLocalBrowser =
  isBrowser &&
  ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

// Em desenvolvimento local, o backend continua usando a porta padrão 8000.
// Em produção, a URL deve ser informada explicitamente para evitar que o
// navegador tente acessar o próprio computador do usuário como "localhost".
export const API_BASE_URL = configuredApiUrl ||
  (isLocalBrowser ? "http://localhost:8000" : "");

export function buildApiUrl(path) {
  if (!API_BASE_URL) {
    throw new Error(
      "A URL do backend não está configurada. Defina REACT_APP_API_URL no ambiente do frontend e faça um novo deploy."
    );
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function normalizeNetworkError(error) {
  if (!(error instanceof TypeError)) {
    return error;
  }

  const currentProtocol = isBrowser ? window.location.protocol : "";

  if (currentProtocol === "https:" && API_BASE_URL.startsWith("http://")) {
    return new Error(
      "O navegador bloqueou a conexão porque o site usa HTTPS, mas o backend foi configurado com HTTP. Use uma URL HTTPS em REACT_APP_API_URL."
    );
  }

  return new Error(
    `Não foi possível conectar ao backend${
      API_BASE_URL ? ` em ${API_BASE_URL}` : ""
    }. Verifique se a API está online e se o CORS permite este domínio.`
  );
}
