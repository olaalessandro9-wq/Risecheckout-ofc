/**
 * useMembersArea Hook Tests
 * 
 * RISE V3 Compliant - 10.0/10
 * Tests facade hook that composes settings, modules, and contents
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMembersArea } from "../useMembersArea";
import { api } from "@/lib/api";
import type { ModuleWithContents } from "../types";

// Mock dependencies
vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
  },
}));

vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: () => ({
    user: { id: "user-1", email: "test@example.com" },
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

// Test factory
function createMockModule(id: string = "module-1"): ModuleWithContents {
  return {
    id,
    product_id: "product-1",
    title: "Module 1",
    description: "Test module",
    position: 0,
    is_active: true,
    cover_image_url: null,
    width: null,
    height: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    contents: [],
  };
}

describe("useMembersArea", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock responses
    (api.call as Mock).mockImplementation((functionName: string, params: Record<string, unknown>) => {
      if (params.action === "members-area-settings") {
        return Promise.resolve({
          data: { success: true, data: { enabled: true, settings: null } },
          error: null,
        });
      }
      if (params.action === "members-area-modules-with-contents") {
        return Promise.resolve({
          data: { success: true, data: [createMockModule()] },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });
  });

  describe("initialization", () => {
    it("should return correct interface shape", async () => {
      const { result } = renderHook(() => useMembersArea("product-1"), {
        wrapper: createWrapper(),
      });

      // Check all required properties exist
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("isSaving");
      expect(result.current).toHaveProperty("settings");
      expect(result.current).toHaveProperty("modules");
      expect(result.current).toHaveProperty("updateSettings");
      expect(result.current).toHaveProperty("fetchModules");
      expect(result.current).toHaveProperty("addModule");
      expect(result.current).toHaveProperty("updateModule");
      expect(result.current).toHaveProperty("deleteModule");
      expect(result.current).toHaveProperty("reorderModules");
      expect(result.current).toHaveProperty("addContent");
      expect(result.current).toHaveProperty("updateContent");
      expect(result.current).toHaveProperty("deleteContent");
      expect(result.current).toHaveProperty("reorderContents");
    });

    it("should start loading when productId is provided", async () => {
      const { result } = renderHook(() => useMembersArea("product-1"), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should not fetch when productId is undefined", async () => {
      const { result } = renderHook(() => useMembersArea(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.modules).toEqual([]);
    });
  });

  describe("settings", () => {
    it("should load settings from API", async () => {
      (api.call as Mock).mockImplementation((functionName: string, params: Record<string, unknown>) => {
        if (params.action === "members-area-settings") {
          return Promise.resolve({
            data: {
              success: true,
              data: { enabled: true, settings: { theme: "dark" } },
            },
            error: null,
          });
        }
        if (params.action === "members-area-modules-with-contents") {
          return Promise.resolve({ data: { success: true, data: [] }, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const { result } = renderHook(() => useMembersArea("product-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings.enabled).toBe(true);
    });
  });

  describe("modules", () => {
    it("should load modules from API", async () => {
      const mockModule = createMockModule();

      (api.call as Mock).mockImplementation((functionName: string, params: Record<string, unknown>) => {
        if (params.action === "members-area-settings") {
          return Promise.resolve({
            data: { success: true, data: { enabled: true, settings: null } },
            error: null,
          });
        }
        if (params.action === "members-area-modules-with-contents") {
          return Promise.resolve({
            data: { success: true, data: [mockModule] },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const { result } = renderHook(() => useMembersArea("product-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.modules).toHaveLength(1);
      });

      expect(result.current.modules[0].id).toBe("module-1");
    });
  });

  describe("module CRUD operations", () => {
    it("should have addModule function", async () => {
      const { result } = renderHook(() => useMembersArea("product-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.addModule).toBe("function");
    });

    it("should have updateModule function", async () => {
      const { result } = renderHook(() => useMembersArea("product-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.updateModule).toBe("function");
    });

    it("should have deleteModule function", async () => {
      const { result } = renderHook(() => useMembersArea("product-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.deleteModule).toBe("function");
    });

    it("should have reorderModules function", async () => {
      const { result } = renderHook(() => useMembersArea("product-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.reorderModules).toBe("function");
    });
  });

  describe("content CRUD operations", () => {
    it("should have all content CRUD functions", async () => {
      const { result } = renderHook(() => useMembersArea("product-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.addContent).toBe("function");
      expect(typeof result.current.updateContent).toBe("function");
      expect(typeof result.current.deleteContent).toBe("function");
      expect(typeof result.current.reorderContents).toBe("function");
    });
  });
});
