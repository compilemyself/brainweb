import React, { useContext, useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import MapPage from "./pages/MapPage";
import { AuthContext, AuthProvider } from "./context/AuthContext";

function AppContent() {
  const { user, isAuthReady } = useContext(AuthContext);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setMapOpen(false);
    }
  }, [user]);

  if (!isAuthReady) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#48abb3",
          color: "white",
          fontFamily: "'Courier New', monospace",
        }}
      >
        carregando sessão...
      </div>
    );
  }

  if (user && mapOpen) {
    return <MapPage />;
  }

  return <LoginPage onOpenMap={() => setMapOpen(true)} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
