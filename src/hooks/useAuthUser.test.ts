/**
 * useAuthUser Hook Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthUser } from "./useAuthUser";
import type { ReactNode } from "react";

// Create a new QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return QueryClientProvider({ client: queryClient, children });
  };
}

describe("useAuthUser", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should return null user when not authenticated", () => {
    // No data in cache = not authenticated
    const { result } = renderHook(() => useAuthUser(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should return user data from cache", () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    };

    // Set data in cache
    queryClient.setQueryData(["unified-auth"], {
      valid: true,
      user: mockUser,
    });

    const { result } = renderHook(() => useAuthUser(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it("should return isAuthenticated from cache", () => {
    queryClient.setQueryData(["unified-auth"], {
      valid: true,
      user: { id: "user-1", email: "a@b.com" },
    });

    const { result } = renderHook(() => useAuthUser(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it("should return email accessor", () => {
    queryClient.setQueryData(["unified-auth"], {
      valid: true,
      user: { id: "user-1", email: "user@domain.com", name: "User" },
    });

    const { result } = renderHook(() => useAuthUser(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.email).toBe("user@domain.com");
  });

  it("should return name accessor", () => {
    queryClient.setQueryData(["unified-auth"], {
      valid: true,
      user: { id: "user-1", email: "a@b.com", name: "John Doe" },
    });

    const { result } = renderHook(() => useAuthUser(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.name).toBe("John Doe");
  });

  it("should return null for email and name when not authenticated", () => {
    const { result } = renderHook(() => useAuthUser(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.email).toBeNull();
    expect(result.current.name).toBeNull();
  });
});
