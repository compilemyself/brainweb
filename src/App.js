import React, { useContext, useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import MapPage from "./pages/MapPage";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { resolveTheme } from "./components/flow/themes";

function AppContent() {
  const { user, isAuthReady } = useContext(AuthContext);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    if (!user) setMapOpen(false);
  }, [user]);

  useEffect(() => {
    const theme = resolveTheme(user?.configuracao || {});
    document.documentElement.style.setProperty("--bw-accent", theme.primary);
    document.documentElement.style.setProperty("--bw-bg", theme.secondary);
  }, [user?.configuracao]);

  if (!isAuthReady) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bw-accent)", color: "white" }}>
        carregando sessão...
      </div>
    );
  }

  if (user && mapOpen) return <MapPage />;
  return <LoginPage onOpenMap={() => setMapOpen(true)} />;
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}