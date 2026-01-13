import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

// Inicializar Sentry para rastreamento de erros
Sentry.init({
  dsn: "https://e765578f4626da6f4f17cb8841935ee2@o4510653305126912.ingest.us.sentry.io/4510653312401408",
  environment: import.meta.env.DEV ? "development" : "production",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Diagnostics for invalid-hook-call issues (React singleton)
console.info("[boot] react version:", React.version);
window.__APP_REACT__ = React;

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");

ReactDOM.createRoot(container).render(<App />);

