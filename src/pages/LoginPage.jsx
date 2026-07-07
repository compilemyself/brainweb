import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import * as api from "../services/api";

// Bloco de CSS responsável por centralizar toda identidade visual da landing page.
// Define características dos elementos como fonte, cores, animações, etc.
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .root {
    font-family: 'Courier Prime', 'Courier New', monospace;
    color: #fff;
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #48abb3;
    padding: 24px;
  }

  .card {
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .greeting {
    font-size: clamp(1.4rem, 5vw, 1.8rem);
    font-weight: 400;
    letter-spacing: 0.02em;
    text-align: center;
    margin-bottom: 40px;
    animation: fadeUp 0.6s ease both;
    animation-delay: 0.1s;
  }

  .btn-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    animation: fadeUp 0.6s ease both;
    animation-delay: 0.25s;
  }

  .login-expand {
    width: 100%;
    display: flex;
    flex-direction: column;
    animation: expandDown 0.35s ease both;
    overflow: hidden;
  }

  @keyframes expandDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .btn {
    width: 100%;
    padding: 14px 20px;
    background: transparent;
    border: 1.5px solid rgba(255,255,255,0.6);
    color: #fff;
    font-family: 'Courier Prime', 'Courier New', monospace;
    font-size: 0.95rem;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
    text-align: center;
    outline: none;
  }

  .btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.9);
  }

  .btn:disabled {
    cursor: wait;
    opacity: 0.65;
  }

  .btn.primary {
    background: rgba(255,255,255,0.15);
    border-color: #fff;
  }

  .btn.primary:hover:not(:disabled) {
    background: rgba(255,255,255,0.28);
  }

  .login-box, .register-box {
    width: 100%;
    display: flex;
    flex-direction: column;
    animation: fadeUp 0.45s ease both;
  }

  .input-field {
    width: 100%;
    padding: 14px 16px;
    background: transparent;
    border: 1.5px solid rgba(255,255,255,0.5);
    border-bottom: none;
    color: #fff;
    font-family: 'Courier Prime', 'Courier New', monospace;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    border-radius: 0;
    -webkit-appearance: none;
  }

  .input-field.last {
    border-bottom: 1.5px solid rgba(255,255,255,0.5);
  }

  .input-field:focus {
    border-color: rgba(255,255,255,0.95);
    background: rgba(255,255,255,0.06);
  }

  .input-field::placeholder {
    color: rgba(255,255,255,0.45);
    letter-spacing: 0.04em;
  }

  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
    cursor: pointer;
    width: fit-content;
  }

  .checkbox-box {
    width: 14px;
    height: 14px;
    border: 1.5px solid rgba(255,255,255,0.6);
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s;
    font-size: 10px;
  }

  .checkbox-box.checked {
    background: rgba(255,255,255,0.25);
    border-color: #fff;
  }

  .checkbox-label {
    font-size: 0.78rem;
    letter-spacing: 0.04em;
    color: rgba(255,255,255,0.7);
    user-select: none;
  }

  .login-submit {
    margin-top: 20px;
  }

  .register-link {
    margin-top: 24px;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.45);
    letter-spacing: 0.04em;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: rgba(255,255,255,0.25);
    transition: color 0.2s;
    text-align: center;
    background: none;
    border: none;
    font-family: 'Courier Prime', 'Courier New', monospace;
  }

  .register-link:hover { color: rgba(255,255,255,0.75); }

  .screen-title {
    font-size: clamp(1.2rem, 4vw, 1.5rem);
    font-weight: 400;
    letter-spacing: 0.03em;
    text-align: center;
    margin-bottom: 28px;
  }

  .feedback {
    min-height: 18px;
    margin-top: 14px;
    font-size: 0.78rem;
    line-height: 1.35;
    color: rgba(255,255,255,0.9);
    text-align: center;
  }

  .back-btn {
    background: none;
    border: none;
    color: rgba(255,255,255,0.4);
    font-family: 'Courier Prime', 'Courier New', monospace;
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    cursor: pointer;
    margin-bottom: 32px;
    align-self: flex-start;
    padding: 0;
    transition: color 0.2s;
  }

  .back-btn:hover { color: rgba(255,255,255,0.75); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 480px) {
    .card { max-width: 100%; }
  }
`;

// Componente principal da tela de login/registro. Controla a navegação entre as telas "home" (login) e "register",
// além do estado de expansão do formulário de login, do checkbox "manter-me conectado" e da chave de animação.
export default function LoginScreen() {
  const { user, login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nomeCadastro, setNomeCadastro] = useState("");
  const [emailCadastro, setEmailCadastro] = useState("");
  const [senhaCadastro, setSenhaCadastro] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const [screen, setScreen] = useState("home");
  const [loginOpen, setLoginOpen] = useState(false);
  const [keepLogged, setKeepLogged] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  // Alterna para a tela de cadastro e reinicia a chave de animação para disparar a transição de entrada.
  function goRegister() {
    setScreen("register");
    setFeedback("");
    setAnimKey(function(k) { return k + 1; });
  }

  // Retorna à tela inicial, fecha o formulário de login expandido e reinicia a animação.
  function goBack() {
    setScreen("home");
    setLoginOpen(false);
    setFeedback("");
    setAnimKey(function(k) { return k + 1; });
  }

  // Abre o formulário de login expandido ao clicar no botão "fazer login".
  function handleLoginClick() {
    setLoginOpen(true);
  }

  async function handleLoginSubmit() {
    if (!email.trim() || !senha) {
      setFeedback("Informe e-mail e senha.");
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      const data = await api.login(email.trim(), senha);
      login(data, keepLogged);
    } catch (err) {
      setFeedback(err.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit() {
    if (!nomeCadastro.trim() || !emailCadastro.trim() || !senhaCadastro) {
      setFeedback("Preencha nome, e-mail e senha.");
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      await api.registrar(
        nomeCadastro.trim(),
        emailCadastro.trim(),
        senhaCadastro
      );

      const data = await api.login(emailCadastro.trim(), senhaCadastro);
      login(data, true);
    } catch (err) {
      setFeedback(err.message || "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  function submitOnEnter(event, submitAction) {
    if (event.key === "Enter") {
      submitAction();
    }
  }

  // Renderização da tela de criação de conta (nome de usuário, e-mail e senha).
  if (screen === "register") {
    return React.createElement(React.Fragment, null,
      React.createElement("style", null, styles),
      React.createElement("div", { className: "root" },
        React.createElement("div", { className: "card" },
          React.createElement("div", { className: "register-box", key: "register-" + animKey },
            React.createElement("button", { className: "back-btn", onClick: goBack }, "← voltar"),
            React.createElement("p", { className: "screen-title" }, "Crie sua conta"),
            React.createElement("input", {
              className: "input-field",
              type: "text",
              placeholder: "nome de usuário",
              autoComplete: "username",
              autoFocus: true,
              value: nomeCadastro,
              onChange: function(e) { setNomeCadastro(e.target.value); },
              onKeyDown: function(e) { submitOnEnter(e, handleRegisterSubmit); }
            }),
            React.createElement("input", {
              className: "input-field",
              type: "email",
              placeholder: "e-mail",
              autoComplete: "email",
              value: emailCadastro,
              onChange: function(e) { setEmailCadastro(e.target.value); },
              onKeyDown: function(e) { submitOnEnter(e, handleRegisterSubmit); }
            }),
            React.createElement("input", {
              className: "input-field last",
              type: "password",
              placeholder: "senha",
              autoComplete: "new-password",
              value: senhaCadastro,
              onChange: function(e) { setSenhaCadastro(e.target.value); },
              onKeyDown: function(e) { submitOnEnter(e, handleRegisterSubmit); }
            }),
            feedback ? React.createElement("p", { className: "feedback" }, feedback) : null,
            React.createElement("button", {
              className: "btn primary login-submit",
              onClick: handleRegisterSubmit,
              disabled: loading
            }, loading ? "criando..." : "criar conta")
          )
        )
      )
    );
  }

  // Renderização da tela inicial com a saudação, o botão/formulário de login e o botão de criar mapa temporário.
  return React.createElement(React.Fragment, null,
    React.createElement("style", null, styles),
    React.createElement("div", { className: "root" },
      React.createElement("div", { className: "card" },
        // "Olá, {nome de usuário}." (padrão: Anônimo)
        React.createElement("p",
          { className: "greeting" },
          "Olá, ", user ? user.nome : "Anônimo",
          "."),

        React.createElement("div", { className: "btn-group" },

          // exibir botão "fazer login" ou formulário de login expandido
          loginOpen
            ? React.createElement("div", { className: "login-expand", key: "expand-" + animKey },
              React.createElement("input", {
                className: "input-field",
                type: "email",
                placeholder: "e-mail",
                autoComplete: "email",
                autoFocus: true,
                value: email,
                onChange: function(e) { setEmail(e.target.value); },
                onKeyDown: function(e) { submitOnEnter(e, handleLoginSubmit); }
              }),
              React.createElement("input", {
                className: "input-field last",
                type: "password",
                placeholder: "senha",
                autoComplete: "current-password",
                value: senha,
                onChange: function(e) { setSenha(e.target.value); },
                onKeyDown: function(e) { submitOnEnter(e, handleLoginSubmit); }
              }),
              React.createElement("div", { className: "checkbox-row", onClick: function() { setKeepLogged(function(v) { return !v; }); } },
                React.createElement("div", { className: "checkbox-box" + (keepLogged ? " checked" : "") }, keepLogged ? "✓" : ""),
                React.createElement("span", { className: "checkbox-label" }, "manter-me conectado")),

              feedback ? React.createElement("p", { className: "feedback" }, feedback) : null,

              React.createElement("button", {
                className: "btn primary login-submit",
                onClick: handleLoginSubmit,
                disabled: loading
              }, loading ? "entrando..." : "entrar"),
              React.createElement("button", { className: "register-link", onClick: goRegister }, "cadastre-se para salvar seu progresso.")
            )
            : React.createElement("button", { className: "btn primary", onClick: handleLoginClick }, "fazer login"),

          // "criar mapa temporário" sempre visível
          React.createElement("button", { className: "btn" }, "criar mapa temporário")
        )
      )
    )
  );
}
