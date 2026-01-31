/**
 * MembersAreaTab Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Members Area tab component that manages members area settings.
 * Uses `as unknown as T` pattern for vi.mocked() calls.
 * 
 * Justification: vi.mocked requires full type match, but tests only need
 * the subset of properties actually consumed by the component.
 * 
 * @module test/modules/products/tabs/MembersAreaTab
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MembersAreaTab } from "../members-area/MembersAreaTab";
import * as ProductContext from "../../context/ProductContext";
import * as MembersAreaHooks from "@/modules/members-area/hooks";
import { BrowserRouter } from "react-router-dom";
import {
  createMockMembersAreaTabContext,
  createMockMembersAreaTabHook,
  type MembersAreaTabProductContextMock,
  type MembersAreaTabHookMock,
} from "@/test/factories";

// Mock dependencies
vi.mock("../../context/ProductContext", () => ({
  useProductContext: vi.fn(),
}));

vi.mock("@/modules/members-area/hooks", () => ({
  useMembersArea: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Type aliases for mock return types
type ProductContextMock = ReturnType<typeof ProductContext.useProductContext>;
type MembersAreaHookReturn = ReturnType<typeof MembersAreaHooks.useMembersArea>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("MembersAreaTab", () => {
  let defaultContextReturn: MembersAreaTabProductContextMock;
  let defaultMembersAreaReturn: MembersAreaTabHookMock;

  beforeEach(() => {
    vi.clearAllMocks();
    defaultContextReturn = createMockMembersAreaTabContext();
    defaultMembersAreaReturn = createMockMembersAreaTabHook();
    
    // RISE V3 Justified: Partial mock - component only uses subset of context
    vi.mocked(ProductContext.useProductContext).mockReturnValue(
      defaultContextReturn as unknown as ProductContextMock
    );
    vi.mocked(MembersAreaHooks.useMembersArea).mockReturnValue(
      defaultMembersAreaReturn as unknown as MembersAreaHookReturn
    );
  });

  describe("loading state", () => {
    it("should show loading spinner when isLoading is true", () => {
      vi.mocked(MembersAreaHooks.useMembersArea).mockReturnValue(
        createMockMembersAreaTabHook({ isLoading: true }) as unknown as MembersAreaHookReturn
      );

      const { container } = renderWithRouter(<MembersAreaTab />);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should not render content when loading", () => {
      vi.mocked(MembersAreaHooks.useMembersArea).mockReturnValue(
        createMockMembersAreaTabHook({ isLoading: true }) as unknown as MembersAreaHookReturn
      );

      renderWithRouter(<MembersAreaTab />);

      expect(screen.queryByText("Área de Membros")).not.toBeInTheDocument();
    });
  });

  describe("members area disabled", () => {
    it("should render toggle card when not loading", () => {
      renderWithRouter(<MembersAreaTab />);

      expect(screen.getByText("Área de Membros")).toBeInTheDocument();
      expect(screen.getByText("Entregue conteúdo exclusivo para seus clientes")).toBeInTheDocument();
    });

    it("should not show management card when disabled", () => {
      renderWithRouter(<MembersAreaTab />);

      expect(screen.queryByText("Gerenciar Área de Membros")).not.toBeInTheDocument();
    });

    it("should show inactive label when disabled", () => {
      renderWithRouter(<MembersAreaTab />);

      expect(screen.getByText("Inativo")).toBeInTheDocument();
    });
  });

  describe("members area enabled", () => {
    beforeEach(() => {
      vi.mocked(MembersAreaHooks.useMembersArea).mockReturnValue(
        createMockMembersAreaTabHook({
          settings: { enabled: true },
          modules: [
            {
              id: "module-1",
              name: "Module 1",
              contents: [
                { id: "content-1", name: "Content 1" },
                { id: "content-2", name: "Content 2" },
              ],
            },
            {
              id: "module-2",
              name: "Module 2",
              contents: [
                { id: "content-3", name: "Content 3" },
              ],
            },
          ],
        }) as unknown as MembersAreaHookReturn
      );
    });

    it("should show active label when enabled", () => {
      renderWithRouter(<MembersAreaTab />);

      expect(screen.getByText("Ativo")).toBeInTheDocument();
    });

    it("should render management card when enabled", () => {
      renderWithRouter(<MembersAreaTab />);

      expect(screen.getByText("Gerenciar Área de Membros")).toBeInTheDocument();
    });

    it("should display correct number of modules", () => {
      renderWithRouter(<MembersAreaTab />);

      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("Módulos")).toBeInTheDocument();
    });

    it("should display correct number of contents", () => {
      renderWithRouter(<MembersAreaTab />);

      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("Conteúdos")).toBeInTheDocument();
    });
  });

  describe("toggle functionality", () => {
    it("should call updateSettings when toggle is clicked", async () => {
      const updateSettings = vi.fn().mockResolvedValue(undefined);
      vi.mocked(MembersAreaHooks.useMembersArea).mockReturnValue(
        createMockMembersAreaTabHook({ updateSettings }) as unknown as MembersAreaHookReturn
      );

      renderWithRouter(<MembersAreaTab />);

      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(updateSettings).toHaveBeenCalledWith(true);
      });
    });

    it("should prevent multiple clicks while toggling", async () => {
      const updateSettings = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      vi.mocked(MembersAreaHooks.useMembersArea).mockReturnValue(
        createMockMembersAreaTabHook({ updateSettings }) as unknown as MembersAreaHookReturn
      );

      renderWithRouter(<MembersAreaTab />);

      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);
      fireEvent.click(toggle);
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(updateSettings).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("empty modules", () => {
    it("should show 0 modules and contents when empty", () => {
      vi.mocked(MembersAreaHooks.useMembersArea).mockReturnValue(
        createMockMembersAreaTabHook({
          settings: { enabled: true },
          modules: [],
        }) as unknown as MembersAreaHookReturn
      );

      renderWithRouter(<MembersAreaTab />);

      const modulesCount = screen.getAllByText("0");
      expect(modulesCount.length).toBeGreaterThan(0);
    });
  });

  describe("hook integration", () => {
    it("should call useProductContext hook", () => {
      renderWithRouter(<MembersAreaTab />);

      expect(ProductContext.useProductContext).toHaveBeenCalledTimes(1);
    });

    it("should call useMembersArea hook with productId", () => {
      renderWithRouter(<MembersAreaTab />);

      expect(MembersAreaHooks.useMembersArea).toHaveBeenCalledWith("product-123");
    });
  });
});
