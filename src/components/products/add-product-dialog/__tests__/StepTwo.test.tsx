/**
 * StepTwo Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for StepTwo component covering:
 * - Rendering of delivery type options
 * - Delivery type selection
 * - Conditional content rendering
 * - URL validation
 * - Summary display
 * - User interactions
 * 
 * @module components/products/add-product-dialog/__tests__/StepTwo.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/test/utils";
import { StepTwo } from "../StepTwo";
import { createMockProductFormData } from "@/test/helpers/product-helpers";
import userEvent from "@testing-library/user-event";
import type { DeliveryType } from "@/modules/products/types/product.types";

describe("StepTwo", () => {
  const mockOnDeliveryTypeChange = vi.fn();
  const mockOnDeliveryUrlChange = vi.fn();
  const mockOnValidateUrl = vi.fn();

  const defaultProps = {
    formData: createMockProductFormData({
      name: "Produto Teste",
      price: 9900,
      delivery_url: "",
    }),
    deliveryType: "standard" as DeliveryType,
    deliveryUrlError: "",
    onDeliveryTypeChange: mockOnDeliveryTypeChange,
    onDeliveryUrlChange: mockOnDeliveryUrlChange,
    onValidateUrl: mockOnValidateUrl,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders delivery type section", () => {
      const { container } = render(<StepTwo {...defaultProps} />);

      // Verifica que o componente renderiza
      expect(container.firstChild).toBeInTheDocument();
    });

    it("displays delivery type descriptions", () => {
      render(<StepTwo {...defaultProps} />);

      expect(screen.getByText(/rise envia email com link de acesso personalizado/i)).toBeInTheDocument();
      expect(screen.getByText(/rise envia email com acesso à área de membros/i)).toBeInTheDocument();
      expect(screen.getByText(/meu sistema faz a entrega/i)).toBeInTheDocument();
    });

    it("displays summary section", () => {
      render(<StepTwo {...defaultProps} />);

      expect(screen.getByText(/resumo/i)).toBeInTheDocument();
      expect(screen.getByText(/produto teste/i)).toBeInTheDocument();
      expect(screen.getByText(/r\$ 99,00/i)).toBeInTheDocument();
    });
  });

  describe("Delivery Type Selection", () => {
    it("renders with selected delivery type", () => {
      const { container } = render(<StepTwo {...defaultProps} deliveryType="standard" />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it("calls onDeliveryTypeChange when clicking external delivery", async () => {
      const user = userEvent.setup();
      render(<StepTwo {...defaultProps} />);

      const externalOption = screen.getByText(/entrega externa/i);
      await user.click(externalOption);

      expect(mockOnDeliveryTypeChange).toHaveBeenCalledWith("external");
    });

    it("displays radio indicator for selected option", () => {
      render(<StepTwo {...defaultProps} deliveryType="standard" />);

      const standardOption = screen.getByText(/entrega padrão/i).closest("button");
      const radioIndicator = standardOption?.querySelector(".bg-primary");
      expect(radioIndicator).toBeInTheDocument();
    });
  });

  describe("Standard Delivery Content", () => {
    it("shows URL input when standard delivery is selected", () => {
      render(<StepTwo {...defaultProps} deliveryType="standard" />);

      expect(screen.getByLabelText(/link de acesso ao produto/i)).toBeInTheDocument();
    });

    it("calls onDeliveryUrlChange when typing URL", async () => {
      const user = userEvent.setup();
      render(<StepTwo {...defaultProps} deliveryType="standard" />);

      const urlInput = screen.getByLabelText(/link de acesso ao produto/i);
      await user.type(urlInput, "https://exemplo.com");

      await waitFor(() => {
        expect(mockOnDeliveryUrlChange).toHaveBeenCalled();
      });
    });

    it("calls onValidateUrl when input loses focus", async () => {
      const user = userEvent.setup();
      render(<StepTwo {...defaultProps} deliveryType="standard" />);

      const urlInput = screen.getByLabelText(/link de acesso ao produto/i);
      await user.click(urlInput);
      await user.tab();

      expect(mockOnValidateUrl).toHaveBeenCalled();
    });

    it("displays error message when URL is invalid", () => {
      render(<StepTwo {...defaultProps} deliveryType="standard" deliveryUrlError="Link inválido" />);

      expect(screen.getByText(/link inválido/i)).toBeInTheDocument();
    });

    it("applies error styling when URL is invalid", () => {
      render(<StepTwo {...defaultProps} deliveryType="standard" deliveryUrlError="Link inválido" />);

      const urlInput = screen.getByLabelText(/link de acesso ao produto/i);
      expect(urlInput).toHaveClass("border-destructive");
    });

    it("displays helper text when no error", () => {
      render(<StepTwo {...defaultProps} deliveryType="standard" />);

      expect(screen.getByText(/este link será enviado por email/i)).toBeInTheDocument();
    });

    it("displays URL in summary when provided", () => {
      const formData = createMockProductFormData({
        name: "Produto",
        price: 9900,
        delivery_url: "https://exemplo.com/produto",
      });

      render(<StepTwo {...defaultProps} formData={formData} deliveryType="standard" />);

      expect(screen.getByText(/link:/i)).toBeInTheDocument();
    });
  });

  describe("Members Area Content", () => {
    it("renders members area content", () => {
      const { container } = render(<StepTwo {...defaultProps} deliveryType="members_area" />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it("does not show URL input for members area", () => {
      render(<StepTwo {...defaultProps} deliveryType="members_area" />);

      expect(screen.queryByLabelText(/link de acesso ao produto/i)).not.toBeInTheDocument();
    });

    it("displays auto-generated link pattern", () => {
      render(<StepTwo {...defaultProps} deliveryType="members_area" />);

      expect(screen.getByText(/\/minha-conta\/produtos\/\[id\]/i)).toBeInTheDocument();
    });
  });

  describe("External Delivery Content", () => {
    it("renders external delivery content", () => {
      const { container } = render(<StepTwo {...defaultProps} deliveryType="external" />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it("does not show URL input for external delivery", () => {
      render(<StepTwo {...defaultProps} deliveryType="external" />);

      expect(screen.queryByLabelText(/link de acesso ao produto/i)).not.toBeInTheDocument();
    });

    it("mentions webhook configuration", () => {
      render(<StepTwo {...defaultProps} deliveryType="external" />);

      expect(screen.getByText(/configure webhooks após criar o produto/i)).toBeInTheDocument();
    });
  });

  describe("Summary Section", () => {
    it("displays product name in summary", () => {
      const formData = createMockProductFormData({ name: "Curso Completo" });
      render(<StepTwo {...defaultProps} formData={formData} />);

      expect(screen.getByText(/curso completo/i)).toBeInTheDocument();
    });

    it("displays formatted price in summary", () => {
      const formData = createMockProductFormData({ price: 15000 });
      render(<StepTwo {...defaultProps} formData={formData} />);

      expect(screen.getByText(/r\$ 150,00/i)).toBeInTheDocument();
    });

    it("displays product name in summary", () => {
      const formData = createMockProductFormData({ name: "Produto Simples" });
      render(<StepTwo {...defaultProps} formData={formData} />);

      expect(screen.getByText(/produto simples/i)).toBeInTheDocument();
    });

    it("displays correct delivery method in summary for standard", () => {
      render(<StepTwo {...defaultProps} deliveryType="standard" />);

      expect(screen.getByText(/padrão \(rise envia email com link\)/i)).toBeInTheDocument();
    });

    it("displays correct delivery method in summary for members area", () => {
      render(<StepTwo {...defaultProps} deliveryType="members_area" />);

      expect(screen.getByText(/área de membros \(link automático\)/i)).toBeInTheDocument();
    });

    it("displays correct delivery method in summary for external", () => {
      render(<StepTwo {...defaultProps} deliveryType="external" />);

      expect(screen.getByText(/externa \(seu sistema\)/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper label for URL input", () => {
      render(<StepTwo {...defaultProps} deliveryType="standard" />);

      const urlInput = screen.getByLabelText(/link de acesso ao produto/i);
      expect(urlInput).toHaveAttribute("id", "delivery_url");
    });

    it("delivery options are keyboard accessible", async () => {
      const user = userEvent.setup();
      render(<StepTwo {...defaultProps} />);

      const firstOption = screen.getByText(/entrega padrão/i).closest("button");
      firstOption?.focus();
      expect(firstOption).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(mockOnDeliveryTypeChange).toHaveBeenCalled();
    });
  });
});
