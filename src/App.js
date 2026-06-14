import React from "react";
import LoginPage from "./pages/LoginPage";

// Módulo principal da aplicação. Responsável por renderizar a página inicial,
// atualmente a tela de login/registro (LoginPage).
export default function App() {
  return React.createElement(LoginPage);
}