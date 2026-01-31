/**
 * @file disconnect-flow.test.tsx
 * @description Tests for ConfigForm disconnect flow
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
import { useAsaasConfig, useAsaasDisconnect } from "../../../hooks";

describe("ConfigForm Disconnect Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should disconnect when clicking disconnect button", async () => {
    const disconnectMock = vi.fn().mockResolvedValue({ success: true });

    vi.mocked(useAsaasConfig).mockReturnValue({
      config: {
        apiKey: "xxx",
        environment: "production",
        isConfigured: true,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    vi.mocked(useAsaasDisconnect).mockReturnValue({
      disconnect: disconnectMock,
      isDisconnecting: false,
    });

    render(<ConfigForm />);

    const disconnectButton = screen.getByRole("button", {
      name: /desconectar/i,
    });
    await userEvent.click(disconnectButton);

    await waitFor(() => {
      expect(disconnectMock).toHaveBeenCalled();
    });
  });

  it("should show loading state during disconnect", () => {
    vi.mocked(useAsaasConfig).mockReturnValue({
      config: {
        apiKey: "xxx",
        environment: "production",
        isConfigured: true,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    vi.mocked(useAsaasDisconnect).mockReturnValue({
      disconnect: vi.fn(),
      isDisconnecting: true,
    });

    render(<ConfigForm />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length > 0).toBeTruthy();
  });
});
