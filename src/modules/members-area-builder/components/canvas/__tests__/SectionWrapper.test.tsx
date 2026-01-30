/**
 * SectionWrapper Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for SectionWrapper component covering:
 * - Rendering with children
 * - Selection behavior
 * - Movement controls (up/down)
 * - Preview mode
 * - Required sections
 * - Active/inactive states
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SectionWrapper } from "../SectionWrapper";
import type { Section } from "../../../types";

// Mock the registry module
vi.mock("../../../registry", () => ({
  getSectionLabel: vi.fn((type: string) => {
    const labels: Record<string, string> = {
      banner: "Banner",
      text: "Texto",
      fixed_header: "Cabeçalho Fixo",
    };
    return labels[type] || "Seção";
  }),
  getSectionIcon: vi.fn(() => "Box"),
  canMoveSection: vi.fn((type: string) => type !== "fixed_header"),
  isRequiredSection: vi.fn((type: string) => type === "fixed_header"),
}));

describe("SectionWrapper", () => {
  const mockOnSelect = vi.fn();
  const mockOnMoveUp = vi.fn();
  const mockOnMoveDown = vi.fn();

  const createMockSection = (overrides: Partial<Section> = {}): Section => ({
    id: "section-1",
    type: "banner",
    is_active: true,
    title: "Test Section",
    ...overrides,
  } as Section);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render children", () => {
      render(
        <SectionWrapper
          section={createMockSection()}
          isSelected={false}
          isFirst={false}
          isLast={false}
          isPreviewMode={false}
          onSelect={mockOnSelect}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        >
          <div>Test Content</div>
        </SectionWrapper>
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("should show section label", () => {
      render(
        <SectionWrapper
          section={createMockSection()}
          isSelected={true}
          isFirst={false}
          isLast={false}
          isPreviewMode={false}
          onSelect={mockOnSelect}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        >
          <div>Content</div>
        </SectionWrapper>
      );

      expect(screen.getByText("Banner")).toBeInTheDocument();
    });

    it("should show section title when present", () => {
      render(
        <SectionWrapper
          section={createMockSection({ title: "Custom Title" })}
          isSelected={true}
          isFirst={false}
          isLast={false}
          isPreviewMode={false}
          onSelect={mockOnSelect}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        >
          <div>Content</div>
        </SectionWrapper>
      );

      expect(screen.getByText(/Custom Title/)).toBeInTheDocument();
    });
  });

  describe("Preview Mode", () => {
    it("should render only children in preview mode", () => {
      render(
        <SectionWrapper
          section={createMockSection()}
          isSelected={false}
          isFirst={false}
          isLast={false}
          isPreviewMode={true}
          onSelect={mockOnSelect}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        >
          <div>Preview Content</div>
        </SectionWrapper>
      );

      expect(screen.getByText("Preview Content")).toBeInTheDocument();
      expect(screen.queryByText("Banner")).not.toBeInTheDocument();
    });

    it("should not show controls in preview mode", () => {
      const { container } = render(
        <SectionWrapper
          section={createMockSection()}
          isSelected={true}
          isFirst={false}
          isLast={false}
          isPreviewMode={true}
          onSelect={mockOnSelect}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        >
          <div>Content</div>
        </SectionWrapper>
      );

      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBe(0);
    });
  });

  describe("Selection", () => {
    it("should call onSelect when clicked", () => {
      const { container } = render(
        <SectionWrapper
          section={createMockSection()}
          isSelected={false}
          isFirst={false}
          isLast={false}
          isPreviewMode={false}
          onSelect={mockOnSelect}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        >
          <div>Content</div>
        </SectionWrapper>
      );

      const wrapper = container.firstChild as HTMLElement;
      fireEvent.click(wrapper);

      expect(mockOnSelect).toHaveBeenCalled();
    });

    it("should show selected state with border", () => {
      const { container } = render(
        <SectionWrapper
          section={createMockSection()}
          isSelected={true}
          isFirst={false}
          isLast={false}
          isPreviewMode={false}
          onSelect={mockOnSelect}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        >
          <div>Content</div>
        </SectionWrapper>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("border-primary");
    });

    it("should not show selected border when not selected", () => {
      const { container } = render(
        <SectionWrapper
          section={createMockSection()}
          isSelected={false}
          isFirst={false}
          isLast={false}
          isPreviewMode={false}
          onSelect={mockOnSelect}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        >
          <div>Content</div>
        </SectionWrapper>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("border-transparent");
    });
  });

  describe("Movement Controls", () => {
    it("should show move up button when not first", () => {
      render(
        <SectionWrapper
          section={createMockSection()}
          isSelected={true}
          isFirst={false}
          isLast={false}
          isPreviewMode={false}
          onSelect={mockOnSelect}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        >
          <div>Content</div>
        </SectionWrapper>
      );

      const buttons = screen.getAllByRole("button");
      const upButton = buttons.find(btn => !btn.hasAttribute("disabled") && btn.querySelector("svg"));
      expect(upButton).toBeInTheDocument();
    });

    it("should disable move up button when first", () => {
      render(
        <SectionWrapper
          section={createMockSection()}
          isSelected={true}
          isFirst={true}
          isLast={false}
          isPreviewMode={false}
          onSelect={mockOnSelect}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        >
          <div>Content</div>
        </SectionWrapper>
      );

      const buttons = screen.getAllByRole("button");
      const upButton = buttons[0];
      expect(upButton).toBeDisabled();
    });

    it("should disable move down button when last", () => {
      render(
        <SectionWrapper
          section={createMockSection()}
          isSelected={true}
          isFirst={false}
          isLast={true}
          isPreviewMode={false}
          onSelect={mockOnSelect}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        >
          <div>Content</div>
        </SectionWrapper>
      );

      const buttons = screen.getAllByRole("button");
      const downButton = buttons[1];
      expect(downButton).toBeDisabled();
    });

    it("should call onMoveUp when up button clicked", () => {
      render(
        <SectionWrapper
          section={createMockSection()}
          isSelected={true}
          isFirst={false}
          isLast={false}
          isPreviewMode={false}
          onSelect={mockOnSelect}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        >
          <div>Content</div>
        </SectionWrapper>
      );

      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[0]);

      expect(mockOnMoveUp).toHaveBeenCalled();
    });

    it("should call onMoveDown when down button clicked", () => {
      render(
        <SectionWrapper
          section={createMockSection()}
          isSelected={true}
          isFirst={false}
          isLast={false}
          isPreviewMode={false}
          onSelect={mockOnSelect}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        >
          <div>Content</div>
        </SectionWrapper>
      );

      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[1]);

      expect(mockOnMoveDown).toHaveBeenCalled();
    });

    it("should not show movement controls for fixed_header", () => {
      const { container } = render(
        <SectionWrapper
          section={createMockSection({ type: "fixed_header" })}
          isSelected={true}
          isFirst={true}
          isLast={false}
          isPreviewMode={false}
          onSelect={mockOnSelect}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        >
          <div>Content</div>
        </SectionWrapper>
      );

      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBe(0);
    });
  });

  describe("Active State", () => {
    it("should show full opacity when active", () => {
      const { container } = render(
        <SectionWrapper
          section={createMockSection({ is_active: true })}
          isSelected={false}
          isFirst={false}
          isLast={false}
          isPreviewMode={false}
          onSelect={mockOnSelect}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        >
          <div>Content</div>
        </SectionWrapper>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).not.toHaveClass("opacity-50");
    });

    it("should show reduced opacity when inactive", () => {
      const { container } = render(
        <SectionWrapper
          section={createMockSection({ is_active: false })}
          isSelected={false}
          isFirst={false}
          isLast={false}
          isPreviewMode={false}
          onSelect={mockOnSelect}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        >
          <div>Content</div>
        </SectionWrapper>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("opacity-50");
    });
  });
});
