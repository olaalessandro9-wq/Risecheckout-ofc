/**
 * NavigationMenu Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for NavigationMenu components covering:
 * - Rendering of all sub-components
 * - Trigger interactions
 * - Content display
 * - Accessibility
 * - Styling variants
 *
 * @module components/ui/__tests__/navigation-menu.test
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "../navigation-menu";

describe("NavigationMenu", () => {
  describe("Root Component", () => {
    it("renders navigation menu container", () => {
      render(
        <NavigationMenu data-testid="nav-menu">
          <NavigationMenuList>
            <NavigationMenuItem>Item</NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(screen.getByTestId("nav-menu")).toBeInTheDocument();
    });

    it("applies flex layout classes", () => {
      render(
        <NavigationMenu data-testid="nav-menu">
          <NavigationMenuList>
            <NavigationMenuItem>Item</NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(screen.getByTestId("nav-menu")).toHaveClass("flex", "items-center", "justify-center");
    });

    it("accepts custom className", () => {
      render(
        <NavigationMenu className="custom-nav" data-testid="nav-menu">
          <NavigationMenuList>
            <NavigationMenuItem>Item</NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(screen.getByTestId("nav-menu")).toHaveClass("custom-nav");
    });
  });

  describe("NavigationMenuList", () => {
    it("renders as list container", () => {
      render(
        <NavigationMenu>
          <NavigationMenuList data-testid="nav-list">
            <NavigationMenuItem>Item</NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(screen.getByTestId("nav-list")).toBeInTheDocument();
    });

    it("applies group and flex classes", () => {
      render(
        <NavigationMenu>
          <NavigationMenuList data-testid="nav-list">
            <NavigationMenuItem>Item</NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(screen.getByTestId("nav-list")).toHaveClass("group", "flex", "items-center");
    });
  });

  describe("NavigationMenuItem", () => {
    it("renders menu item", () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem data-testid="nav-item">Test Item</NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(screen.getByTestId("nav-item")).toBeInTheDocument();
    });
  });

  describe("NavigationMenuTrigger", () => {
    it("renders trigger button", () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-testid="trigger">Menu</NavigationMenuTrigger>
              <NavigationMenuContent>Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(screen.getByTestId("trigger")).toBeInTheDocument();
    });

    it("displays trigger text", () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(screen.getByText("Products")).toBeInTheDocument();
    });

    it("renders chevron icon", () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-testid="trigger">Menu</NavigationMenuTrigger>
              <NavigationMenuContent>Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger.querySelector("svg")).toBeInTheDocument();
    });

    it("applies trigger styling classes", () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-testid="trigger">Menu</NavigationMenuTrigger>
              <NavigationMenuContent>Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveClass("group", "inline-flex");
    });
    it("opens content on hover/click", async () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div data-testid="content">Dropdown Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText("Menu");
      fireEvent.click(trigger);

      // Content should be in DOM after click
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });
  });

  describe("NavigationMenuContent", () => {
    it("renders content when trigger is activated", async () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div data-testid="dropdown-content">Content Here</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      fireEvent.click(screen.getByText("Menu"));
      expect(screen.getByTestId("dropdown-content")).toBeInTheDocument();
    });
  });

  describe("NavigationMenuLink", () => {
    it("renders navigation link", () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/test" data-testid="nav-link">
                Test Link
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(screen.getByTestId("nav-link")).toBeInTheDocument();
    });
  });

  describe("navigationMenuTriggerStyle", () => {
    it("returns valid class string", () => {
      const classes = navigationMenuTriggerStyle();
      expect(typeof classes).toBe("string");
      expect(classes.length).toBeGreaterThan(0);
    });

    it("includes expected styling classes", () => {
      const classes = navigationMenuTriggerStyle();
      expect(classes).toContain("inline-flex");
      expect(classes).toContain("h-10");
      expect(classes).toContain("rounded-md");
    });
  });

  describe("Accessibility", () => {
    it("trigger is keyboard accessible", async () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-testid="trigger">Menu</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div data-testid="content">Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByTestId("trigger");
      trigger.focus();
      expect(trigger).toHaveFocus();

      fireEvent.keyDown(trigger, { key: "Enter" });
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });
  });

  describe("Props Forwarding", () => {
    it("forwards additional props to NavigationMenu", () => {
      render(
        <NavigationMenu data-testid="nav" id="main-nav" aria-label="Main navigation">
          <NavigationMenuList>
            <NavigationMenuItem>Item</NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      const nav = screen.getByTestId("nav");
      expect(nav).toHaveAttribute("id", "main-nav");
      expect(nav).toHaveAttribute("aria-label", "Main navigation");
    });
  });
});
