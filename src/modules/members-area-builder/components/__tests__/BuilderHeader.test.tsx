/**
 * BuilderHeader Tests
 * 
 * Uses `as unknown as T` pattern for vi.mocked() calls.
 * Justification: vi.mocked requires full type match, but tests only need
 * the subset of properties actually consumed by the component.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - UI Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BuilderHeader } from "../header/BuilderHeader";
import type { BuilderState, BuilderActions, MembersAreaBuilderSettings, Section } from "../../types";

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

function createMockSettings(): MembersAreaBuilderSettings {
  return {
    theme: "light",
    primary_color: "#000000",
    show_menu_desktop: true,
    show_menu_mobile: true,
    menu_items: [],
    sidebar_animation: "click",
    login_layout: "centered",
  };
}

function createMockSection(overrides?: Partial<Section>): Section {
  return {
    id: "section-1",
    product_id: "product-1",
    type: "modules",
    viewport: "desktop",
    title: null,
    position: 0,
    settings: { type: "modules", course_id: null, show_title: "always", show_progress: true, card_size: "medium", title_size: "medium" },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockState(overrides: Partial<BuilderState> = {}): BuilderState {
  return {
    viewMode: "desktop",
    activeViewport: "desktop",
    isPreviewMode: false,
    isDirty: false,
    isSaving: false,
    isLoading: false,
    desktopSections: [],
    mobileSections: [],
    sections: [],
    settings: createMockSettings(),
    selectedSectionId: null,
    selectedMenuItemId: null,
    isMenuCollapsed: false,
    isMobileSynced: true,
    modules: [],
    selectedModuleId: null,
    isEditingModule: false,
    ...overrides,
  };
}

function createMockActions(): BuilderActions {
  return {
    addSection: vi.fn().mockResolvedValue(null),
    updateSection: vi.fn().mockResolvedValue(undefined),
    updateSectionSettings: vi.fn().mockResolvedValue(undefined),
    deleteSection: vi.fn().mockResolvedValue(undefined),
    reorderSections: vi.fn().mockResolvedValue(undefined),
    duplicateSection: vi.fn().mockResolvedValue(null),
    selectSection: vi.fn(),
    selectMenuItem: vi.fn(),
    togglePreviewMode: vi.fn(),
    toggleMenuCollapse: vi.fn(),
    setActiveViewport: vi.fn(),
    copyDesktopToMobile: vi.fn(),
    setMobileSynced: vi.fn(),
    updateSettings: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(true),
    load: vi.fn().mockResolvedValue(undefined),
    discard: vi.fn(),
    loadModules: vi.fn().mockResolvedValue(undefined),
    updateModule: vi.fn().mockResolvedValue(undefined),
    selectModule: vi.fn(),
    setEditingModule: vi.fn(),
  };
}

describe("BuilderHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render header with title", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState()}
          actions={createMockActions()}
        />
      );

      expect(screen.getByText("Personalizar Área de Membros")).toBeInTheDocument();
    });

    it("should render back button", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState()}
          actions={createMockActions()}
        />
      );

      expect(screen.getByText("Voltar")).toBeInTheDocument();
    });

    it("should render viewport toggle buttons", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState()}
          actions={createMockActions()}
        />
      );

      expect(screen.getByText("Desktop")).toBeInTheDocument();
      expect(screen.getByText("Mobile")).toBeInTheDocument();
    });

    it("should render save button", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState()}
          actions={createMockActions()}
        />
      );

      expect(screen.getByText("Salvar")).toBeInTheDocument();
    });

    it("should render preview button", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState()}
          actions={createMockActions()}
        />
      );

      expect(screen.getByText("Preview")).toBeInTheDocument();
    });
  });

  describe("Viewport Toggle", () => {
    it("should highlight desktop button when active", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({ activeViewport: "desktop" })}
          actions={createMockActions()}
        />
      );

      const desktopButton = screen.getByText("Desktop").closest("button");
      expect(desktopButton).toHaveClass("shadow-sm");
    });

    it("should highlight mobile button when active", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({ activeViewport: "mobile" })}
          actions={createMockActions()}
        />
      );

      const mobileButton = screen.getByText("Mobile").closest("button");
      expect(mobileButton).toHaveClass("shadow-sm");
    });

    it("should call setActiveViewport when desktop clicked", () => {
      const actions = createMockActions();
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({ activeViewport: "mobile" })}
          actions={actions}
        />
      );

      fireEvent.click(screen.getByText("Desktop"));
      expect(actions.setActiveViewport).toHaveBeenCalledWith("desktop");
    });

    it("should call setActiveViewport when mobile clicked", () => {
      const actions = createMockActions();
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({ activeViewport: "desktop" })}
          actions={actions}
        />
      );

      fireEvent.click(screen.getByText("Mobile"));
      expect(actions.setActiveViewport).toHaveBeenCalledWith("mobile");
    });

    it("should show section counts in viewport buttons", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({
            desktopSections: [
              createMockSection({ id: "d1" }),
              createMockSection({ id: "d2" }),
              createMockSection({ id: "d3" }),
            ],
            mobileSections: [
              createMockSection({ id: "m1", viewport: "mobile" }),
              createMockSection({ id: "m2", viewport: "mobile" }),
            ],
          })}
          actions={createMockActions()}
        />
      );

      expect(screen.getByText("(3)")).toBeInTheDocument();
      expect(screen.getByText("(2)")).toBeInTheDocument();
    });
  });

  describe("Mobile Sync Options", () => {
    it("should show sync options when mobile is active", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({ activeViewport: "mobile", isMobileSynced: true })}
          actions={createMockActions()}
        />
      );

      expect(screen.getByText("Sincronizado")).toBeInTheDocument();
    });

    it("should show independent label when not synced", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({ activeViewport: "mobile", isMobileSynced: false })}
          actions={createMockActions()}
        />
      );

      expect(screen.getByText("Independente")).toBeInTheDocument();
    });

    it("should show copy button when not synced", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({ activeViewport: "mobile", isMobileSynced: false })}
          actions={createMockActions()}
        />
      );

      expect(screen.getByText("Copiar Desktop")).toBeInTheDocument();
    });

    it("should not show sync options when desktop is active", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({ activeViewport: "desktop" })}
          actions={createMockActions()}
        />
      );

      expect(screen.queryByText("Sincronizado")).not.toBeInTheDocument();
      expect(screen.queryByText("Independente")).not.toBeInTheDocument();
    });

    it("should call setMobileSynced when sync button clicked", () => {
      const actions = createMockActions();
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({ activeViewport: "mobile", isMobileSynced: true })}
          actions={actions}
        />
      );

      fireEvent.click(screen.getByText("Sincronizado"));
      expect(actions.setMobileSynced).toHaveBeenCalledWith(false);
    });

    it("should call copyDesktopToMobile when copy button clicked", () => {
      const actions = createMockActions();
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({ activeViewport: "mobile", isMobileSynced: false })}
          actions={actions}
        />
      );

      fireEvent.click(screen.getByText("Copiar Desktop"));
      expect(actions.copyDesktopToMobile).toHaveBeenCalled();
    });
  });

  describe("Preview Mode", () => {
    it("should show Preview when not in preview mode", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({ isPreviewMode: false })}
          actions={createMockActions()}
        />
      );

      expect(screen.getByText("Preview")).toBeInTheDocument();
    });

    it("should show Editar when in preview mode", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({ isPreviewMode: true })}
          actions={createMockActions()}
        />
      );

      expect(screen.getByText("Editar")).toBeInTheDocument();
    });

    it("should call togglePreviewMode when clicked", () => {
      const actions = createMockActions();
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState()}
          actions={actions}
        />
      );

      fireEvent.click(screen.getByText("Preview"));
      expect(actions.togglePreviewMode).toHaveBeenCalled();
    });
  });

  describe("Save Button", () => {
    it("should be disabled when not dirty", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({ isDirty: false })}
          actions={createMockActions()}
        />
      );

      const saveButton = screen.getByText("Salvar").closest("button");
      expect(saveButton).toBeDisabled();
    });

    it("should be enabled when dirty", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({ isDirty: true })}
          actions={createMockActions()}
        />
      );

      const saveButton = screen.getByText("Salvar").closest("button");
      expect(saveButton).toBeEnabled();
    });

    it("should be disabled when saving", () => {
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({ isDirty: true, isSaving: true })}
          actions={createMockActions()}
        />
      );

      const saveButton = screen.getByRole("button", { name: /salvar/i });
      expect(saveButton).toBeDisabled();
    });

    it("should call save when clicked", () => {
      const actions = createMockActions();
      renderWithRouter(
        <BuilderHeader
          productId="test-id"
          state={createMockState({ isDirty: true })}
          actions={actions}
        />
      );

      fireEvent.click(screen.getByText("Salvar"));
      expect(actions.save).toHaveBeenCalled();
    });
  });

  describe("Navigation", () => {
    it("should navigate back when back button clicked", () => {
      renderWithRouter(
        <BuilderHeader
          productId="product-123"
          state={createMockState()}
          actions={createMockActions()}
        />
      );

      fireEvent.click(screen.getByText("Voltar"));
      expect(mockNavigate).toHaveBeenCalledWith(
        "/dashboard/produtos/editar?id=product-123&section=members-area&tab=content"
      );
    });
  });
});
