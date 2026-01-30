/**
 * TextEditor Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for TextEditor component covering:
 * - Rendering with default values
 * - Textarea content editing
 * - Alignment selection
 * - onUpdate callback behavior
 * - Empty and populated states
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextEditor } from "../TextEditor";
import type { Section, TextSettings } from "../../../../types";

describe("TextEditor", () => {
  const mockOnUpdate = vi.fn();

  const createMockSection = (overrides: Partial<TextSettings> = {}): Section => ({
    id: "text-1",
    type: "text",
    is_active: true,
    settings: {
      content: "",
      alignment: "left",
      ...overrides,
    } as TextSettings,
  } as Section);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render content label", () => {
      render(
        <TextEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Conteúdo")).toBeInTheDocument();
    });

    it("should render alignment label", () => {
      render(
        <TextEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Alinhamento")).toBeInTheDocument();
    });

    it("should render textarea", () => {
      render(
        <TextEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const textarea = screen.getByPlaceholderText("Digite seu texto aqui...");
      expect(textarea).toBeInTheDocument();
    });

    it("should render HTML support hint", () => {
      render(
        <TextEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Suporta HTML básico para formatação")).toBeInTheDocument();
    });

    it("should render alignment select", () => {
      render(
        <TextEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
    });
  });

  describe("Content Editing", () => {
    it("should display existing content", () => {
      render(
        <TextEditor
          section={createMockSection({ content: "Test content" })}
          onUpdate={mockOnUpdate}
        />
      );

      const textarea = screen.getByPlaceholderText("Digite seu texto aqui...") as HTMLTextAreaElement;
      expect(textarea.value).toBe("Test content");
    });

    it("should display empty string when no content", () => {
      render(
        <TextEditor
          section={createMockSection({ content: "" })}
          onUpdate={mockOnUpdate}
        />
      );

      const textarea = screen.getByPlaceholderText("Digite seu texto aqui...") as HTMLTextAreaElement;
      expect(textarea.value).toBe("");
    });

    it("should call onUpdate when content changes", () => {
      render(
        <TextEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const textarea = screen.getByPlaceholderText("Digite seu texto aqui...");
      fireEvent.change(textarea, { target: { value: "New content" } });

      expect(mockOnUpdate).toHaveBeenCalledWith({ content: "New content" });
    });

    it("should handle multiline content", () => {
      render(
        <TextEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const textarea = screen.getByPlaceholderText("Digite seu texto aqui...");
      const multilineText = "Line 1\nLine 2\nLine 3";
      fireEvent.change(textarea, { target: { value: multilineText } });

      expect(mockOnUpdate).toHaveBeenCalledWith({ content: multilineText });
    });

    it("should handle HTML content", () => {
      render(
        <TextEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const textarea = screen.getByPlaceholderText("Digite seu texto aqui...");
      const htmlContent = "<p>Bold <strong>text</strong></p>";
      fireEvent.change(textarea, { target: { value: htmlContent } });

      expect(mockOnUpdate).toHaveBeenCalledWith({ content: htmlContent });
    });
  });

  describe("Alignment Selection", () => {
    it("should display current alignment", () => {
      render(
        <TextEditor
          section={createMockSection({ alignment: "center" })}
          onUpdate={mockOnUpdate}
        />
      );

      const select = screen.getByRole("combobox");
      expect(select).toHaveTextContent("Centro");
    });

    it("should default to left alignment", () => {
      render(
        <TextEditor
          section={createMockSection({ alignment: undefined })}
          onUpdate={mockOnUpdate}
        />
      );

      const select = screen.getByRole("combobox");
      expect(select).toHaveTextContent("Esquerda");
    });

    it("should show all alignment options when opened", async () => {
      render(
        <TextEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.click(select);

      expect(await screen.findByText("Esquerda")).toBeInTheDocument();
      expect(await screen.findByText("Centro")).toBeInTheDocument();
      expect(await screen.findByText("Direita")).toBeInTheDocument();
    });

    it("should call onUpdate when alignment changes to center", async () => {
      render(
        <TextEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.click(select);

      const centerOption = await screen.findByText("Centro");
      fireEvent.click(centerOption);

      expect(mockOnUpdate).toHaveBeenCalledWith({ alignment: "center" });
    });

    it("should call onUpdate when alignment changes to right", async () => {
      render(
        <TextEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.click(select);

      const rightOption = await screen.findByText("Direita");
      fireEvent.click(rightOption);

      expect(mockOnUpdate).toHaveBeenCalledWith({ alignment: "right" });
    });
  });

  describe("Multiple Updates", () => {
    it("should handle sequential content updates", () => {
      render(
        <TextEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const textarea = screen.getByPlaceholderText("Digite seu texto aqui...");
      
      fireEvent.change(textarea, { target: { value: "First" } });
      expect(mockOnUpdate).toHaveBeenCalledWith({ content: "First" });

      fireEvent.change(textarea, { target: { value: "Second" } });
      expect(mockOnUpdate).toHaveBeenCalledWith({ content: "Second" });

      expect(mockOnUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long content", () => {
      render(
        <TextEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const textarea = screen.getByPlaceholderText("Digite seu texto aqui...");
      const longContent = "A".repeat(5000);
      fireEvent.change(textarea, { target: { value: longContent } });

      expect(mockOnUpdate).toHaveBeenCalledWith({ content: longContent });
    });

    it("should handle special characters", () => {
      render(
        <TextEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const textarea = screen.getByPlaceholderText("Digite seu texto aqui...");
      const specialChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
      fireEvent.change(textarea, { target: { value: specialChars } });

      expect(mockOnUpdate).toHaveBeenCalledWith({ content: specialChars });
    });
  });
});
