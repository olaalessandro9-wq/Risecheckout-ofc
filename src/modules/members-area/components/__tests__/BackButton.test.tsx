/**
 * BackButton Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - UI Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BackButton } from "../BackButton";

describe("BackButton", () => {
  describe("Rendering", () => {
    it("should render with default label", () => {
      render(<BackButton onClick={() => {}} />);
      
      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByText("Voltar ao Produto")).toBeInTheDocument();
    });

    it("should render with custom label", () => {
      render(<BackButton onClick={() => {}} label="Voltar" />);
      
      expect(screen.getByText("Voltar")).toBeInTheDocument();
      expect(screen.queryByText("Voltar ao Produto")).not.toBeInTheDocument();
    });

    it("should render ArrowLeft icon", () => {
      render(<BackButton onClick={() => {}} />);
      
      const button = screen.getByRole("button");
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      render(<BackButton onClick={handleClick} />);
      
      fireEvent.click(screen.getByRole("button"));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should call onClick multiple times on multiple clicks", () => {
      const handleClick = vi.fn();
      render(<BackButton onClick={handleClick} />);
      
      const button = screen.getByRole("button");
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe("Styling", () => {
    it("should have ghost variant styling", () => {
      render(<BackButton onClick={() => {}} />);
      
      const button = screen.getByRole("button");
      expect(button).toHaveClass("gap-2");
    });
  });
});
