import React, { useContext } from "react";
import LoginPage from "./pages/LoginPage";
import MapPage from "./pages/MapPage";
import { AuthContext, AuthProvider } from "./context/AuthContext";

function AppContent() {
  const { user } = useContext(AuthContext);

  return user ? <MapPage /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}