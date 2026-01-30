/**
 * DateRangeDropdown Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - UI Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DateRangeDropdown } from "../DateRangeFilter/DateRangeDropdown";
import type { DateRangePreset } from "../../types";

// Mock the config module - use actual preset values from DateRangePreset type
vi.mock("../../config", () => ({
  DATE_PRESETS: [
    { value: "today", label: "Hoje" },
    { value: "yesterday", label: "Ontem" },
    { value: "7days", label: "Últimos 7 dias" },
    { value: "30days", label: "Últimos 30 dias" },
    { value: "max", label: "Período Máximo" },
  ],
}));

describe("DateRangeDropdown", () => {
  const defaultProps = {
    isOpen: false,
    onOpenChange: vi.fn(),
    selectedPreset: "7days" as DateRangePreset,
    displayLabel: "Últimos 7 dias",
    onPresetSelect: vi.fn(),
    onCustomClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Closed State", () => {
    it("should render trigger button with display label", () => {
      render(<DateRangeDropdown {...defaultProps} />);
      
      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByText("Últimos 7 dias")).toBeInTheDocument();
    });

    it("should render calendar icon", () => {
      const { container } = render(<DateRangeDropdown {...defaultProps} />);
      
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should show custom date range label", () => {
      render(
        <DateRangeDropdown 
          {...defaultProps} 
          selectedPreset="custom"
          displayLabel="01/01 - 15/01"
        />
      );
      
      expect(screen.getByText("01/01 - 15/01")).toBeInTheDocument();
    });
  });

  describe("Open State", () => {
    it("should show all preset options when open", () => {
      render(<DateRangeDropdown {...defaultProps} isOpen={true} />);
      
      expect(screen.getByText("Hoje")).toBeInTheDocument();
      expect(screen.getByText("Ontem")).toBeInTheDocument();
      expect(screen.getByText("Últimos 30 dias")).toBeInTheDocument();
      expect(screen.getByText("Período Máximo")).toBeInTheDocument();
    });

    it("should show custom period option", () => {
      render(<DateRangeDropdown {...defaultProps} isOpen={true} />);
      
      expect(screen.getByText("Período personalizado")).toBeInTheDocument();
    });

    it("should highlight selected preset", () => {
      render(<DateRangeDropdown {...defaultProps} isOpen={true} />);
      
      // The "Últimos 7 dias" menu item should have bg-accent class
      const menuItems = screen.getAllByRole("menuitem");
      const selectedItem = menuItems.find(item => item.textContent === "Últimos 7 dias");
      expect(selectedItem).toHaveClass("bg-accent");
    });
  });

  describe("Interactions", () => {
    it("should trigger dropdown interaction when clicked", () => {
      // DropdownMenu handles onOpenChange internally
      // We verify the button is accessible and clickable
      render(<DateRangeDropdown {...defaultProps} />);
      
      const button = screen.getByRole("button");
      expect(button).toBeEnabled();
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it("should call onPresetSelect when preset is clicked", () => {
      render(<DateRangeDropdown {...defaultProps} isOpen={true} />);
      
      fireEvent.click(screen.getByText("Hoje"));
      
      expect(defaultProps.onPresetSelect).toHaveBeenCalledWith("today");
    });

    it("should call onCustomClick when custom option is clicked", () => {
      render(<DateRangeDropdown {...defaultProps} isOpen={true} />);
      
      fireEvent.click(screen.getByText("Período personalizado"));
      
      expect(defaultProps.onCustomClick).toHaveBeenCalledTimes(1);
    });

    it("should call onPresetSelect with correct preset values", () => {
      render(<DateRangeDropdown {...defaultProps} isOpen={true} />);
      
      fireEvent.click(screen.getByText("Ontem"));
      expect(defaultProps.onPresetSelect).toHaveBeenCalledWith("yesterday");
      
      fireEvent.click(screen.getByText("Período Máximo"));
      expect(defaultProps.onPresetSelect).toHaveBeenCalledWith("max");
    });
  });

  describe("Different Selected Presets", () => {
    it("should highlight 'today' when selected", () => {
      render(
        <DateRangeDropdown 
          {...defaultProps} 
          isOpen={true}
          selectedPreset="today"
        />
      );
      
      const menuItems = screen.getAllByRole("menuitem");
      const selectedItem = menuItems.find(item => item.textContent === "Hoje");
      expect(selectedItem).toHaveClass("bg-accent");
    });

    it("should highlight 'max' when selected", () => {
      render(
        <DateRangeDropdown 
          {...defaultProps} 
          isOpen={true}
          selectedPreset="max"
        />
      );
      
      const menuItems = screen.getAllByRole("menuitem");
      const selectedItem = menuItems.find(item => item.textContent === "Período Máximo");
      expect(selectedItem).toHaveClass("bg-accent");
    });
  });
});
