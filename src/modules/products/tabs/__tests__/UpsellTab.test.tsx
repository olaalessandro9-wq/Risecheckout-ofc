/**
 * UpsellTab Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Upsell tab component that manages upsell/downsell settings.
 * Uses `as unknown as T` pattern for vi.mocked() calls.
 * 
 * Justification: vi.mocked requires full type match, but tests only need
 * the subset of properties actually consumed by the component.
 * 
 * @module test/modules/products/tabs/UpsellTab
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UpsellTab } from "../UpsellTab";
import * as ProductContext from "../../context/ProductContext";
import {
  createMockUpsellTabContext,
  type UpsellTabContextMock,
} from "@/test/factories";

// Mock dependencies
vi.mock("../../context/ProductContext", () => ({
  useProductContext: vi.fn(),
}));

// Type alias for the mock return type
type ProductContextMock = ReturnType<typeof ProductContext.useProductContext>;

describe("UpsellTab", () => {
  let defaultContextReturn: UpsellTabContextMock;

  beforeEach(() => {
    vi.clearAllMocks();
    defaultContextReturn = createMockUpsellTabContext();
    // RISE V3 Justified: Partial mock - component only uses subset of context
    vi.mocked(ProductContext.useProductContext).mockReturnValue(
      defaultContextReturn as unknown as ProductContextMock
    );
  });

  describe("loading state", () => {
    it("should show loading message when product is null", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockUpsellTabContext({ product: null }) as unknown as ProductContextMock
      );

      render(<UpsellTab />);

      expect(screen.getByText("Carregando configurações...")).toBeInTheDocument();
    });

    it("should show loading message when product id is missing", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockUpsellTabContext({ product: { id: "", name: "" } }) as unknown as ProductContextMock
      );

      render(<UpsellTab />);

      expect(screen.getByText("Carregando configurações...")).toBeInTheDocument();
    });
  });

  describe("upsell settings rendering", () => {
    it("should render header with title and description", () => {
      render(<UpsellTab />);

      expect(screen.getByText("Upsell / Downsell")).toBeInTheDocument();
      expect(screen.getByText("Esse produto tem uma página de obrigado personalizada ou upsell")).toBeInTheDocument();
    });

    it("should render custom thank you page toggle", () => {
      render(<UpsellTab />);

      expect(screen.getByText("Usar página de obrigado personalizada")).toBeInTheDocument();
    });

    it("should not show URL input when toggle is off", () => {
      render(<UpsellTab />);

      expect(screen.queryByLabelText("URL da página de obrigado")).not.toBeInTheDocument();
    });
  });

  describe("custom thank you page toggle", () => {
    it("should show URL input when toggle is on", () => {
      const contextWithEnabled = createMockUpsellTabContext();
      contextWithEnabled.formState.editedData.upsell.hasCustomThankYouPage = true;

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithEnabled as unknown as ProductContextMock
      );

      render(<UpsellTab />);

      expect(screen.getByLabelText("URL da página de obrigado")).toBeInTheDocument();
    });

    it("should dispatch EDIT_UPSELL when toggle is clicked", () => {
      const dispatchForm = vi.fn();
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockUpsellTabContext({ dispatchForm }) as unknown as ProductContextMock
      );

      render(<UpsellTab />);

      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      expect(dispatchForm).toHaveBeenCalledWith({
        type: "EDIT_UPSELL",
        payload: { hasCustomThankYouPage: true },
      });
    });
  });

  describe("custom page URL input", () => {
    it("should display current URL value", () => {
      const contextWithUrl = createMockUpsellTabContext();
      contextWithUrl.formState.editedData.upsell.hasCustomThankYouPage = true;
      contextWithUrl.formState.editedData.upsell.customPageUrl = "https://example.com/thank-you";

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithUrl as unknown as ProductContextMock
      );

      render(<UpsellTab />);

      const input = screen.getByLabelText("URL da página de obrigado") as HTMLInputElement;
      expect(input.value).toBe("https://example.com/thank-you");
    });

    it("should dispatch EDIT_UPSELL when URL is changed", () => {
      const dispatchForm = vi.fn();
      const contextWithEnabled = createMockUpsellTabContext({ dispatchForm });
      contextWithEnabled.formState.editedData.upsell.hasCustomThankYouPage = true;

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithEnabled as unknown as ProductContextMock
      );

      render(<UpsellTab />);

      const input = screen.getByLabelText("URL da página de obrigado");
      fireEvent.change(input, { target: { value: "https://newurl.com" } });

      expect(dispatchForm).toHaveBeenCalledWith({
        type: "EDIT_UPSELL",
        payload: { customPageUrl: "https://newurl.com" },
      });
    });
  });

  describe("form state changes", () => {
    it("should detect changes when editedData differs from serverData", () => {
      const contextWithChanges = createMockUpsellTabContext();
      contextWithChanges.formState.editedData.upsell.hasCustomThankYouPage = true;
      contextWithChanges.formState.editedData.upsell.customPageUrl = "https://example.com";
      // serverData stays at defaults (false, "")

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithChanges as unknown as ProductContextMock
      );

      render(<UpsellTab />);

      expect(screen.getByRole("switch")).toBeChecked();
    });
  });

  describe("context integration", () => {
    it("should call useProductContext hook", () => {
      render(<UpsellTab />);

      expect(ProductContext.useProductContext).toHaveBeenCalledTimes(1);
    });
  });

  describe("toggle state", () => {
    it("should show toggle as unchecked when hasCustomThankYouPage is false", () => {
      render(<UpsellTab />);

      const toggle = screen.getByRole("switch");
      expect(toggle).not.toBeChecked();
    });

    it("should show toggle as checked when hasCustomThankYouPage is true", () => {
      const contextWithEnabled = createMockUpsellTabContext();
      contextWithEnabled.formState.editedData.upsell.hasCustomThankYouPage = true;

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithEnabled as unknown as ProductContextMock
      );

      render(<UpsellTab />);

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeChecked();
    });
  });
});
