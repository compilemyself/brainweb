// src/context/AuthContext.jsx
import React, { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Restaura a sessão antes de liberar a navegação, evitando que a landing page
  // anônima apareça brevemente para uma conta que já estava conectada.
  useEffect(() => {
    try {
      const savedUserRaw =
        localStorage.getItem("bw_user") || sessionStorage.getItem("bw_user");
      const savedToken =
        localStorage.getItem("bw_token") || sessionStorage.getItem("bw_token");
      const savedUser = savedUserRaw ? JSON.parse(savedUserRaw) : null;

      if (savedUser && savedToken) {
        setUser(savedUser);
        setToken(savedToken);
      }
    } catch (error) {
      console.error("Não foi possível restaurar a sessão:", error);
      localStorage.removeItem("bw_user");
      localStorage.removeItem("bw_token");
      sessionStorage.removeItem("bw_user");
      sessionStorage.removeItem("bw_token");
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  const login = (data, keepLogged) => {
    setUser(data.usuario);
    setToken(data.access_token);

    const storage = keepLogged ? localStorage : sessionStorage;
    const otherStorage = keepLogged ? sessionStorage : localStorage;

    otherStorage.removeItem("bw_user");
    otherStorage.removeItem("bw_token");
    storage.setItem("bw_user", JSON.stringify(data.usuario));
    storage.setItem("bw_token", data.access_token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("bw_user");
    localStorage.removeItem("bw_token");
    sessionStorage.removeItem("bw_user");
    sessionStorage.removeItem("bw_token");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthReady, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
