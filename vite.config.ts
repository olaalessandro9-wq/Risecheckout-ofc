import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [".manusvm.computer", ".manus.computer"],
  },
  plugins: [react()],
  // Remove console.log/warn/debug e debugger statements em produção
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Ensure a single React singleton across all optimized deps
    dedupe: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router-dom",
      "@tanstack/react-query",
      "@radix-ui/react-context",
      "@radix-ui/react-slot",
    ],
  },
}));
