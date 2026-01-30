/**
 * WebhooksHeader Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests search input, product filter, and add button functionality.
 * 
 * @module test/modules/webhooks/components/WebhooksHeader
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WebhooksHeader } from "../WebhooksHeader";
import * as WebhooksContext from "../../context/WebhooksContext";

// Mock the context
vi.mock("../../context/WebhooksContext", () => ({
  useWebhooks: vi.fn(),
}));

describe("WebhooksHeader", () => {
  const defaultContext = {
    products: [
      { id: "prod-1", name: "Product One" },
      { id: "prod-2", name: "Product Two" },
    ],
    searchTerm: "",
    selectedProductFilter: "all",
    setSearchTerm: vi.fn(),
    setProductFilter: vi.fn(),
    openForm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(WebhooksContext.useWebhooks).mockReturnValue(defaultContext as never);
  });

  describe("search input", () => {
    it("should render search input", () => {
      render(<WebhooksHeader />);

      expect(screen.getByPlaceholderText("Pesquisar")).toBeInTheDocument();
    });

    it("should show current search value", () => {
      vi.mocked(WebhooksContext.useWebhooks).mockReturnValue({
        ...defaultContext,
        searchTerm: "test search",
      } as never);

      render(<WebhooksHeader />);

      expect(screen.getByDisplayValue("test search")).toBeInTheDocument();
    });

    it("should call setSearchTerm on input change", () => {
      const setSearchTerm = vi.fn();
      
      vi.mocked(WebhooksContext.useWebhooks).mockReturnValue({
        ...defaultContext,
        setSearchTerm,
      } as never);

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
      
      vi.mocked(WebhooksContext.useWebhooks).mockReturnValue({
        ...defaultContext,
        openForm,
      } as never);

      render(<WebhooksHeader />);

      fireEvent.click(screen.getByText("Adicionar"));

      expect(openForm).toHaveBeenCalledTimes(1);
    });
  });
});
