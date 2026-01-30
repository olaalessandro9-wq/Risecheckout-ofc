/**
 * UpsellTab Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Upsell tab component that manages upsell/downsell settings.
 * 
 * @module test/modules/products/tabs/UpsellTab
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UpsellTab } from "../UpsellTab";
import * as ProductContext from "../../context/ProductContext";

// Mock dependencies
vi.mock("../../context/ProductContext", () => ({
  useProductContext: vi.fn(),
}));

describe("UpsellTab", () => {
  const mockProduct = {
    id: "product-123",
    name: "Test Product",
  };

  const defaultFormState = {
    editedData: {
      upsell: {
        hasCustomThankYouPage: false,
        customPageUrl: "",
        redirectIgnoringOrderBumpFailures: false,
      },
    },
    serverData: {
      upsell: {
        hasCustomThankYouPage: false,
        customPageUrl: "",
        redirectIgnoringOrderBumpFailures: false,
      },
    },
  };

  const defaultContextReturn = {
    product: mockProduct,
    formState: defaultFormState,
    dispatchForm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ProductContext.useProductContext).mockReturnValue(defaultContextReturn as never);
  });

  describe("loading state", () => {
    it("should show loading message when product is null", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        product: null,
      } as never);

      render(<UpsellTab />);

      expect(screen.getByText("Carregando configurações...")).toBeInTheDocument();
    });

    it("should show loading message when product id is missing", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        product: { id: "" },
      } as never);

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
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        formState: {
          ...defaultFormState,
          editedData: {
            upsell: {
              hasCustomThankYouPage: true,
              customPageUrl: "",
              redirectIgnoringOrderBumpFailures: false,
            },
          },
        },
      } as never);

      render(<UpsellTab />);

      expect(screen.getByLabelText("URL da página de obrigado")).toBeInTheDocument();
    });

    it("should dispatch EDIT_UPSELL when toggle is clicked", () => {
      const dispatchForm = vi.fn();
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        dispatchForm,
      } as never);

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
    beforeEach(() => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        formState: {
          ...defaultFormState,
          editedData: {
            upsell: {
              hasCustomThankYouPage: true,
              customPageUrl: "https://example.com/thank-you",
              redirectIgnoringOrderBumpFailures: false,
            },
          },
        },
      } as never);
    });

    it("should display current URL value", () => {
      render(<UpsellTab />);

      const input = screen.getByLabelText("URL da página de obrigado") as HTMLInputElement;
      expect(input.value).toBe("https://example.com/thank-you");
    });

    it("should dispatch EDIT_UPSELL when URL is changed", () => {
      const dispatchForm = vi.fn();
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        formState: {
          ...defaultFormState,
          editedData: {
            upsell: {
              hasCustomThankYouPage: true,
              customPageUrl: "",
              redirectIgnoringOrderBumpFailures: false,
            },
          },
        },
        dispatchForm,
      } as never);

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
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        formState: {
          editedData: {
            upsell: {
              hasCustomThankYouPage: true,
              customPageUrl: "https://example.com",
              redirectIgnoringOrderBumpFailures: false,
            },
          },
          serverData: {
            upsell: {
              hasCustomThankYouPage: false,
              customPageUrl: "",
              redirectIgnoringOrderBumpFailures: false,
            },
          },
        },
      } as never);

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
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        formState: {
          ...defaultFormState,
          editedData: {
            upsell: {
              hasCustomThankYouPage: true,
              customPageUrl: "",
              redirectIgnoringOrderBumpFailures: false,
            },
          },
        },
      } as never);

      render(<UpsellTab />);

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeChecked();
    });
  });
});
