/**
 * Menubar Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Menubar components covering:
 * - Rendering of all sub-components
 * - Menu interactions (open/close)
 * - Styling
 * - Multiple menus
 *
 * @module components/ui/__tests__/menubar.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSubTrigger,
  MenubarSubContent,
  MenubarSub,
  MenubarShortcut,
} from "../menubar";

describe("Menubar", () => {
  describe("Root Component", () => {
    it("renders menubar container", () => {
      render(
        <Menubar data-testid="menubar">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );
      expect(screen.getByTestId("menubar")).toBeInTheDocument();
    });

    it("applies flex and border classes", () => {
      render(
        <Menubar data-testid="menubar">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );
      expect(screen.getByTestId("menubar")).toHaveClass("flex", "h-10", "rounded-md", "border");
    });

    it("accepts custom className", () => {
      render(
        <Menubar className="custom-menubar" data-testid="menubar">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );
      expect(screen.getByTestId("menubar")).toHaveClass("custom-menubar");
    });
  });

  describe("MenubarTrigger", () => {
    it("renders trigger button", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger data-testid="trigger">File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );
      expect(screen.getByTestId("trigger")).toBeInTheDocument();
      expect(screen.getByText("File")).toBeInTheDocument();
    });

    it("opens menu on click", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem data-testid="menu-item">New File</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      fireEvent.click(screen.getByText("File"));
      expect(screen.getByTestId("menu-item")).toBeInTheDocument();
    });

    it("applies styling classes", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger data-testid="trigger">File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );
      expect(screen.getByTestId("trigger")).toHaveClass("flex", "cursor-default", "select-none");
    });
  });

  describe("MenubarItem", () => {
    it("renders menu item", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem data-testid="item">Undo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      fireEvent.click(screen.getByText("Edit"));
      expect(screen.getByTestId("item")).toBeInTheDocument();
    });

    it("triggers onClick when clicked", () => {
      const handleClick = vi.fn();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={handleClick}>Undo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      fireEvent.click(screen.getByText("Edit"));
      fireEvent.click(screen.getByText("Undo"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("applies inset class when inset prop is true", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem inset data-testid="item">
                Undo
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      fireEvent.click(screen.getByText("Edit"));
      expect(screen.getByTestId("item")).toHaveClass("pl-8");
    });
  });

  describe("MenubarSeparator", () => {
    it("renders separator", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Undo</MenubarItem>
              <MenubarSeparator data-testid="separator" />
              <MenubarItem>Redo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      fireEvent.click(screen.getByText("Edit"));
      expect(screen.getByTestId("separator")).toBeInTheDocument();
    });

    it("applies separator styling", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Undo</MenubarItem>
              <MenubarSeparator data-testid="separator" />
              <MenubarItem>Redo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      fireEvent.click(screen.getByText("Edit"));
      expect(screen.getByTestId("separator")).toHaveClass("h-px", "bg-muted");
    });
  });

  describe("MenubarLabel", () => {
    it("renders label", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel data-testid="label">Appearance</MenubarLabel>
              <MenubarItem>Zoom In</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      fireEvent.click(screen.getByText("View"));
      expect(screen.getByTestId("label")).toBeInTheDocument();
      expect(screen.getByText("Appearance")).toBeInTheDocument();
    });

    it("applies font-semibold class", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel data-testid="label">Appearance</MenubarLabel>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      fireEvent.click(screen.getByText("View"));
      expect(screen.getByTestId("label")).toHaveClass("font-semibold");
    });
  });

  describe("MenubarCheckboxItem", () => {
    it("renders checkbox item", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem data-testid="checkbox">Show Toolbar</MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      fireEvent.click(screen.getByText("View"));
      expect(screen.getByTestId("checkbox")).toBeInTheDocument();
    });

    it("calls onCheckedChange when clicked", () => {
      const handleChange = vi.fn();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked={false} onCheckedChange={handleChange}>
                Show Toolbar
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      fireEvent.click(screen.getByText("View"));
      fireEvent.click(screen.getByText("Show Toolbar"));
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe("MenubarRadioGroup and MenubarRadioItem", () => {
    it("renders radio group with items", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value="compact">
                <MenubarRadioItem value="compact" data-testid="compact">
                  Compact
                </MenubarRadioItem>
                <MenubarRadioItem value="normal" data-testid="normal">
                  Normal
                </MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      fireEvent.click(screen.getByText("View"));
      expect(screen.getByTestId("compact")).toBeInTheDocument();
      expect(screen.getByTestId("normal")).toBeInTheDocument();
    });

    it("handles radio selection", () => {
      const handleChange = vi.fn();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value="compact" onValueChange={handleChange}>
                <MenubarRadioItem value="compact">Compact</MenubarRadioItem>
                <MenubarRadioItem value="normal">Normal</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      fireEvent.click(screen.getByText("View"));
      fireEvent.click(screen.getByText("Normal"));
      expect(handleChange).toHaveBeenCalledWith("normal");
    });
  });

  describe("MenubarSub, MenubarSubTrigger, MenubarSubContent", () => {
    it("renders submenu structure", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger data-testid="sub-trigger">Share</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem data-testid="sub-item">Email</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      fireEvent.click(screen.getByText("File"));
      expect(screen.getByTestId("sub-trigger")).toBeInTheDocument();
    });

    it("submenu trigger has chevron icon", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger data-testid="sub-trigger">Share</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>Email</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      fireEvent.click(screen.getByText("File"));
      const subTrigger = screen.getByTestId("sub-trigger");
      expect(subTrigger.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("MenubarShortcut", () => {
    it("renders keyboard shortcut", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                Undo
                <MenubarShortcut data-testid="shortcut">⌘Z</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      fireEvent.click(screen.getByText("Edit"));
      expect(screen.getByTestId("shortcut")).toBeInTheDocument();
      expect(screen.getByText("⌘Z")).toBeInTheDocument();
    });

    it("applies muted styling", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                Undo
                <MenubarShortcut data-testid="shortcut">⌘Z</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      fireEvent.click(screen.getByText("Edit"));
      expect(screen.getByTestId("shortcut")).toHaveClass("text-muted-foreground", "text-xs");
    });
  });

  describe("Keyboard Navigation", () => {
    it("opens menu with keyboard", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger data-testid="trigger">File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem data-testid="item">New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      const trigger = screen.getByTestId("trigger");
      trigger.focus();
      fireEvent.keyDown(trigger, { key: "Enter" });
      expect(screen.getByTestId("item")).toBeInTheDocument();
    });
  });

  describe("Multiple Menus", () => {
    it("renders multiple menus", () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Undo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Zoom</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      expect(screen.getByText("File")).toBeInTheDocument();
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.getByText("View")).toBeInTheDocument();
    });
  });
});
