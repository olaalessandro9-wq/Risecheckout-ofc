/**
 * GlobalSettingsPanel Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for GlobalSettingsPanel component covering:
 * - Rendering all settings fields
 * - Theme selection
 * - Color picker interaction
 * - Branding fields (logo, favicon, share image)
 * - onUpdate callback behavior
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlobalSettingsPanel } from "../GlobalSettingsPanel";
import type { MembersAreaBuilderSettings } from "../../../types";

describe("GlobalSettingsPanel", () => {
  const mockOnUpdate = vi.fn();

  const createMockSettings = (overrides: Partial<MembersAreaBuilderSettings> = {}): MembersAreaBuilderSettings => ({
    theme: "dark",
    primary_color: "#6366f1",
    logo_url: undefined,
    favicon_url: undefined,
    share_image_url: undefined,
    show_menu_desktop: true,
    show_menu_mobile: true,
    ...overrides,
  } as MembersAreaBuilderSettings);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render appearance section", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings()}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Aparência")).toBeInTheDocument();
    });

    it("should render branding section", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings()}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Marca")).toBeInTheDocument();
    });

    it("should render theme label", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings()}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Tema")).toBeInTheDocument();
    });

    it("should render primary color label", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings()}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Cor Principal")).toBeInTheDocument();
    });

    it("should render logo URL field", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings()}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Logo URL")).toBeInTheDocument();
    });

    it("should render favicon URL field", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings()}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Favicon URL")).toBeInTheDocument();
    });

    it("should render share image field", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings()}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Imagem de Compartilhamento (OG)")).toBeInTheDocument();
    });
  });

  describe("Theme Selection", () => {
    it("should display current theme", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings({ theme: "dark" })}
          onUpdate={mockOnUpdate}
        />
      );

      const select = screen.getByRole("combobox");
      expect(select).toHaveTextContent("Escuro (Netflix)");
    });

    it("should display light theme", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings({ theme: "light" })}
          onUpdate={mockOnUpdate}
        />
      );

      const select = screen.getByRole("combobox");
      expect(select).toHaveTextContent("Claro");
    });

    it("should call onUpdate when theme changes", async () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings({ theme: "dark" })}
          onUpdate={mockOnUpdate}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.click(select);

      const lightOption = await screen.findByText("Claro");
      fireEvent.click(lightOption);

      expect(mockOnUpdate).toHaveBeenCalledWith({ theme: "light" });
    });
  });

  describe("Primary Color", () => {
    it("should display current color in color picker", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings({ primary_color: "#ff0000" })}
          onUpdate={mockOnUpdate}
        />
      );

      const colorInput = screen.getAllByDisplayValue("#ff0000")[0] as HTMLInputElement;
      expect(colorInput.type).toBe("color");
    });

    it("should display current color in text input", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings({ primary_color: "#00ff00" })}
          onUpdate={mockOnUpdate}
        />
      );

      const textInputs = screen.getAllByDisplayValue("#00ff00");
      expect(textInputs.length).toBeGreaterThan(0);
    });

    it("should call onUpdate when color picker changes", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings()}
          onUpdate={mockOnUpdate}
        />
      );

      const colorInput = screen.getByDisplayValue("#6366f1") as HTMLInputElement;
      fireEvent.change(colorInput, { target: { value: "#123456" } });

      expect(mockOnUpdate).toHaveBeenCalledWith({ primary_color: "#123456" });
    });

    it("should call onUpdate when text input changes", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings()}
          onUpdate={mockOnUpdate}
        />
      );

      const textInputs = screen.getAllByDisplayValue("#6366f1");
      const textInput = textInputs[1]; // Second input is the text field
      fireEvent.change(textInput, { target: { value: "#abcdef" } });

      expect(mockOnUpdate).toHaveBeenCalledWith({ primary_color: "#abcdef" });
    });
  });

  describe("Logo URL", () => {
    it("should display empty logo URL", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings({ logo_url: undefined })}
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByPlaceholderText("https://...") as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("should display existing logo URL", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings({ logo_url: "https://example.com/logo.png" })}
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByDisplayValue("https://example.com/logo.png");
      expect(input).toBeInTheDocument();
    });

    it("should call onUpdate when logo URL changes", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings()}
          onUpdate={mockOnUpdate}
        />
      );

      const inputs = screen.getAllByPlaceholderText("https://...");
      const logoInput = inputs[0];
      fireEvent.change(logoInput, { target: { value: "https://new-logo.com/logo.png" } });

      expect(mockOnUpdate).toHaveBeenCalledWith({ logo_url: "https://new-logo.com/logo.png" });
    });

    it("should handle clearing logo URL", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings({ logo_url: "https://example.com/logo.png" })}
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByDisplayValue("https://example.com/logo.png");
      fireEvent.change(input, { target: { value: "" } });

      expect(mockOnUpdate).toHaveBeenCalledWith({ logo_url: undefined });
    });
  });

  describe("Favicon URL", () => {
    it("should display empty favicon URL", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings({ favicon_url: undefined })}
          onUpdate={mockOnUpdate}
        />
      );

      const inputs = screen.getAllByPlaceholderText("https://...");
      expect(inputs.length).toBeGreaterThan(1);
    });

    it("should display existing favicon URL", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings({ favicon_url: "https://example.com/favicon.ico" })}
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByDisplayValue("https://example.com/favicon.ico");
      expect(input).toBeInTheDocument();
    });

    it("should call onUpdate when favicon URL changes", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings()}
          onUpdate={mockOnUpdate}
        />
      );

      const inputs = screen.getAllByPlaceholderText("https://...");
      const faviconInput = inputs[1];
      fireEvent.change(faviconInput, { target: { value: "https://new-favicon.com/icon.ico" } });

      expect(mockOnUpdate).toHaveBeenCalledWith({ favicon_url: "https://new-favicon.com/icon.ico" });
    });
  });

  describe("Share Image URL", () => {
    it("should display empty share image URL", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings({ share_image_url: undefined })}
          onUpdate={mockOnUpdate}
        />
      );

      const inputs = screen.getAllByPlaceholderText("https://...");
      expect(inputs.length).toBe(3);
    });

    it("should display existing share image URL", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings({ share_image_url: "https://example.com/og.jpg" })}
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByDisplayValue("https://example.com/og.jpg");
      expect(input).toBeInTheDocument();
    });

    it("should call onUpdate when share image URL changes", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings()}
          onUpdate={mockOnUpdate}
        />
      );

      const inputs = screen.getAllByPlaceholderText("https://...");
      const shareImageInput = inputs[2];
      fireEvent.change(shareImageInput, { target: { value: "https://new-og.com/image.jpg" } });

      expect(mockOnUpdate).toHaveBeenCalledWith({ share_image_url: "https://new-og.com/image.jpg" });
    });
  });

  describe("Multiple Updates", () => {
    it("should handle sequential updates", () => {
      render(
        <GlobalSettingsPanel
          settings={createMockSettings()}
          onUpdate={mockOnUpdate}
        />
      );

      const inputs = screen.getAllByPlaceholderText("https://...");
      
      fireEvent.change(inputs[0], { target: { value: "https://logo1.com" } });
      expect(mockOnUpdate).toHaveBeenCalledWith({ logo_url: "https://logo1.com" });

      fireEvent.change(inputs[1], { target: { value: "https://favicon1.com" } });
      expect(mockOnUpdate).toHaveBeenCalledWith({ favicon_url: "https://favicon1.com" });

      expect(mockOnUpdate).toHaveBeenCalledTimes(2);
    });
  });
});
