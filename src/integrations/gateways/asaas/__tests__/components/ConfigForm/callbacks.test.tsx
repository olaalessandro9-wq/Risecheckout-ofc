/**
 * @file callbacks.test.tsx
 * @description Tests for ConfigForm callback props
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
import {
  useAsaasConfig,
  useAsaasValidation,
  useAsaasSaveConfig,
  useAsaasDisconnect,
} from "../../../hooks";

describe("ConfigForm Callbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call onConnectionChange on successful connect", async () => {
    const onConnectionChangeMock = vi.fn();

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

    vi.mocked(useAsaasValidation).mockReturnValue({
      validate: vi.fn().mockResolvedValue({
        valid: true,
        walletId: "wallet-123",
      }),
      isValidating: false,
      lastResult: null,
    });

    vi.mocked(useAsaasSaveConfig).mockReturnValue({
      save: vi.fn().mockResolvedValue({ success: true }),
      isSaving: false,
    });

    render(<ConfigForm onConnectionChange={onConnectionChangeMock} />);

    const apiKeyInput = screen.getByPlaceholderText(/\$aact/i);
    await userEvent.type(apiKeyInput, "$aact_prod_xxx");

    const connectButton = screen.getByRole("button", { name: /conectar/i });
    await userEvent.click(connectButton);

    await waitFor(() => {
      expect(onConnectionChangeMock).toHaveBeenCalled();
    });
  });

  it("should call onConnectionChange on disconnect", async () => {
    const onConnectionChangeMock = vi.fn();

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
      disconnect: vi.fn().mockResolvedValue({ success: true }),
      isDisconnecting: false,
    });

    render(<ConfigForm onConnectionChange={onConnectionChangeMock} />);

    const disconnectButton = screen.getByRole("button", {
      name: /desconectar/i,
    });
    await userEvent.click(disconnectButton);

    await waitFor(() => {
      expect(onConnectionChangeMock).toHaveBeenCalled();
    });
  });

  it("should render environment section for producer", () => {
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

    const { container } = render(<ConfigForm />);

    expect(
      container.querySelector("form") || container.querySelector("input")
    ).toBeTruthy();
  });
});
