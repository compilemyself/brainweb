import React, { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bw_user") || sessionStorage.getItem("bw_user");
      const savedToken = localStorage.getItem("bw_token") || sessionStorage.getItem("bw_token");

      if (raw && savedToken) {
        const saved = JSON.parse(raw);
        setUser(saved);
        setToken(savedToken);
        document.documentElement.style.setProperty(
          "--bw-accent", saved.cor_mapa || "#48abb3"
        );
      }
    } catch {
      localStorage.clear();
      sessionStorage.removeItem("bw_user");
      sessionStorage.removeItem("bw_token");
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  const login = (data, keepLogged) => {
    const nextUser = data.usuario;
    setUser(nextUser);
    setToken(data.access_token);
    document.documentElement.style.setProperty(
      "--bw-accent", nextUser.cor_mapa || "#48abb3"
    );

    const storage = keepLogged ? localStorage : sessionStorage;
    const other = keepLogged ? sessionStorage : localStorage;

    other.removeItem("bw_user");
    other.removeItem("bw_token");
    storage.setItem("bw_user", JSON.stringify(nextUser));
    storage.setItem("bw_token", data.access_token);
  };

  const updateUser = (partial) => setUser((current) => {
    const next = { ...current, ...partial };
    const storage = localStorage.getItem("bw_token") ? localStorage : sessionStorage;

    storage.setItem("bw_user", JSON.stringify(next));
    document.documentElement.style.setProperty(
      "--bw-accent", next.cor_mapa || "#48abb3"
    );

    return next;
  });

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("bw_user");
    localStorage.removeItem("bw_token");
    sessionStorage.removeItem("bw_user");
    sessionStorage.removeItem("bw_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthReady, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}