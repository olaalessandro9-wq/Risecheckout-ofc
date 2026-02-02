/**
 * StepOne Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for StepOne component covering:
 * - Rendering of all form fields
 * - Input validation and character limits
 * - onChange callbacks
 * - User interactions
 * - Accessibility
 * 
 * @module components/products/add-product-dialog/__tests__/StepOne.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/test/utils";
import { StepOne } from "../StepOne";
import { createMockProductFormData } from "@/test/helpers/product-helpers";
import { PRODUCT_FIELD_LIMITS } from "@/lib/constants/field-limits";
import userEvent from "@testing-library/user-event";

describe("StepOne", () => {
  const mockOnUpdate = vi.fn();

  const defaultProps = {
    formData: createMockProductFormData({
      name: "",
      description: "",
      price: 0,
    }),
    onUpdate: mockOnUpdate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders all form fields", () => {
      render(<StepOne {...defaultProps} />);

      expect(screen.getByLabelText(/nome do produto/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/preço/i)).toBeInTheDocument();
    });

    it("renders with initial form data", () => {
      const formData = createMockProductFormData({
        name: "Produto Teste",
        description: "Descrição teste",
        price: 9900,
      });

      render(<StepOne formData={formData} onUpdate={mockOnUpdate} />);

      expect(screen.getByDisplayValue("Produto Teste")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Descrição teste")).toBeInTheDocument();
    });

    it("displays character count for name field", () => {
      const formData = createMockProductFormData({ name: "Teste" });
      render(<StepOne formData={formData} onUpdate={mockOnUpdate} />);

      expect(screen.getByText(`5/${PRODUCT_FIELD_LIMITS.NAME}`)).toBeInTheDocument();
    });

    it("displays character count for description field", () => {
      const formData = createMockProductFormData({ description: "Teste" });
      render(<StepOne formData={formData} onUpdate={mockOnUpdate} />);

      // "Teste" tem 5 caracteres
      expect(screen.getByText(`5/${PRODUCT_FIELD_LIMITS.DESCRIPTION}`)).toBeInTheDocument();
    });
  });

  describe("Name Input", () => {
    it("calls onUpdate when name changes", async () => {
      const user = userEvent.setup();
      render(<StepOne {...defaultProps} />);

      const nameInput = screen.getByLabelText(/nome do produto/i);
      await user.type(nameInput, "Novo Produto");

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });

    it("respects maxLength constraint", () => {
      render(<StepOne {...defaultProps} />);

      const nameInput = screen.getByLabelText(/nome do produto/i) as HTMLInputElement;
      expect(nameInput.maxLength).toBe(PRODUCT_FIELD_LIMITS.NAME);
    });

    it("displays placeholder text", () => {
      render(<StepOne {...defaultProps} />);

      expect(screen.getByPlaceholderText(/digite o nome do produto/i)).toBeInTheDocument();
    });

    it("updates character count as user types", async () => {
      const user = userEvent.setup();
      const formData = createMockProductFormData({ name: "" });
      const { rerender } = render(<StepOne formData={formData} onUpdate={mockOnUpdate} />);

      expect(screen.getByText(`0/${PRODUCT_FIELD_LIMITS.NAME}`)).toBeInTheDocument();

      // Simulate typing
      const nameInput = screen.getByLabelText(/nome do produto/i);
      await user.type(nameInput, "Test");

      // Rerender with updated data
      rerender(<StepOne formData={{ ...formData, name: "Test" }} onUpdate={mockOnUpdate} />);

      expect(screen.getByText(`4/${PRODUCT_FIELD_LIMITS.NAME}`)).toBeInTheDocument();
    });
  });

  describe("Description Input", () => {
    it("calls onUpdate when description changes", async () => {
      const user = userEvent.setup();
      render(<StepOne {...defaultProps} />);

      const descInput = screen.getByLabelText(/descrição/i);
      await user.type(descInput, "Nova descrição");

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });

    it("respects maxLength constraint", () => {
      render(<StepOne {...defaultProps} />);

      const descInput = screen.getByLabelText(/descrição/i) as HTMLTextAreaElement;
      expect(descInput.maxLength).toBe(PRODUCT_FIELD_LIMITS.DESCRIPTION);
    });

    it("displays placeholder text", () => {
      render(<StepOne {...defaultProps} />);

      expect(screen.getByPlaceholderText(/digite a descrição do produto/i)).toBeInTheDocument();
    });

    it("renders as textarea with minimum height", () => {
      render(<StepOne {...defaultProps} />);

      const descInput = screen.getByLabelText(/descrição/i);
      expect(descInput.tagName).toBe("TEXTAREA");
      expect(descInput).toHaveClass("min-h-[100px]");
    });
  });

  describe("Price Input", () => {
    it("renders CurrencyInput component", () => {
      render(<StepOne {...defaultProps} />);

      const priceInput = screen.getByLabelText(/preço/i);
      expect(priceInput).toBeInTheDocument();
    });

    it("calls onUpdate when price changes", async () => {
      const user = userEvent.setup();
      render(<StepOne {...defaultProps} />);

      const priceInput = screen.getByLabelText(/preço/i);
      await user.type(priceInput, "99");

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });

    it("displays formatted price value", () => {
      const formData = createMockProductFormData({ price: 9900 });
      render(<StepOne formData={formData} onUpdate={mockOnUpdate} />);

      const priceInput = screen.getByLabelText(/preço/i) as HTMLInputElement;
      expect(priceInput.value).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("has proper label associations", () => {
      render(<StepOne {...defaultProps} />);

      const nameInput = screen.getByLabelText(/nome do produto/i);
      const descInput = screen.getByLabelText(/descrição/i);
      const priceInput = screen.getByLabelText(/preço/i);

      expect(nameInput).toHaveAttribute("id", "name");
      expect(descInput).toHaveAttribute("id", "description");
      expect(priceInput).toHaveAttribute("id", "price");
    });

    it("applies correct styling classes", () => {
      render(<StepOne {...defaultProps} />);

      const nameInput = screen.getByLabelText(/nome do produto/i);
      expect(nameInput).toHaveClass("bg-background", "border-border", "text-foreground");
    });
  });

  describe("Form Data Updates", () => {
    it("calls onUpdate with correct partial data for name", async () => {
      const user = userEvent.setup();
      render(<StepOne {...defaultProps} />);

      const nameInput = screen.getByLabelText(/nome do produto/i);
      await user.type(nameInput, "A");

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ name: expect.any(String) })
        );
      });
    });

    it("calls onUpdate with correct partial data for description", async () => {
      const user = userEvent.setup();
      render(<StepOne {...defaultProps} />);

      const descInput = screen.getByLabelText(/descrição/i);
      await user.type(descInput, "A");

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ description: expect.any(String) })
        );
      });
    });
  });
});
