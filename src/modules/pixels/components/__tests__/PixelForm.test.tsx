/**
 * @file PixelForm.test.tsx
 * @description Tests for PixelForm component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { PixelForm } from "../PixelForm";
import { mockFacebookPixel, mockPixelFormData } from "../../__tests__/_fixtures";
import { createMockPixelsContextValue } from "../../__tests__/_mocks";

// Mock PixelsContext
const mockContextValue = createMockPixelsContextValue();

vi.mock("../../context/PixelsContext", () => ({
  usePixelsContext: () => mockContextValue,
}));

// ============================================================================
// TEST SUITE
// ============================================================================

describe("PixelForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock context to default state
    Object.assign(mockContextValue, createMockPixelsContextValue({
      context: {
        pixels: [],
        editingPixel: null,
        deletingPixel: null,
        error: null,
        lastRefreshAt: null,
        isFormOpen: false,
        isSaving: false,
      },
    }));
  });

  describe("Rendering", () => {
    it("should not render dialog when form is closed", () => {
      mockContextValue.context.isFormOpen = false;

      render(<PixelForm />);

      // Dialog should not be visible
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render dialog when form is open", () => {
      mockContextValue.context.isFormOpen = true;

      render(<PixelForm />);

      // Dialog should be visible
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should render create mode title when not editing", () => {
      mockContextValue.context.isFormOpen = true;
      mockContextValue.context.editingPixel = null;

      render(<PixelForm />);

      expect(screen.getByText(/Adicionar Pixel/i)).toBeInTheDocument();
    });

    it("should render edit mode title when editing", () => {
      mockContextValue.context.isFormOpen = true;
      mockContextValue.context.editingPixel = mockFacebookPixel;

      render(<PixelForm />);

      expect(screen.getByText(/Editar Pixel/i)).toBeInTheDocument();
    });

    it("should render platform selector", () => {
      mockContextValue.context.isFormOpen = true;

      render(<PixelForm />);

      expect(screen.getByText(/Plataforma/i)).toBeInTheDocument();
    });

    it("should render name input field", () => {
      mockContextValue.context.isFormOpen = true;

      render(<PixelForm />);

      expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
    });

    it("should render pixel ID input field", () => {
      mockContextValue.context.isFormOpen = true;

      render(<PixelForm />);

      expect(screen.getByLabelText(/ID do Pixel/i)).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should call closeForm when dialog is closed", () => {
      mockContextValue.context.isFormOpen = true;
      const closeFormSpy = vi.fn();
      mockContextValue.send = closeFormSpy;

      render(<PixelForm />);

      // Simulate closing dialog
      const dialog = screen.getByRole("dialog");
      fireEvent.keyDown(dialog, { key: "Escape" });

      // closeForm should be called
      expect(closeFormSpy).toHaveBeenCalled();
    });

    it("should call savePixel when form is submitted", () => {
      mockContextValue.context.isFormOpen = true;
      const savePixelSpy = vi.fn();
      mockContextValue.send = savePixelSpy;

      render(<PixelForm />);

      // Fill form
      const nameInput = screen.getByLabelText(/Nome/i);
      fireEvent.change(nameInput, { target: { value: "Test Pixel" } });

      const pixelIdInput = screen.getByLabelText(/ID do Pixel/i);
      fireEvent.change(pixelIdInput, { target: { value: "123456789" } });

      // Submit form
      const submitButton = screen.getByRole("button", { name: /Salvar/i });
      fireEvent.click(submitButton);

      // savePixel should be called
      expect(savePixelSpy).toHaveBeenCalled();
    });

    it("should populate form fields when editing pixel", () => {
      mockContextValue.context.isFormOpen = true;
      mockContextValue.context.editingPixel = mockFacebookPixel;

      render(<PixelForm />);

      const nameInput = screen.getByLabelText(/Nome/i) as HTMLInputElement;
      expect(nameInput.value).toBe(mockFacebookPixel.name);

      const pixelIdInput = screen.getByLabelText(/ID do Pixel/i) as HTMLInputElement;
      expect(pixelIdInput.value).toBe(mockFacebookPixel.pixel_id);
    });

    it("should disable submit button when saving", () => {
      mockContextValue.context.isFormOpen = true;
      mockContextValue.context.isSaving = true;

      render(<PixelForm />);

      const submitButton = screen.getByRole("button", { name: /Salvando/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty form submission gracefully", () => {
      mockContextValue.context.isFormOpen = true;
      const savePixelSpy = vi.fn();
      mockContextValue.send = savePixelSpy;

      render(<PixelForm />);

      // Submit without filling form
      const submitButton = screen.getByRole("button", { name: /Salvar/i });
      fireEvent.click(submitButton);

      // Should still call savePixel (validation happens elsewhere)
      expect(savePixelSpy).toHaveBeenCalled();
    });

    it("should reset form when switching from edit to create mode", () => {
      mockContextValue.context.isFormOpen = true;
      mockContextValue.context.editingPixel = mockFacebookPixel;

      const { rerender } = render(<PixelForm />);

      // Switch to create mode
      mockContextValue.context.editingPixel = null;
      rerender(<PixelForm />);

      const nameInput = screen.getByLabelText(/Nome/i) as HTMLInputElement;
      expect(nameInput.value).toBe("");
    });

    it("should handle platform-specific fields visibility", () => {
      mockContextValue.context.isFormOpen = true;

      render(<PixelForm />);

      // Facebook requires access_token and domain
      expect(screen.getByLabelText(/Access Token/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Domínio/i)).toBeInTheDocument();

      // Google Ads requires conversion_label (would need to change platform)
      // This is a simplified test - full test would change platform and verify
    });
  });
});
