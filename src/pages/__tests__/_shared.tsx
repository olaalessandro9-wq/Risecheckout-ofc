/**
 * @file _shared.tsx
 * @description Shared utilities and mocks for pages tests
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { vi } from "vitest";

// ============================================================================
// MOCK NAVIGATION
// ============================================================================

export const mockNavigate = vi.fn();
export const mockParams = {};
export const mockSearchParams = new URLSearchParams();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
    useSearchParams: () => [mockSearchParams, vi.fn()],
  };
});

// ============================================================================
// MOCK AUTH
// ============================================================================

export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
};

export const mockAuthState = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  logout: vi.fn(),
};

vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: () => mockAuthState,
}));
