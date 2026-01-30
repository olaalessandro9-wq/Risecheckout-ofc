/**
 * ModuleCardPreview Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - UI Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModuleCardPreview } from "../ModuleCardPreview";

describe("ModuleCardPreview", () => {
  describe("Rendering with Image", () => {
    it("should render image when imageUrl is provided", () => {
      render(<ModuleCardPreview imageUrl="https://example.com/image.jpg" />);
      
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
    });

    it("should have proper alt text", () => {
      render(<ModuleCardPreview imageUrl="https://example.com/image.jpg" />);
      
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("alt", "Preview do módulo");
    });
  });

  describe("Rendering without Image", () => {
    it("should show placeholder when no imageUrl", () => {
      render(<ModuleCardPreview />);
      
      expect(screen.getByText("Sem imagem")).toBeInTheDocument();
    });

    it("should show placeholder when imageUrl is null", () => {
      render(<ModuleCardPreview imageUrl={null} />);
      
      expect(screen.getByText("Sem imagem")).toBeInTheDocument();
    });

    it("should render Film icon as placeholder", () => {
      const { container } = render(<ModuleCardPreview />);
      
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Lessons Count Badge", () => {
    it("should display correct lessons count", () => {
      render(<ModuleCardPreview lessonsCount={5} />);
      
      expect(screen.getByText("5 Aulas")).toBeInTheDocument();
    });

    it("should use singular 'Aula' for 1 lesson", () => {
      render(<ModuleCardPreview lessonsCount={1} />);
      
      expect(screen.getByText("1 Aula")).toBeInTheDocument();
    });

    it("should default to 0 lessons", () => {
      render(<ModuleCardPreview />);
      
      expect(screen.getByText("0 Aulas")).toBeInTheDocument();
    });

    it("should handle large lesson counts", () => {
      render(<ModuleCardPreview lessonsCount={999} />);
      
      expect(screen.getByText("999 Aulas")).toBeInTheDocument();
    });
  });

  describe("Size Variants", () => {
    it("should apply md size classes", () => {
      const { container } = render(<ModuleCardPreview size="md" />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("max-w-[180px]");
    });

    it("should apply lg size classes (default)", () => {
      const { container } = render(<ModuleCardPreview />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("max-w-[240px]");
    });

    it("should apply xl size classes", () => {
      const { container } = render(<ModuleCardPreview size="xl" />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("max-w-[320px]");
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(<ModuleCardPreview className="custom-class" />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("custom-class");
    });

    it("should merge custom className with default classes", () => {
      const { container } = render(<ModuleCardPreview className="custom-class" size="lg" />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("custom-class");
      expect(wrapper).toHaveClass("max-w-[240px]");
    });
  });
});
