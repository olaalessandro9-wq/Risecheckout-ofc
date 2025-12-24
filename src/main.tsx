import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Diagnostics for invalid-hook-call issues (React singleton)
console.info("[boot] react version:", React.version);
(window as any).__APP_REACT__ = React;

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");

ReactDOM.createRoot(container).render(<App />);

