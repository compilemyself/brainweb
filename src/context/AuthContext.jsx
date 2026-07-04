// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);     // irá conter { id, nome, email, ... }
  const [token, setToken] = useState(null);

  // Ao carregar o app, tenta restaurar sessão de localStorage ou sessionStorage
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("bw_user") || sessionStorage.getItem("bw_user"));
    const savedToken = localStorage.getItem("bw_token") || sessionStorage.getItem("bw_token");
    if (savedUser && savedToken) {
      setUser(savedUser);
      setToken(savedToken);
    }
  }, []);

  // Função de login: chama backend, atualiza estado e armazena no storage
  const login = (data, keepLogged) => {
    // data = resposta do backend: { access_token, usuario: {id,nome,email,...} }
    setUser(data.usuario);
    setToken(data.access_token);
    const storage = keepLogged ? localStorage : sessionStorage;
    storage.setItem("bw_user", JSON.stringify(data.usuario));
    storage.setItem("bw_token", data.access_token);
  };

  // Função de logout: limpa estado e storage
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("bw_user");
    localStorage.removeItem("bw_token");
    sessionStorage.removeItem("bw_user");
    sessionStorage.removeItem("bw_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}