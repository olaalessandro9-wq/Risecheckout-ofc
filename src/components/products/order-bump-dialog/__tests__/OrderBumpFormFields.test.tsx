/**
 * OrderBumpFormFields Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for OrderBumpFormFields component covering:
 * - Rendering of form structure
 * - Loading states
 * - Input interactions
 * - Discount functionality
 * - Integration with UI components
 * 
 * @module components/products/order-bump-dialog/__tests__/OrderBumpFormFields.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils";
import { OrderBumpFormFields } from "../OrderBumpFormFields";
import { DEFAULT_FORM_VALUES } from "../types";
import type { OrderBumpProduct, OrderBumpFormData } from "../types";
import type { NormalizedOffer } from "@/services/offers";

// Mock lucide-react icons
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    Loader2: () => <div data-testid="loader">Loading...</div>,
  };
});

describe("OrderBumpFormFields", () => {
  const mockOnFieldChange = vi.fn();

  const mockProducts: OrderBumpProduct[] = [
    {
      id: "product-1",
      name: "Produto 1",
      price: 9900,
      description: "Descrição 1",
    },
    {
      id: "product-2",
      name: "Produto 2",
      price: 14900,
      description: "Descrição 2",
    },
  ];

  const mockOffers: NormalizedOffer[] = [
    {
      id: "offer-1",
      product_id: "product-1",
      product_name: "Produto 1",
      price: 9900,
    },
  ];

  const mockOnClearFieldError = vi.fn();

  const defaultProps = {
    formData: { ...DEFAULT_FORM_VALUES },
    products: mockProducts,
    offers: mockOffers,
    loadingProducts: false,
    selectedProduct: undefined,
    selectedOffer: undefined,
    discountPercentage: 0,
    validationErrors: {},
    onFieldChange: mockOnFieldChange,
    onClearFieldError: mockOnClearFieldError,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders form container", () => {
      const { container } = render(<OrderBumpFormFields {...defaultProps} />);
      
      const formContainer = container.querySelector(".space-y-3");
      expect(formContainer).toBeInTheDocument();
    });

    it("displays loading state when products are loading", () => {
      render(<OrderBumpFormFields {...defaultProps} loadingProducts={true} />);

      expect(screen.getByTestId("loader")).toBeInTheDocument();
    });

    it("renders product label", () => {
      render(<OrderBumpFormFields {...defaultProps} />);

      expect(screen.getByText(/produto \*/i)).toBeInTheDocument();
    });

    it("renders offer label", () => {
      render(<OrderBumpFormFields {...defaultProps} />);

      expect(screen.getByText(/oferta \*/i)).toBeInTheDocument();
    });

    it("renders discount checkbox label", () => {
      render(<OrderBumpFormFields {...defaultProps} />);

      expect(screen.getByText(/aplicar desconto/i)).toBeInTheDocument();
    });

    it("renders call to action label", () => {
      render(<OrderBumpFormFields {...defaultProps} />);

      expect(screen.getByText(/call to action/i)).toBeInTheDocument();
    });

    it("renders title label", () => {
      render(<OrderBumpFormFields {...defaultProps} />);

      expect(screen.getByText(/título/i)).toBeInTheDocument();
    });
  });

  describe("Helper Text", () => {
    it("displays helper text for product selection", () => {
      render(<OrderBumpFormFields {...defaultProps} />);

      expect(screen.getByText(/selecione o produto que será oferecido/i)).toBeInTheDocument();
    });

    it("displays helper text for offer selection", () => {
      render(<OrderBumpFormFields {...defaultProps} />);

      expect(screen.getByText(/a primeira oferta do produto é selecionada/i)).toBeInTheDocument();
    });

    it("displays helper text for call to action", () => {
      render(<OrderBumpFormFields {...defaultProps} />);

      expect(screen.getByText(/texto que aparece no topo do order bump/i)).toBeInTheDocument();
    });
  });

  describe("Discount Functionality", () => {
    it("shows discount price field when discount is enabled", () => {
      const formData: OrderBumpFormData = {
        ...DEFAULT_FORM_VALUES,
        discountEnabled: true,
      };

      render(<OrderBumpFormFields {...defaultProps} formData={formData} />);

      expect(screen.getByText(/preço de origem/i)).toBeInTheDocument();
    });

    it("hides discount price field when discount is disabled", () => {
      render(<OrderBumpFormFields {...defaultProps} />);

      expect(screen.queryByText(/preço de origem/i)).not.toBeInTheDocument();
    });

    it("displays error when discount price is invalid", () => {
      const formData: OrderBumpFormData = {
        ...DEFAULT_FORM_VALUES,
        selectedProductId: "product-1",
        discountEnabled: true,
        discountPrice: "50,00",
      };

      const selectedProduct = mockProducts[0];

      render(
        <OrderBumpFormFields
          {...defaultProps}
          formData={formData}
          selectedProduct={selectedProduct}
        />
      );

      expect(screen.getByText(/valor deve ser maior que a oferta/i)).toBeInTheDocument();
    });

    it("displays discount percentage when valid", () => {
      const formData: OrderBumpFormData = {
        ...DEFAULT_FORM_VALUES,
        discountEnabled: true,
        discountPrice: "150,00",
      };

      render(<OrderBumpFormFields {...defaultProps} formData={formData} discountPercentage={30} />);

      expect(screen.getByText(/desconto de aproximadamente 30%/i)).toBeInTheDocument();
    });
  });

  describe("Form Inputs", () => {
    it("renders call to action input with default value", () => {
      const { container } = render(<OrderBumpFormFields {...defaultProps} />);

      const ctaInput = container.querySelector("#callToAction") as HTMLInputElement;
      expect(ctaInput).toBeInTheDocument();
      expect(ctaInput?.value).toBe("SIM, EU ACEITO ESSA OFERTA ESPECIAL!");
    });

    it("renders title input with placeholder", () => {
      const { container } = render(<OrderBumpFormFields {...defaultProps} />);

      const titleInput = container.querySelector("#customTitle") as HTMLInputElement;
      expect(titleInput).toBeInTheDocument();
      expect(titleInput?.placeholder).toBe("Nome do seu produto");
    });
  });

  describe("Empty States", () => {
    it("handles empty products array", () => {
      render(<OrderBumpFormFields {...defaultProps} products={[]} />);

      // Should still render the form structure
      expect(screen.getByText(/produto \*/i)).toBeInTheDocument();
    });

    it("handles empty offers array", () => {
      render(<OrderBumpFormFields {...defaultProps} offers={[]} />);

      // Should still render the form structure
      expect(screen.getByText(/oferta \*/i)).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("renders with all required props", () => {
      const { container } = render(<OrderBumpFormFields {...defaultProps} />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it("handles undefined selectedProduct gracefully", () => {
      render(<OrderBumpFormFields {...defaultProps} selectedProduct={undefined} />);

      expect(screen.getByText(/produto \*/i)).toBeInTheDocument();
    });

    it("handles undefined selectedOffer gracefully", () => {
      render(<OrderBumpFormFields {...defaultProps} selectedOffer={undefined} />);

      expect(screen.getByText(/oferta \*/i)).toBeInTheDocument();
    });
  });
});
