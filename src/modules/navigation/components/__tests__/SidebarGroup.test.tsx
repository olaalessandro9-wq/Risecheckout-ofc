/**
 * SidebarGroup Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - UI Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SidebarGroup } from "../Sidebar/SidebarGroup";
import { Settings, Bell, Lock, User } from "lucide-react";
import type { NavItemConfig, NavItemGroupVariant } from "../../types/navigation.types";

// Mock GuardedLink
vi.mock("@/components/navigation/GuardedLink", () => ({
  GuardedLink: vi.fn(({ to, children, onClick, ...props }) => (
    <a href={to} onClick={onClick} {...props}>
      {children}
    </a>
  )),
}));

const renderWithRouter = (ui: React.ReactElement, initialRoute = "/") => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
  );
};

describe("SidebarGroup", () => {
  const createGroupItem = (): NavItemConfig & { variant: NavItemGroupVariant } => ({
    id: "settings",
    label: "Configurações",
    icon: Settings,
    variant: {
      type: "group",
      children: [
        {
          id: "notifications",
          label: "Notificações",
          icon: Bell,
          variant: { type: "route", path: "/settings/notifications", exact: true },
        },
        {
          id: "security",
          label: "Segurança",
          icon: Lock,
          variant: { type: "route", path: "/settings/security", exact: true },
        },
        {
          id: "profile",
          label: "Perfil",
          icon: User,
          variant: { type: "route", path: "/settings/profile", exact: true },
        },
      ],
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Collapsed State", () => {
    it("should render group label", () => {
      renderWithRouter(
        <SidebarGroup
          item={createGroupItem()}
          showLabels={true}
          isExpanded={false}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getByText("Configurações")).toBeInTheDocument();
    });

    it("should render group icon", () => {
      const { container } = renderWithRouter(
        <SidebarGroup
          item={createGroupItem()}
          showLabels={true}
          isExpanded={false}
          onToggle={vi.fn()}
        />
      );

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should not show children when collapsed", () => {
      renderWithRouter(
        <SidebarGroup
          item={createGroupItem()}
          showLabels={true}
          isExpanded={false}
          onToggle={vi.fn()}
        />
      );

      expect(screen.queryByText("Notificações")).not.toBeInTheDocument();
      expect(screen.queryByText("Segurança")).not.toBeInTheDocument();
    });

    it("should have chevron rotated when collapsed", () => {
      const { container } = renderWithRouter(
        <SidebarGroup
          item={createGroupItem()}
          showLabels={true}
          isExpanded={false}
          onToggle={vi.fn()}
        />
      );

      const chevron = container.querySelector(".-rotate-90");
      expect(chevron).toBeInTheDocument();
    });
  });

  describe("Expanded State", () => {
    it("should show all children when expanded", () => {
      renderWithRouter(
        <SidebarGroup
          item={createGroupItem()}
          showLabels={true}
          isExpanded={true}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getByText("Notificações")).toBeInTheDocument();
      expect(screen.getByText("Segurança")).toBeInTheDocument();
      expect(screen.getByText("Perfil")).toBeInTheDocument();
    });

    it("should have chevron not rotated when expanded", () => {
      const { container } = renderWithRouter(
        <SidebarGroup
          item={createGroupItem()}
          showLabels={true}
          isExpanded={true}
          onToggle={vi.fn()}
        />
      );

      const chevron = container.querySelector(".rotate-0");
      expect(chevron).toBeInTheDocument();
    });

    it("should render child links with correct hrefs", () => {
      renderWithRouter(
        <SidebarGroup
          item={createGroupItem()}
          showLabels={true}
          isExpanded={true}
          onToggle={vi.fn()}
        />
      );

      const links = screen.getAllByRole("link");
      expect(links[0]).toHaveAttribute("href", "/settings/notifications");
      expect(links[1]).toHaveAttribute("href", "/settings/security");
      expect(links[2]).toHaveAttribute("href", "/settings/profile");
    });
  });

  describe("Toggle Interaction", () => {
    it("should call onToggle when header is clicked", () => {
      const onToggle = vi.fn();
      renderWithRouter(
        <SidebarGroup
          item={createGroupItem()}
          showLabels={true}
          isExpanded={false}
          onToggle={onToggle}
        />
      );

      fireEvent.click(screen.getByText("Configurações"));

      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe("Active Child Highlighting", () => {
    it("should highlight group when child is active", () => {
      const { container } = renderWithRouter(
        <SidebarGroup
          item={createGroupItem()}
          showLabels={true}
          isExpanded={true}
          onToggle={vi.fn()}
        />,
        "/settings/notifications"
      );

      // Active indicator on parent
      const parentIndicator = container.querySelector(
        "button .bg-primary.rounded-r-full"
      );
      expect(parentIndicator).toBeInTheDocument();
    });

    it("should not highlight group when no child is active", () => {
      const { container } = renderWithRouter(
        <SidebarGroup
          item={createGroupItem()}
          showLabels={true}
          isExpanded={true}
          onToggle={vi.fn()}
        />,
        "/other-route"
      );

      const parentIndicator = container.querySelector(
        "button .bg-primary.rounded-r-full"
      );
      expect(parentIndicator).not.toBeInTheDocument();
    });
  });

  describe("Label Visibility", () => {
    it("should hide labels when showLabels is false", () => {
      renderWithRouter(
        <SidebarGroup
          item={createGroupItem()}
          showLabels={false}
          isExpanded={false}
          onToggle={vi.fn()}
        />
      );

      expect(screen.queryByText("Configurações")).not.toBeInTheDocument();
    });

    it("should set title when showLabels is false", () => {
      renderWithRouter(
        <SidebarGroup
          item={createGroupItem()}
          showLabels={false}
          isExpanded={false}
          onToggle={vi.fn()}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Configurações");
    });
  });

  describe("Navigation Callback", () => {
    it("should call onNavigate when child is clicked", () => {
      const onNavigate = vi.fn();
      renderWithRouter(
        <SidebarGroup
          item={createGroupItem()}
          showLabels={true}
          isExpanded={true}
          onToggle={vi.fn()}
          onNavigate={onNavigate}
        />
      );

      fireEvent.click(screen.getByText("Notificações"));

      expect(onNavigate).toHaveBeenCalledTimes(1);
    });
  });
});
