/**
 * CountryCodeSelector Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for CountryCodeSelector component.
 * Covers: rendering, dropdown, search, selection, accessibility.
 *
 * @module components/ui/__tests__/CountryCodeSelector.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/test/utils";
import { CountryCodeSelector } from "../CountryCodeSelector";

// ============================================================================
// Test Suite: CountryCodeSelector
// ============================================================================

describe("CountryCodeSelector", () => {
  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe("Rendering", () => {
    it("renders selector button", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders with Brazil as default for +55", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);
      const img = screen.getByAltText("Brasil");
      expect(img).toBeInTheDocument();
    });

    it("renders with US flag for +1", () => {
      render(<CountryCodeSelector value="+1" onChange={vi.fn()} />);
      // +1 matches both US and Canada, but US comes first
      const img = screen.getByAltText("United States");
      expect(img).toBeInTheDocument();
    });

    it("renders chevron icon", () => {
      const { container } = render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);
      // Chevron icon should be present
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("renders flag image with correct src", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);
      const img = screen.getByAltText("Brasil") as HTMLImageElement;
      expect(img.src).toContain("flagcdn.com");
      expect(img.src).toContain("br");
    });
  });

  // ==========================================================================
  // Dropdown Tests
  // ==========================================================================

  describe("Dropdown", () => {
    it("opens dropdown on click", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByPlaceholderText("Buscar país")).toBeInTheDocument();
    });

    it("closes dropdown on outside click", async () => {
      render(
        <div>
          <CountryCodeSelector value="+55" onChange={vi.fn()} />
          <div data-testid="outside">Outside</div>
        </div>
      );

      // Open dropdown
      fireEvent.click(screen.getByRole("button"));
      expect(screen.getByPlaceholderText("Buscar país")).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(screen.getByTestId("outside"));

      await waitFor(() => {
        expect(screen.queryByPlaceholderText("Buscar país")).not.toBeInTheDocument();
      });
    });

    it("shows all countries in dropdown", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("Brasil")).toBeInTheDocument();
      expect(screen.getByText("United States")).toBeInTheDocument();
      expect(screen.getByText("Portugal")).toBeInTheDocument();
      expect(screen.getByText("Argentina")).toBeInTheDocument();
    });

    it("shows dial codes in dropdown", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("+55")).toBeInTheDocument();
      // +1 appears twice (US and Canada), use getAllByText
      expect(screen.getAllByText("+1").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("+351")).toBeInTheDocument();
    });

    it("highlights selected country", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);

      fireEvent.click(screen.getByRole("button"));

      // Brasil should have the selected styling
      const brasilButton = screen.getAllByRole("button").find((btn) =>
        btn.textContent?.includes("Brasil")
      );
      expect(brasilButton).toHaveClass("bg-primary/10");
    });
  });

  // ==========================================================================
  // Search Tests
  // ==========================================================================

  describe("Search", () => {
    it("filters countries by name", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);

      fireEvent.click(screen.getByRole("button"));

      const searchInput = screen.getByPlaceholderText("Buscar país");
      fireEvent.change(searchInput, { target: { value: "Brasil" } });

      expect(screen.getByText("Brasil")).toBeInTheDocument();
      expect(screen.queryByText("United States")).not.toBeInTheDocument();
    });

    it("filters countries by dial code", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);

      fireEvent.click(screen.getByRole("button"));

      const searchInput = screen.getByPlaceholderText("Buscar país");
      fireEvent.change(searchInput, { target: { value: "+351" } });

      expect(screen.getByText("Portugal")).toBeInTheDocument();
      expect(screen.queryByText("Brasil")).not.toBeInTheDocument();
    });

    it("filters countries by country code", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);

      fireEvent.click(screen.getByRole("button"));

      const searchInput = screen.getByPlaceholderText("Buscar país");
      fireEvent.change(searchInput, { target: { value: "AR" } });

      expect(screen.getByText("Argentina")).toBeInTheDocument();
    });

    it("shows no results message when no match", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);

      fireEvent.click(screen.getByRole("button"));

      const searchInput = screen.getByPlaceholderText("Buscar país");
      fireEvent.change(searchInput, { target: { value: "xyz123" } });

      expect(screen.getByText("Nenhum país encontrado")).toBeInTheDocument();
    });

    it("search is case insensitive", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);

      fireEvent.click(screen.getByRole("button"));

      const searchInput = screen.getByPlaceholderText("Buscar país");
      fireEvent.change(searchInput, { target: { value: "BRASIL" } });

      expect(screen.getByText("Brasil")).toBeInTheDocument();
    });

    it("clears search when dropdown closes", async () => {
      render(
        <div>
          <CountryCodeSelector value="+55" onChange={vi.fn()} />
          <div data-testid="outside">Outside</div>
        </div>
      );

      // Open and search
      fireEvent.click(screen.getByRole("button"));
      const searchInput = screen.getByPlaceholderText("Buscar país");
      fireEvent.change(searchInput, { target: { value: "Portugal" } });

      // Close
      fireEvent.mouseDown(screen.getByTestId("outside"));

      // Reopen
      await waitFor(() => {
        expect(screen.queryByPlaceholderText("Buscar país")).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      // Search should be cleared
      expect(screen.getByPlaceholderText("Buscar país")).toHaveValue("");
    });
  });

  // ==========================================================================
  // Selection Tests
  // ==========================================================================

  describe("Selection", () => {
    it("calls onChange when country selected", () => {
      const handleChange = vi.fn();
      render(<CountryCodeSelector value="+55" onChange={handleChange} />);

      fireEvent.click(screen.getByRole("button"));

      // Click Portugal
      const portugalButton = screen.getAllByRole("button").find((btn) =>
        btn.textContent?.includes("Portugal")
      );
      if (portugalButton) {
        fireEvent.click(portugalButton);
      }

      expect(handleChange).toHaveBeenCalledWith("+351", "PT");
    });

    it("closes dropdown after selection", async () => {
      const handleChange = vi.fn();
      render(<CountryCodeSelector value="+55" onChange={handleChange} />);

      fireEvent.click(screen.getByRole("button"));

      // Click Portugal
      const portugalButton = screen.getAllByRole("button").find((btn) =>
        btn.textContent?.includes("Portugal")
      );
      if (portugalButton) {
        fireEvent.click(portugalButton);
      }

      await waitFor(() => {
        expect(screen.queryByPlaceholderText("Buscar país")).not.toBeInTheDocument();
      });
    });

    it("updates displayed flag after selection", () => {
      const handleChange = vi.fn();
      const { rerender } = render(<CountryCodeSelector value="+55" onChange={handleChange} />);

      // Initially shows Brazil
      expect(screen.getByAltText("Brasil")).toBeInTheDocument();

      // Simulate parent updating value
      rerender(<CountryCodeSelector value="+351" onChange={handleChange} />);

      // Now shows Portugal
      expect(screen.getByAltText("Portugal")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Disabled State Tests
  // ==========================================================================

  describe("Disabled State", () => {
    it("renders disabled button", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} disabled />);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("does not open dropdown when disabled", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} disabled />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.queryByPlaceholderText("Buscar país")).not.toBeInTheDocument();
    });

    it("applies disabled styling", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} disabled />);
      expect(screen.getByRole("button")).toHaveClass("disabled:opacity-50");
    });
  });

  // ==========================================================================
  // Focus Tests
  // ==========================================================================

  describe("Focus", () => {
    it("focuses search input when dropdown opens", async () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText("Buscar país");
        expect(document.activeElement).toBe(searchInput);
      });
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("defaults to Brazil when value not found", () => {
      render(<CountryCodeSelector value="+999" onChange={vi.fn()} />);
      // Should default to first country (Brasil)
      expect(screen.getByAltText("Brasil")).toBeInTheDocument();
    });

    it("handles empty value", () => {
      render(<CountryCodeSelector value="" onChange={vi.fn()} />);
      // Should default to Brasil
      expect(screen.getByAltText("Brasil")).toBeInTheDocument();
    });

    it("handles multiple countries with same dial code", () => {
      render(<CountryCodeSelector value="+1" onChange={vi.fn()} />);

      fireEvent.click(screen.getByRole("button"));

      // Both US and Canada have +1
      expect(screen.getByText("United States")).toBeInTheDocument();
      expect(screen.getByText("Canada")).toBeInTheDocument();
    });

    it("renders all 20 countries", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);

      fireEvent.click(screen.getByRole("button"));

      // Count country buttons (excluding search input button)
      const countryButtons = screen.getAllByRole("button").filter((btn) =>
        btn.textContent && btn.textContent.includes("+")
      );
      expect(countryButtons.length).toBe(20);
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe("Accessibility", () => {
    it("button has type button to prevent form submission", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);
      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it("flag images have alt text", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);

      fireEvent.click(screen.getByRole("button"));

      const flagImages = screen.getAllByRole("img");
      flagImages.forEach((img) => {
        expect(img).toHaveAttribute("alt");
      });
    });

    it("search input has placeholder", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByPlaceholderText("Buscar país")).toBeInTheDocument();
    });

    it("country buttons in dropdown have type button", () => {
      render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);

      fireEvent.click(screen.getByRole("button"));

      const countryButtons = screen.getAllByRole("button").filter((btn) =>
        btn.textContent?.includes("Brasil") ||
        btn.textContent?.includes("United States")
      );

      countryButtons.forEach((btn) => {
        expect(btn).toHaveAttribute("type", "button");
      });
    });
  });

  // ==========================================================================
  // Chevron Animation Tests
  // ==========================================================================

  describe("Chevron Animation", () => {
    it("rotates chevron when dropdown is open", () => {
      const { container } = render(<CountryCodeSelector value="+55" onChange={vi.fn()} />);

      const chevron = container.querySelector("svg");
      expect(chevron).not.toHaveClass("rotate-180");

      fireEvent.click(screen.getByRole("button"));

      // After opening, chevron should rotate
      const chevronAfter = container.querySelector("svg");
      expect(chevronAfter).toHaveClass("rotate-180");
    });
  });
});
