/**
 * PixelCard Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests card display, badge states, and action callbacks.
 * 
 * @module test/modules/pixels/components/PixelCard
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PixelCard } from "../PixelCard";
import type { VendorPixel } from "../../types";

// Factory for mock pixels
function createMockPixel(overrides: Partial<VendorPixel> = {}): VendorPixel {
  return {
    id: "pixel-1",
    vendor_id: "vendor-1",
    platform: "facebook",
    name: "Main Pixel",
    pixel_id: "123456789",
    access_token: "token",
    domain: "example.com",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_products_count: 3,
    ...overrides,
  };
}

describe("PixelCard", () => {
  describe("display", () => {
    it("should render pixel name", () => {
      const pixel = createMockPixel({ name: "My Facebook Pixel" });
      
      render(
        <PixelCard pixel={pixel} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      
      expect(screen.getByText("My Facebook Pixel")).toBeInTheDocument();
    });

    it("should render pixel ID in monospace", () => {
      const pixel = createMockPixel({ pixel_id: "987654321" });
      
      render(
        <PixelCard pixel={pixel} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      
      const pixelId = screen.getByText("987654321");
      expect(pixelId).toHaveClass("font-mono");
    });

    it("should display linked products count singular", () => {
      const pixel = createMockPixel({ linked_products_count: 1 });
      
      render(
        <PixelCard pixel={pixel} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      
      expect(screen.getByText("Vinculado a 1 produto")).toBeInTheDocument();
    });

    it("should display linked products count plural", () => {
      const pixel = createMockPixel({ linked_products_count: 5 });
      
      render(
        <PixelCard pixel={pixel} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      
      expect(screen.getByText("Vinculado a 5 produtos")).toBeInTheDocument();
    });

    it("should not show count when undefined", () => {
      const pixel = createMockPixel({ linked_products_count: undefined });
      
      render(
        <PixelCard pixel={pixel} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      
      expect(screen.queryByText(/Vinculado a/)).not.toBeInTheDocument();
    });
  });

  describe("badge states", () => {
    it("should show 'Ativo' badge when active", () => {
      const pixel = createMockPixel({ is_active: true });
      
      render(
        <PixelCard pixel={pixel} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      
      expect(screen.getByText("Ativo")).toBeInTheDocument();
    });

    it("should show 'Inativo' badge when inactive", () => {
      const pixel = createMockPixel({ is_active: false });
      
      render(
        <PixelCard pixel={pixel} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      
      expect(screen.getByText("Inativo")).toBeInTheDocument();
    });
  });

  describe("actions", () => {
    it("should call onEdit with pixel when edit clicked", () => {
      const onEdit = vi.fn();
      const pixel = createMockPixel();
      
      render(
        <PixelCard pixel={pixel} onEdit={onEdit} onDelete={vi.fn()} />
      );
      
      fireEvent.click(screen.getByTitle("Editar pixel"));
      
      expect(onEdit).toHaveBeenCalledWith(pixel);
      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it("should call onDelete with pixel when delete clicked", () => {
      const onDelete = vi.fn();
      const pixel = createMockPixel();
      
      render(
        <PixelCard pixel={pixel} onEdit={vi.fn()} onDelete={onDelete} />
      );
      
      fireEvent.click(screen.getByTitle("Excluir pixel"));
      
      expect(onDelete).toHaveBeenCalledWith(pixel);
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("platform icon", () => {
    it("should render platform icon for facebook", () => {
      const pixel = createMockPixel({ platform: "facebook" });
      
      const { container } = render(
        <PixelCard pixel={pixel} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should render platform icon for tiktok", () => {
      const pixel = createMockPixel({ platform: "tiktok" });
      
      const { container } = render(
        <PixelCard pixel={pixel} onEdit={vi.fn()} onDelete={vi.fn()} />
      );
      
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });
});
