/**
 * SidebarBrand Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - UI Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SidebarBrand } from "../Sidebar/SidebarBrand";

describe("SidebarBrand", () => {
  describe("Logo Rendering", () => {
    it("should always render logo with 'R'", () => {
      render(<SidebarBrand showLabels={true} />);
      
      expect(screen.getByText("R")).toBeInTheDocument();
    });

    it("should render logo when labels are hidden", () => {
      render(<SidebarBrand showLabels={false} />);
      
      expect(screen.getByText("R")).toBeInTheDocument();
    });

    it("should have primary background on logo", () => {
      render(<SidebarBrand showLabels={true} />);
      
      const logo = screen.getByText("R");
      expect(logo).toHaveClass("bg-primary");
    });
  });

  describe("Brand Name Visibility", () => {
    it("should show 'RiseCheckout' when showLabels is true", () => {
      render(<SidebarBrand showLabels={true} />);
      
      expect(screen.getByText("RiseCheckout")).toBeInTheDocument();
    });

    it("should hide brand name when showLabels is false", () => {
      render(<SidebarBrand showLabels={false} />);
      
      expect(screen.queryByText("RiseCheckout")).not.toBeInTheDocument();
    });
  });

  describe("Layout Modes", () => {
    it("should apply default layout when fullWidth is false", () => {
      const { container } = render(<SidebarBrand showLabels={true} />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("h-[88px]");
      expect(wrapper).toHaveClass("justify-center");
    });

    it("should apply fullWidth layout when fullWidth is true", () => {
      const { container } = render(<SidebarBrand showLabels={true} fullWidth={true} />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("h-20");
      expect(wrapper).toHaveClass("px-6");
    });

    it("should have border bottom", () => {
      const { container } = render(<SidebarBrand showLabels={true} />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("border-b");
    });
  });

  describe("Gap Styling", () => {
    it("should have gap when showLabels is true", () => {
      const { container } = render(<SidebarBrand showLabels={true} />);
      
      // Find the inner flex container
      const innerContainer = container.querySelector(".flex.items-center.overflow-hidden");
      expect(innerContainer).toHaveClass("gap-3");
    });

    it("should have no gap when showLabels is false", () => {
      const { container } = render(<SidebarBrand showLabels={false} />);
      
      const innerContainer = container.querySelector(".flex.items-center.overflow-hidden");
      expect(innerContainer).toHaveClass("gap-0");
    });
  });

  describe("Animations", () => {
    it("should have animation classes on brand name", () => {
      render(<SidebarBrand showLabels={true} />);
      
      const brandName = screen.getByText("RiseCheckout");
      expect(brandName).toHaveClass("animate-in");
      expect(brandName).toHaveClass("fade-in");
    });
  });
});
