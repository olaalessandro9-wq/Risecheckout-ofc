/**
 * MembersAreaCover Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - UI Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MembersAreaCover } from "../MembersAreaCover";

describe("MembersAreaCover", () => {
  describe("Rendering", () => {
    it("should render product name", () => {
      render(<MembersAreaCover productName="Curso de React" />);
      
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Curso de React");
    });

    it("should render 'Área de Membros' subtitle", () => {
      render(<MembersAreaCover productName="Test Product" />);
      
      expect(screen.getByText("Área de Membros")).toBeInTheDocument();
    });

    it("should render different product names correctly", () => {
      const { rerender } = render(<MembersAreaCover productName="Produto A" />);
      expect(screen.getByRole("heading")).toHaveTextContent("Produto A");

      rerender(<MembersAreaCover productName="Produto B" />);
      expect(screen.getByRole("heading")).toHaveTextContent("Produto B");
    });

    it("should handle empty product name", () => {
      render(<MembersAreaCover productName="" />);
      
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe("");
    });

    it("should handle long product names", () => {
      const longName = "Este é um nome de produto muito longo que pode precisar de tratamento especial";
      render(<MembersAreaCover productName={longName} />);
      
      expect(screen.getByRole("heading")).toHaveTextContent(longName);
    });
  });

  describe("Structure", () => {
    it("should have proper heading hierarchy", () => {
      render(<MembersAreaCover productName="Test" />);
      
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it("should have subtitle as paragraph", () => {
      render(<MembersAreaCover productName="Test" />);
      
      const subtitle = screen.getByText("Área de Membros");
      expect(subtitle.tagName).toBe("P");
    });
  });
});
