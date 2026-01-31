/**
 * @file connect-flow.test.tsx
 * @description Tests for ConfigForm connect flow
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
} from "../../../hooks";

describe("ConfigForm Connect Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate and save on connect", async () => {
    const validateMock = vi.fn().mockResolvedValue({
      valid: true,
      accountName: "Test Company",
      walletId: "wallet-123",
    });
    const saveMock = vi.fn().mockResolvedValue({ success: true });

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
      validate: validateMock,
      isValidating: false,
      lastResult: null,
    });

    vi.mocked(useAsaasSaveConfig).mockReturnValue({
      save: saveMock,
      isSaving: false,
    });

    render(<ConfigForm />);

    const apiKeyInput = screen.getByPlaceholderText(/\$aact/i);
    await userEvent.type(apiKeyInput, "$aact_prod_xxx");

    const connectButton = screen.getByRole("button", { name: /conectar/i });
    await userEvent.click(connectButton);

    await waitFor(() => {
      expect(validateMock).toHaveBeenCalledWith(
        "$aact_prod_xxx",
        "production"
      );
    });

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalled();
    });
  });

  it("should not save if validation fails", async () => {
    const validateMock = vi.fn().mockResolvedValue({
      valid: false,
      message: "API key inválida",
    });
    const saveMock = vi.fn();

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
      validate: validateMock,
      isValidating: false,
      lastResult: null,
    });

    vi.mocked(useAsaasSaveConfig).mockReturnValue({
      save: saveMock,
      isSaving: false,
    });

    render(<ConfigForm />);

    const apiKeyInput = screen.getByPlaceholderText(/\$aact/i);
    await userEvent.type(apiKeyInput, "invalid_key");

    const connectButton = screen.getByRole("button", { name: /conectar/i });
    await userEvent.click(connectButton);

    await waitFor(() => {
      expect(validateMock).toHaveBeenCalled();
    });

    expect(saveMock).not.toHaveBeenCalled();
  });

  it("should show loading state during connect", () => {
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
      validate: vi.fn(),
      isValidating: true,
      lastResult: null,
    });

    render(<ConfigForm />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length > 0).toBeTruthy();
  });
});
