/**
 * @file _shared.ts
 * @description Shared mocks and utilities for Asaas hooks tests
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { vi } from "vitest";

// Mock dependencies
export const setupMocks = () => {
  vi.mock("@/hooks/useUnifiedAuth", () => ({
    useUnifiedAuth: vi.fn(() => ({
      user: { id: "user-123" },
      isLoading: false,
    })),
  }));

  vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  }));

  vi.mock("../../api", () => ({
    getAsaasSettings: vi.fn(),
    saveAsaasSettings: vi.fn(),
    validateAsaasCredentials: vi.fn(),
    disconnectAsaas: vi.fn(),
    isAsaasConnected: vi.fn(),
  }));
};

// Re-export mocked modules
export { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
export {
  getAsaasSettings,
  saveAsaasSettings,
  validateAsaasCredentials,
  disconnectAsaas,
  isAsaasConnected,
} from "../../api";

// Re-export hooks under test
export {
  useAsaasConfig,
  useAsaasValidation,
  useAsaasSaveConfig,
  useAsaasDisconnect,
  useAsaasConnectionStatus,
} from "../../hooks";
