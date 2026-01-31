/**
 * WebhooksList Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests list rendering, empty state, and dropdown actions.
 * 
 * Uses `as unknown as T` pattern for vi.mocked() calls.
 * Justification: vi.mocked requires full type match, but tests only need
 * the subset of properties actually consumed by the component.
 * 
 * @module test/modules/webhooks/components/WebhooksList
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { WebhooksList } from "../WebhooksList";
import * as WebhooksContext from "../../context/WebhooksContext";
import {
  createMockWebhooksListContext,
  type WebhooksListContextMock,
} from "@/test/factories";

// Mock the context
vi.mock("../../context/WebhooksContext", () => ({
  useWebhooks: vi.fn(),
}));

// Type alias for the mock return type
type MockReturn = ReturnType<typeof WebhooksContext.useWebhooks>;

// Factory for mock webhooks
function createMockWebhook(overrides: Partial<WebhooksListContextMock["filteredWebhooks"][0]> = {}) {
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
  let defaultContext: WebhooksListContextMock;

  beforeEach(() => {
    vi.clearAllMocks();
    defaultContext = createMockWebhooksListContext();
    // RISE V3 Justified: Partial mock - component only uses subset of context
    vi.mocked(WebhooksContext.useWebhooks).mockReturnValue(
      defaultContext as unknown as MockReturn
    );
  });

  describe("empty state", () => {
    it("should show empty message when no webhooks", () => {
      render(<WebhooksList />);

      expect(screen.getByText("Nenhum webhook configurado ainda")).toBeInTheDocument();
    });
  });

  describe("list rendering", () => {
    it("should render webhook name", () => {
      vi.mocked(WebhooksContext.useWebhooks).mockReturnValue(
        createMockWebhooksListContext({
          filteredWebhooks: [createMockWebhook({ name: "Payment Webhook" })],
        }) as unknown as MockReturn
      );

      render(<WebhooksList />);

      expect(screen.getByText("Payment Webhook")).toBeInTheDocument();
    });

    it("should render webhook URL", () => {
      vi.mocked(WebhooksContext.useWebhooks).mockReturnValue(
        createMockWebhooksListContext({
          filteredWebhooks: [createMockWebhook({ url: "https://test.com/hook" })],
        }) as unknown as MockReturn
      );

      render(<WebhooksList />);

      expect(screen.getByText("https://test.com/hook")).toBeInTheDocument();
    });

    it("should render multiple webhooks", () => {
      vi.mocked(WebhooksContext.useWebhooks).mockReturnValue(
        createMockWebhooksListContext({
          filteredWebhooks: [
            createMockWebhook({ id: "1", name: "Webhook A" }),
            createMockWebhook({ id: "2", name: "Webhook B" }),
            createMockWebhook({ id: "3", name: "Webhook C" }),
          ],
        }) as unknown as MockReturn
      );

      render(<WebhooksList />);

      expect(screen.getByText("Webhook A")).toBeInTheDocument();
      expect(screen.getByText("Webhook B")).toBeInTheDocument();
      expect(screen.getByText("Webhook C")).toBeInTheDocument();
    });

    it("should render column headers", () => {
      vi.mocked(WebhooksContext.useWebhooks).mockReturnValue(
        createMockWebhooksListContext({
          filteredWebhooks: [createMockWebhook()],
        }) as unknown as MockReturn
      );

      render(<WebhooksList />);

      expect(screen.getByText("Nome")).toBeInTheDocument();
      expect(screen.getByText("URL")).toBeInTheDocument();
    });
  });

  describe("dropdown menu", () => {
    it("should render dropdown trigger button", () => {
      vi.mocked(WebhooksContext.useWebhooks).mockReturnValue(
        createMockWebhooksListContext({
          filteredWebhooks: [createMockWebhook()],
        }) as unknown as MockReturn
      );

      render(<WebhooksList />);

      // Find the dropdown trigger button (MoreVertical icon button)
      const moreButton = screen.getByRole("button");
      expect(moreButton).toBeInTheDocument();
    });
  });
});
