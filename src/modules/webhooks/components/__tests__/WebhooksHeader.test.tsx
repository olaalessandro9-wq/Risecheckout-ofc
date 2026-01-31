/**
 * WebhooksHeader Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests search input, product filter, and add button functionality.
 * 
 * Uses `as unknown as T` pattern for vi.mocked() calls.
 * Justification: vi.mocked requires full type match, but tests only need
 * the subset of properties actually consumed by the component.
 * 
 * @module test/modules/webhooks/components/WebhooksHeader
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WebhooksHeader } from "../WebhooksHeader";
import * as WebhooksContext from "../../context/WebhooksContext";
import {
  createMockWebhooksHeaderContext,
  type WebhooksHeaderContextMock,
} from "@/test/factories";

// Mock the context
vi.mock("../../context/WebhooksContext", () => ({
  useWebhooks: vi.fn(),
}));

// Type alias for the mock return type
type MockReturn = ReturnType<typeof WebhooksContext.useWebhooks>;

describe("WebhooksHeader", () => {
  let defaultContext: WebhooksHeaderContextMock;

  beforeEach(() => {
    vi.clearAllMocks();
    defaultContext = createMockWebhooksHeaderContext();
    // RISE V3 Justified: Partial mock - component only uses subset of context
    vi.mocked(WebhooksContext.useWebhooks).mockReturnValue(
      defaultContext as unknown as MockReturn
    );
  });

  describe("search input", () => {
    it("should render search input", () => {
      render(<WebhooksHeader />);

      expect(screen.getByPlaceholderText("Pesquisar")).toBeInTheDocument();
    });

    it("should show current search value", () => {
      vi.mocked(WebhooksContext.useWebhooks).mockReturnValue(
        createMockWebhooksHeaderContext({ searchTerm: "test search" }) as unknown as MockReturn
      );

      render(<WebhooksHeader />);

      expect(screen.getByDisplayValue("test search")).toBeInTheDocument();
    });

    it("should call setSearchTerm on input change", () => {
      const setSearchTerm = vi.fn();
      
      vi.mocked(WebhooksContext.useWebhooks).mockReturnValue(
        createMockWebhooksHeaderContext({ setSearchTerm }) as unknown as MockReturn
      );

      render(<WebhooksHeader />);

      fireEvent.change(screen.getByPlaceholderText("Pesquisar"), {
        target: { value: "webhook" },
      });

      expect(setSearchTerm).toHaveBeenCalled();
    });
  });

  describe("product filter", () => {
    it("should render product filter select", () => {
      render(<WebhooksHeader />);

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  describe("add button", () => {
    it("should render add button", () => {
      render(<WebhooksHeader />);

      expect(screen.getByText("Adicionar")).toBeInTheDocument();
    });

    it("should call openForm when clicked", () => {
      const openForm = vi.fn();
      
      vi.mocked(WebhooksContext.useWebhooks).mockReturnValue(
        createMockWebhooksHeaderContext({ openForm }) as unknown as MockReturn
      );

      render(<WebhooksHeader />);

      fireEvent.click(screen.getByText("Adicionar"));

      expect(openForm).toHaveBeenCalledTimes(1);
    });
  });
});
