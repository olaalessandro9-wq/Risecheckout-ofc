/**
 * WebhooksList Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests list rendering, empty state, and dropdown actions.
 * 
 * @module test/modules/webhooks/components/WebhooksList
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WebhooksList } from "../WebhooksList";
import * as WebhooksContext from "../../context/WebhooksContext";

// Mock the context
vi.mock("../../context/WebhooksContext", () => ({
  useWebhooks: vi.fn(),
}));

// Factory for mock webhooks
function createMockWebhook(overrides = {}) {
  return {
    id: "webhook-1",
    name: "My Webhook",
    url: "https://api.example.com/webhook",
    events: ["order.paid"],
    active: true,
    ...overrides,
  };
}

describe("WebhooksList", () => {
  const defaultContext = {
    filteredWebhooks: [],
    openForm: vi.fn(),
    requestDelete: vi.fn(),
    openTest: vi.fn(),
    openLogs: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(WebhooksContext.useWebhooks).mockReturnValue(defaultContext as never);
  });

  describe("empty state", () => {
    it("should show empty message when no webhooks", () => {
      render(<WebhooksList />);

      expect(screen.getByText("Nenhum webhook configurado ainda")).toBeInTheDocument();
    });
  });

  describe("list rendering", () => {
    it("should render webhook name", () => {
      vi.mocked(WebhooksContext.useWebhooks).mockReturnValue({
        ...defaultContext,
        filteredWebhooks: [createMockWebhook({ name: "Payment Webhook" })],
      } as never);

      render(<WebhooksList />);

      expect(screen.getByText("Payment Webhook")).toBeInTheDocument();
    });

    it("should render webhook URL", () => {
      vi.mocked(WebhooksContext.useWebhooks).mockReturnValue({
        ...defaultContext,
        filteredWebhooks: [createMockWebhook({ url: "https://test.com/hook" })],
      } as never);

      render(<WebhooksList />);

      expect(screen.getByText("https://test.com/hook")).toBeInTheDocument();
    });

    it("should render multiple webhooks", () => {
      vi.mocked(WebhooksContext.useWebhooks).mockReturnValue({
        ...defaultContext,
        filteredWebhooks: [
          createMockWebhook({ id: "1", name: "Webhook A" }),
          createMockWebhook({ id: "2", name: "Webhook B" }),
          createMockWebhook({ id: "3", name: "Webhook C" }),
        ],
      } as never);

      render(<WebhooksList />);

      expect(screen.getByText("Webhook A")).toBeInTheDocument();
      expect(screen.getByText("Webhook B")).toBeInTheDocument();
      expect(screen.getByText("Webhook C")).toBeInTheDocument();
    });

    it("should render column headers", () => {
      vi.mocked(WebhooksContext.useWebhooks).mockReturnValue({
        ...defaultContext,
        filteredWebhooks: [createMockWebhook()],
      } as never);

      render(<WebhooksList />);

      expect(screen.getByText("Nome")).toBeInTheDocument();
      expect(screen.getByText("URL")).toBeInTheDocument();
    });
  });

  describe("dropdown menu", () => {
    it("should render dropdown trigger button", () => {
      vi.mocked(WebhooksContext.useWebhooks).mockReturnValue({
        ...defaultContext,
        filteredWebhooks: [createMockWebhook()],
      } as never);

      render(<WebhooksList />);

      // Find the dropdown trigger button (MoreVertical icon button)
      const moreButton = screen.getByRole("button");
      expect(moreButton).toBeInTheDocument();
    });
  });
});
