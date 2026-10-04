import React, { createContext, useEffect, useState } from "react";
import { resolveTheme } from "../components/flow/themes";

export const AuthContext = createContext();

function applyUserTheme(user) {
  const theme = resolveTheme(user?.configuracao || {});
  document.documentElement.style.setProperty("--bw-accent", theme.primary);
  document.documentElement.style.setProperty("--bw-bg", theme.secondary);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bw_user") || sessionStorage.getItem("bw_user");
      const storedToken = localStorage.getItem("bw_token") || sessionStorage.getItem("bw_token");
      if (raw && storedToken) {
        const saved = JSON.parse(raw);
        setUser(saved);
        setToken(storedToken);
        applyUserTheme(saved);
      }
    } catch {
      localStorage.removeItem("bw_user");
      sessionStorage.removeItem("bw_user");
      document.documentElement.style.setProperty("--bw-accent", "#48abb3");
      document.documentElement.style.setProperty("--bw-bg", "#0f2f33");
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  const login = (data, keep) => {
    const next = data.usuario;
    setUser(next);
    setToken(data.access_token);
    applyUserTheme(next);
    const storage = keep ? localStorage : sessionStorage;
    const other = keep ? sessionStorage : localStorage;
    other.removeItem("bw_user");
    other.removeItem("bw_token");
    storage.setItem("bw_user", JSON.stringify(next));
    storage.setItem("bw_token", data.access_token);
  };

  const updateUser = (partial) => setUser((current) => {
    const next = { ...current, ...partial };
    applyUserTheme(next);
    const storage = localStorage.getItem("bw_token") ? localStorage : sessionStorage;
    storage.setItem("bw_user", JSON.stringify(next));
    return next;
  });

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("bw_user");
    localStorage.removeItem("bw_token");
    sessionStorage.removeItem("bw_user");
    sessionStorage.removeItem("bw_token");
    document.documentElement.style.setProperty("--bw-accent", "#48abb3");
    document.documentElement.style.setProperty("--bw-bg", "#0f2f33");
  };

  return <AuthContext.Provider value={{ user, token, isAuthReady, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}