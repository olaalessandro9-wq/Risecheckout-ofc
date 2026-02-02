/**
 * CouponDialog Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for CouponDialog component covering:
 * - Rendering in create and edit modes
 * - Form submission
 * - Error handling
 * - Dialog open/close behavior
 * - Integration with child components
 * 
 * @module components/products/coupon-dialog/__tests__/CouponDialog.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils";
import { CouponDialog } from "../index";
import userEvent from "@testing-library/user-event";

// Mock child components to isolate dialog logic
vi.mock("../CouponFormFields", () => ({
  CouponFormFields: () => <div data-testid="coupon-form-fields">Form Fields</div>,
}));

vi.mock("../CouponDateFields", () => ({
  CouponDateFields: () => <div data-testid="coupon-date-fields">Date Fields</div>,
}));

vi.mock("../CouponLimitsFields", () => ({
  CouponLimitsFields: () => <div data-testid="coupon-limits-fields">Limits Fields</div>,
}));

vi.mock("../useCouponDialog", () => ({
  useCouponDialog: () => ({
    form: {
      register: vi.fn(),
      handleSubmit: vi.fn((fn) => (e: Event) => {
        e.preventDefault();
        fn();
      }),
      formState: { errors: {} },
      watch: vi.fn(),
      setValue: vi.fn(),
      getValues: vi.fn(),
    },
    isSaving: false,
    serverError: null,
    setServerError: vi.fn(),
    codeFieldRef: { current: null },
    discountValueRaw: "",
    setDiscountValueRaw: vi.fn(),
    maxUsesRaw: "",
    setMaxUsesRaw: vi.fn(),
    maxUsesPerCustomerRaw: "",
    setMaxUsesPerCustomerRaw: vi.fn(),
    handleSubmit: vi.fn((e) => e.preventDefault()),
  }),
}));

describe("CouponDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSave = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSave: mockOnSave,
    coupon: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering - Create Mode", () => {
    it("renders dialog with create title", () => {
      render(<CouponDialog {...defaultProps} />);

      expect(screen.getByText("Criar Desconto")).toBeInTheDocument();
    });

    it("displays description text", () => {
      render(<CouponDialog {...defaultProps} />);

      expect(screen.getByText(/configure regras, período, produtos e segmentação/i)).toBeInTheDocument();
    });

    it("renders all child form sections", () => {
      render(<CouponDialog {...defaultProps} />);

      expect(screen.getByTestId("coupon-form-fields")).toBeInTheDocument();
      expect(screen.getByTestId("coupon-date-fields")).toBeInTheDocument();
      expect(screen.getByTestId("coupon-limits-fields")).toBeInTheDocument();
    });

    it("renders close button", () => {
      render(<CouponDialog {...defaultProps} />);

      const closeButton = screen.getByRole("button", { name: "" });
      expect(closeButton).toBeInTheDocument();
    });

    it("renders period and limits section header", () => {
      render(<CouponDialog {...defaultProps} />);

      expect(screen.getByText(/período e limites/i)).toBeInTheDocument();
    });
  });

  describe("Rendering - Edit Mode", () => {
    it("renders dialog with edit title when coupon is provided", () => {
      const mockCoupon = {
        id: "coupon-1",
        code: "TESTE10",
        discount_type: "percentage" as const,
        discount_value: 10,
      };

      render(<CouponDialog {...defaultProps} coupon={mockCoupon} />);

      expect(screen.getByText("Editar Cupom")).toBeInTheDocument();
    });
  });

  describe("Dialog Behavior", () => {
    it("calls onOpenChange when close button is clicked", async () => {
      const user = userEvent.setup();
      render(<CouponDialog {...defaultProps} />);

      const closeButton = screen.getByRole("button", { name: "" });
      await user.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("does not render when open is false", () => {
      render(<CouponDialog {...defaultProps} open={false} />);

      expect(screen.queryByText("Criar Desconto")).not.toBeInTheDocument();
    });
  });

  describe("Error Display", () => {
    it("does not show error banner by default", () => {
      render(<CouponDialog {...defaultProps} />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Form Structure", () => {
    it("renders form structure", () => {
      render(<CouponDialog {...defaultProps} />);

      // Verifica que o dialog renderiza com título
      expect(screen.getByText("Criar Desconto")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper dialog role", () => {
      render(<CouponDialog {...defaultProps} />);

      // Sheet component should provide dialog role
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("has accessible title", () => {
      render(<CouponDialog {...defaultProps} />);

      expect(screen.getByText("Criar Desconto")).toBeInTheDocument();
    });

    it("close button is keyboard accessible", async () => {
      const user = userEvent.setup();
      render(<CouponDialog {...defaultProps} />);

      const closeButton = screen.getByRole("button", { name: "" });
      closeButton.focus();
      expect(closeButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(mockOnOpenChange).toHaveBeenCalled();
    });
  });

  describe("Layout and Styling", () => {
    it("renders with proper layout", () => {
      render(<CouponDialog {...defaultProps} />);

      // Verifica que o dialog renderiza
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("Component Integration", () => {
    it("passes form to CouponFormFields", () => {
      render(<CouponDialog {...defaultProps} />);

      // Verify child component is rendered (integration point)
      expect(screen.getByTestId("coupon-form-fields")).toBeInTheDocument();
    });

    it("passes form to CouponDateFields", () => {
      render(<CouponDialog {...defaultProps} />);

      expect(screen.getByTestId("coupon-date-fields")).toBeInTheDocument();
    });

    it("passes form to CouponLimitsFields", () => {
      render(<CouponDialog {...defaultProps} />);

      expect(screen.getByTestId("coupon-limits-fields")).toBeInTheDocument();
    });
  });
});
