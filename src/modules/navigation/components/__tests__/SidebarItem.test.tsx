/**
 * SidebarItem Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - UI Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SidebarItem } from "../Sidebar/SidebarItem";
import { Home, ExternalLink, Settings } from "lucide-react";
import type { NavItemConfig } from "../../types/navigation.types";
import type { AppRole } from "@/hooks/usePermissions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock usePermissions - use valid AppRole type
const mockRole: AppRole = "seller";
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ role: mockRole }),
}));

// Mock GuardedLink
vi.mock("@/components/navigation/GuardedLink", () => ({
  GuardedLink: vi.fn(({ to, children, onClick, ...props }) => (
    <a href={to} onClick={onClick} {...props}>
      {children}
    </a>
  )),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithProviders = (ui: React.ReactElement, initialRoute = "/") => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("SidebarItem", () => {
  const createRouteItem = (overrides: Partial<NavItemConfig> = {}): NavItemConfig => ({
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    variant: { type: "route", path: "/dashboard", exact: true },
    ...overrides,
  });

  const createExternalItem = (): NavItemConfig => ({
    id: "docs",
    label: "Documentação",
    icon: ExternalLink,
    variant: { type: "external", url: "https://docs.example.com" },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Route Item Rendering", () => {
    it("should render route item with label", () => {
      renderWithProviders(
        <SidebarItem item={createRouteItem()} showLabels={true} />
      );

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("should render icon", () => {
      const { container } = renderWithProviders(
        <SidebarItem item={createRouteItem()} showLabels={true} />
      );

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should hide label when showLabels is false", () => {
      renderWithProviders(
        <SidebarItem item={createRouteItem()} showLabels={false} />
      );

      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    });

    it("should set title when showLabels is false", () => {
      renderWithProviders(
        <SidebarItem item={createRouteItem()} showLabels={false} />
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("title", "Dashboard");
    });
  });

  describe("External Link Rendering", () => {
    it("should render external link", () => {
      renderWithProviders(
        <SidebarItem item={createExternalItem()} showLabels={true} />
      );

      expect(screen.getByText("Documentação")).toBeInTheDocument();
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://docs.example.com");
    });

    it("should have target=_blank for external links", () => {
      renderWithProviders(
        <SidebarItem item={createExternalItem()} showLabels={true} />
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Active State", () => {
    it("should show active indicator when route matches", () => {
      const { container } = renderWithProviders(
        <SidebarItem item={createRouteItem()} showLabels={true} />,
        "/dashboard"
      );

      // Active indicator strip
      const indicator = container.querySelector(".bg-primary.rounded-r-full");
      expect(indicator).toBeInTheDocument();
    });

    it("should not show active indicator when route does not match", () => {
      const { container } = renderWithProviders(
        <SidebarItem item={createRouteItem()} showLabels={true} />,
        "/other-route"
      );

      const indicator = container.querySelector(".bg-primary.rounded-r-full");
      expect(indicator).not.toBeInTheDocument();
    });
  });

  describe("Coming Soon Badge", () => {
    it("should show 'Em Breve' badge when role matches comingSoonForRoles", () => {
      const item = createRouteItem({
        comingSoonForRoles: ["seller"],
      });

      renderWithProviders(<SidebarItem item={item} showLabels={true} />);

      expect(screen.getByText("Em Breve")).toBeInTheDocument();
    });

    it("should not show badge when role does not match", () => {
      const item = createRouteItem({
        comingSoonForRoles: ["admin"],
      });

      renderWithProviders(<SidebarItem item={item} showLabels={true} />);

      expect(screen.queryByText("Em Breve")).not.toBeInTheDocument();
    });

    it("should not show badge when comingSoonForRoles is undefined", () => {
      renderWithProviders(
        <SidebarItem item={createRouteItem()} showLabels={true} />
      );

      expect(screen.queryByText("Em Breve")).not.toBeInTheDocument();
    });
  });

  describe("Navigation Callback", () => {
    it("should call onNavigate when clicking route item", () => {
      const onNavigate = vi.fn();
      renderWithProviders(
        <SidebarItem
          item={createRouteItem()}
          showLabels={true}
          onNavigate={onNavigate}
        />
      );

      fireEvent.click(screen.getByRole("link"));

      expect(onNavigate).toHaveBeenCalledTimes(1);
    });
  });

  describe("Group Variant", () => {
    it("should return null for group variant", () => {
      const groupItem: NavItemConfig = {
        id: "settings-group",
        label: "Configurações",
        icon: Settings,
        variant: {
          type: "group",
          children: [],
        },
      };

      const { container } = renderWithProviders(
        <SidebarItem item={groupItem} showLabels={true} />
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
