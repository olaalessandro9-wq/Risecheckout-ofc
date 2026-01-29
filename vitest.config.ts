/**
 * Vitest Configuration
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Enterprise-grade test configuration for RiseCheckout.
 * Implements Testing Pyramid strategy: 70% Unit / 20% Integration / 10% E2E
 * 
 * @module vitest.config
 */

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment
    environment: "jsdom",
    globals: true,
    
    // Setup
    setupFiles: ["./src/test/setup.ts"],
    
    // Test file patterns
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "e2e/**", "dist/**"],
    
    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      
      // Files to include in coverage
      include: ["src/**/*.{ts,tsx}"],
      
      // Files to exclude from coverage
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/test/**",
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/integrations/supabase/types.ts",
      ],
      
      // Coverage thresholds - RISE V3 compliance
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
    },
    
    // Test execution
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporter
    reporters: ["default"],
    
    // Vitest 4.x: pool options are now top-level
    isolate: true,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
