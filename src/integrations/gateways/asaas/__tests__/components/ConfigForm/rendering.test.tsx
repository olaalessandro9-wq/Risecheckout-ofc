/**
 * @file rendering.test.tsx
 * @description Tests for ConfigForm rendering states
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock hooks
vi.mock("../../../hooks", () => ({
  useAsaasConfig: vi.fn(() => ({
    config: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useAsaasValidation: vi.fn(() => ({
    validate: vi.fn(),
    isValidating: false,
    lastResult: null,
  })),
  useAsaasSaveConfig: vi.fn(() => ({
    save: vi.fn(),
    isSaving: false,
  })),
  useAsaasDisconnect: vi.fn(() => ({
    disconnect: vi.fn(),
    isDisconnecting: false,
  })),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    role: "producer",
  }),
}));

import { ConfigForm } from "../../../components/ConfigForm";
import { useAsaasConfig } from "../../../hooks";

describe("ConfigForm Rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state", () => {
    vi.mocked(useAsaasConfig).mockReturnValue({
      config: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = render(<ConfigForm />);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should render form when loaded", () => {
    vi.mocked(useAsaasConfig).mockReturnValue({
      config: {
        apiKey: "",
        environment: "production",
        isConfigured: false,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ConfigForm />);

    const apiKeyLabels = screen.getAllByText(/API Key/i);
    expect(apiKeyLabels.length).toBeGreaterThan(0);
  });

  it("should show connected status when configured", () => {
    vi.mocked(useAsaasConfig).mockReturnValue({
      config: {
        apiKey: "xxx",
        environment: "production",
        isConfigured: true,
        accountName: "Test Company",
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ConfigForm />);

    expect(screen.getByText(/conectado/i)).toBeInTheDocument();
  });
});
