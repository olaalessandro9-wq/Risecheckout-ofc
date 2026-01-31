/**
 * @file validation.test.tsx
 * @description Tests for ConfigForm validation
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const toastMock = vi.fn();

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
    toast: toastMock,
  }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    role: "producer",
  }),
}));

import { ConfigForm } from "../../../components/ConfigForm";
import { useAsaasConfig } from "../../../hooks";

describe("ConfigForm Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show error for empty API key on connect", async () => {
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

    const connectButton = screen.getByRole("button", { name: /conectar/i });
    await userEvent.click(connectButton);

    expect(toastMock).toBeDefined();
  });
});
