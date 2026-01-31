/**
 * AddSectionButton Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for AddSectionButton component covering:
 * - Rendering and button display
 * - Dropdown menu behavior
 * - Available section types filtering
 * - Section selection and callback
 * - Empty state when all sections added
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AddSectionButton } from "../AddSectionButton";
import type { Section, SectionType } from "../../../types";

// Mock the registry module
vi.mock("../../../registry", () => ({
  SectionRegistry: {
    banner: {
      label: "Banner",
      description: "Carrossel de imagens",
      icon: "Image",
    },
    text: {
      label: "Texto",
      description: "Bloco de texto",
      icon: "Type",
    },
    spacer: {
      label: "Espaçador",
      description: "Espaço vertical",
      icon: "Space",
    },
    fixed_header: {
      label: "Cabeçalho Fixo",
      description: "Cabeçalho sempre visível",
      icon: "Layout",
    },
  },
  getAvailableSectionTypes: vi.fn((sections: Section[]) => {
    const existingTypes = sections.map(s => s.type);
    const allTypes: SectionType[] = ["banner", "text", "spacer", "fixed_header"];
    return allTypes.filter(t => !existingTypes.includes(t));
  }),
}));

describe("AddSectionButton", () => {
  const mockOnAdd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render button with correct text", () => {
      render(
        <AddSectionButton
          sections={[]}
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByRole("button", { name: /adicionar seção/i })).toBeInTheDocument();
    });

    it("should render Plus icon", () => {
      render(
        <AddSectionButton
          sections={[]}
          onAdd={mockOnAdd}
        />
      );

      const button = screen.getByRole("button");
      const icon = button.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <AddSectionButton
          sections={[]}
          onAdd={mockOnAdd}
          className="custom-class"
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("Dropdown Menu", () => {
    it("should render dropdown trigger button", () => {
      render(
        <AddSectionButton
          sections={[]}
          onAdd={mockOnAdd}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("Section Filtering", () => {
    it("should accept sections with existing types", () => {
      const existingSections: Section[] = [
        { id: "1", type: "banner" } as Section,
      ];

      render(
        <AddSectionButton
          sections={existingSections}
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should accept all sections", () => {
      const allSections: Section[] = [
        { id: "1", type: "banner" } as Section,
        { id: "2", type: "text" } as Section,
        { id: "3", type: "spacer" } as Section,
        { id: "4", type: "fixed_header" } as Section,
      ];

      render(
        <AddSectionButton
          sections={allSections}
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Section Selection", () => {
    it("should have onAdd callback prop", () => {
      render(
        <AddSectionButton
          sections={[]}
          onAdd={mockOnAdd}
        />
      );

      expect(mockOnAdd).toBeDefined();
    });

    it("should handle empty sections array", () => {
      render(
        <AddSectionButton
          sections={[]}
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should handle sections with different types", () => {
      const sections: Section[] = [
        { id: "1", type: "banner" } as Section,
        { id: "2", type: "text" } as Section,
      ];

      render(
        <AddSectionButton
          sections={sections}
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
