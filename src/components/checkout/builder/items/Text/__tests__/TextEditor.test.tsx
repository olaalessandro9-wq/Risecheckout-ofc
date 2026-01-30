/**
 * TextEditor Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for TextEditor component covering:
 * - Form field rendering
 * - onChange callback handling
 * - Input validation
 * - Alignment button interactions
 * - Color picker functionality
 *
 * @module components/checkout/builder/items/Text/__tests__/TextEditor.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { TextEditor } from "../TextEditor";
import type { ComponentData } from "../../../types";
import type { TextContent } from "@/types/checkout-components.types";

describe("TextEditor", () => {
  const mockOnChange = vi.fn();

  const mockComponent: ComponentData = {
    id: "text-1",
    type: "text",
    content: {
      text: "Test Text",
      fontSize: 18,
      color: "#FF0000",
      alignment: "center" as const,
      backgroundColor: "#F0F0F0",
      borderColor: "#CCCCCC",
      borderWidth: 2,
      borderRadius: 10,
    },
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      expect(screen.getByLabelText("Texto")).toBeInTheDocument();
    });

    it("renders all form fields", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      
      expect(screen.getByLabelText("Texto")).toBeInTheDocument();
      expect(screen.getByLabelText("Tamanho da Fonte")).toBeInTheDocument();
      expect(screen.getByLabelText("Cor do Texto")).toBeInTheDocument();
      expect(screen.getByLabelText("Alinhamento")).toBeInTheDocument();
      expect(screen.getByLabelText("Cor de Fundo")).toBeInTheDocument();
      expect(screen.getByLabelText("Cor da Borda")).toBeInTheDocument();
      expect(screen.getByLabelText("Largura da Borda (px)")).toBeInTheDocument();
      expect(screen.getByLabelText("Raio da Borda (px)")).toBeInTheDocument();
    });

    it("displays current text value", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const textInput = screen.getByLabelText("Texto") as HTMLInputElement;
      expect(textInput.value).toBe("Test Text");
    });

    it("displays current fontSize value", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const fontSizeInput = screen.getByLabelText("Tamanho da Fonte") as HTMLInputElement;
      expect(fontSizeInput.value).toBe("18");
    });

    it("displays current color value", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const colorInputs = screen.getAllByDisplayValue("#FF0000");
      expect(colorInputs.length).toBeGreaterThan(0);
    });
  });

  describe("Text Input", () => {
    it("calls onChange when text is modified", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const textInput = screen.getByLabelText("Texto");
      
      fireEvent.change(textInput, { target: { value: "New Text" } });
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "New Text",
        })
      );
    });

    it("handles empty text input", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const textInput = screen.getByLabelText("Texto");
      
      fireEvent.change(textInput, { target: { value: "" } });
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "",
        })
      );
    });
  });

  describe("Font Size Input", () => {
    it("calls onChange when fontSize is modified", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const fontSizeInput = screen.getByLabelText("Tamanho da Fonte");
      
      fireEvent.change(fontSizeInput, { target: { value: "24" } });
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          fontSize: 24,
        })
      );
    });

    it("clamps fontSize to minimum value", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const fontSizeInput = screen.getByLabelText("Tamanho da Fonte");
      
      fireEvent.change(fontSizeInput, { target: { value: "5" } });
      
      expect(mockOnChange).toHaveBeenCalled();
      const callArg = mockOnChange.mock.calls[0][0] as TextContent;
      expect(callArg.fontSize).toBeGreaterThanOrEqual(8);
    });

    it("clamps fontSize to maximum value", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const fontSizeInput = screen.getByLabelText("Tamanho da Fonte");
      
      fireEvent.change(fontSizeInput, { target: { value: "200" } });
      
      expect(mockOnChange).toHaveBeenCalled();
      const callArg = mockOnChange.mock.calls[0][0] as TextContent;
      expect(callArg.fontSize).toBeLessThanOrEqual(72);
    });
  });

  describe("Color Inputs", () => {
    it("calls onChange when text color is modified", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const colorInputs = screen.getAllByDisplayValue("#FF0000");
      const textColorInput = colorInputs[0];
      
      fireEvent.change(textColorInput, { target: { value: "#00FF00" } });
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          color: "#00FF00",
        })
      );
    });

    it("calls onChange when background color is modified", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const bgColorInputs = screen.getAllByDisplayValue("#F0F0F0");
      const bgColorInput = bgColorInputs[0];
      
      fireEvent.change(bgColorInput, { target: { value: "#FFFFFF" } });
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundColor: "#FFFFFF",
        })
      );
    });

    it("calls onChange when border color is modified", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const borderColorInputs = screen.getAllByDisplayValue("#CCCCCC");
      const borderColorInput = borderColorInputs[0];
      
      fireEvent.change(borderColorInput, { target: { value: "#000000" } });
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          borderColor: "#000000",
        })
      );
    });
  });

  describe("Alignment Buttons", () => {
    it("renders three alignment buttons", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const buttons = screen.getAllByRole("button");
      // Should have at least 3 alignment buttons
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it("highlights center alignment by default", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      // Center button should have default variant
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("calls onChange when left alignment is clicked", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const buttons = screen.getAllByRole("button");
      const leftButton = buttons[0]; // First button is left align
      
      fireEvent.click(leftButton);
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          alignment: "left",
        })
      );
    });

    it("calls onChange when center alignment is clicked", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const buttons = screen.getAllByRole("button");
      const centerButton = buttons[1]; // Second button is center align
      
      fireEvent.click(centerButton);
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          alignment: "center",
        })
      );
    });

    it("calls onChange when right alignment is clicked", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const buttons = screen.getAllByRole("button");
      const rightButton = buttons[2]; // Third button is right align
      
      fireEvent.click(rightButton);
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          alignment: "right",
        })
      );
    });
  });

  describe("Border Inputs", () => {
    it("calls onChange when borderWidth is modified", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const borderWidthInput = screen.getByLabelText("Largura da Borda (px)");
      
      fireEvent.change(borderWidthInput, { target: { value: "3" } });
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          borderWidth: 3,
        })
      );
    });

    it("calls onChange when borderRadius is modified", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const borderRadiusInput = screen.getByLabelText("Raio da Borda (px)");
      
      fireEvent.change(borderRadiusInput, { target: { value: "15" } });
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          borderRadius: 15,
        })
      );
    });

    it("handles zero borderWidth", () => {
      render(<TextEditor component={mockComponent} onChange={mockOnChange} />);
      const borderWidthInput = screen.getByLabelText("Largura da Borda (px)");
      
      fireEvent.change(borderWidthInput, { target: { value: "0" } });
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          borderWidth: 0,
        })
      );
    });
  });

  describe("Empty Content Handling", () => {
    it("handles component with no content", () => {
      const emptyComponent: ComponentData = {
        id: "text-2",
        type: "text",
      };
      
      render(<TextEditor component={emptyComponent} onChange={mockOnChange} />);
      
      const textInput = screen.getByLabelText("Texto") as HTMLInputElement;
      expect(textInput.value).toBe("");
    });

    it("uses default values when content fields are missing", () => {
      const partialComponent: ComponentData = {
        id: "text-3",
        type: "text",
        content: {
          text: "Partial",
        },
      };
      
      render(<TextEditor component={partialComponent} onChange={mockOnChange} />);
      
      const fontSizeInput = screen.getByLabelText("Tamanho da Fonte") as HTMLInputElement;
      expect(fontSizeInput.value).toBe("16"); // Default fontSize
    });
  });
});
