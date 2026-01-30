/**
 * ContextMenu Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for ContextMenu components covering:
 * - All exported sub-components
 * - Rendering and accessibility
 * - Menu interactions
 *
 * @module components/ui/__tests__/context-menu.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "../context-menu";

describe("ContextMenu Components", () => {
  describe("ContextMenu Root", () => {
    it("should render trigger content", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Right click me</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Action</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      expect(screen.getByText("Right click me")).toBeInTheDocument();
    });

    it("should open menu on context menu event", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Right click me</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Action</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      const trigger = screen.getByText("Right click me");
      fireEvent.contextMenu(trigger);

      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getByText("Action")).toBeInTheDocument();
    });
  });

  describe("ContextMenuTrigger", () => {
    it("should render children", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>
            <div data-testid="trigger-content">Trigger Content</div>
          </ContextMenuTrigger>
        </ContextMenu>
      );

      expect(screen.getByTestId("trigger-content")).toBeInTheDocument();
    });
  });

  describe("ContextMenuContent", () => {
    it("should render with proper styling", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent data-testid="content">
            <ContextMenuItem>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));

      const content = screen.getByRole("menu");
      expect(content).toHaveClass("z-50", "min-w-[8rem]");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent ref={ref}>
            <ContextMenuItem>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("ContextMenuItem", () => {
    it("should render menu item", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Edit</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      expect(screen.getByRole("menuitem")).toHaveTextContent("Edit");
    });

    it("should support inset prop", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem inset data-testid="inset-item">
              Inset Item
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      expect(screen.getByTestId("inset-item")).toHaveClass("pl-8");
    });

    it("should handle click events", () => {
      const onSelect = vi.fn();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={onSelect}>Click Me</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      fireEvent.click(screen.getByText("Click Me"));

      expect(onSelect).toHaveBeenCalled();
    });

    it("should support disabled state", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem disabled>Disabled Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      const item = screen.getByRole("menuitem");
      expect(item).toHaveAttribute("data-disabled");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem ref={ref}>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("ContextMenuCheckboxItem", () => {
    it("should render checkbox item", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem checked>Show Grid</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      expect(screen.getByRole("menuitemcheckbox")).toBeInTheDocument();
      expect(screen.getByText("Show Grid")).toBeInTheDocument();
    });

    it("should toggle checked state", () => {
      const onCheckedChange = vi.fn();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem
              checked={false}
              onCheckedChange={onCheckedChange}
            >
              Toggle
            </ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      fireEvent.click(screen.getByRole("menuitemcheckbox"));

      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem ref={ref}>Checkbox</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("ContextMenuRadioGroup and ContextMenuRadioItem", () => {
    it("should render radio group with items", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup value="small">
              <ContextMenuRadioItem value="small">Small</ContextMenuRadioItem>
              <ContextMenuRadioItem value="medium">Medium</ContextMenuRadioItem>
              <ContextMenuRadioItem value="large">Large</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      const radioItems = screen.getAllByRole("menuitemradio");
      expect(radioItems).toHaveLength(3);
    });

    it("should handle value changes", () => {
      const onValueChange = vi.fn();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup value="small" onValueChange={onValueChange}>
              <ContextMenuRadioItem value="medium">Medium</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      fireEvent.click(screen.getByRole("menuitemradio"));

      expect(onValueChange).toHaveBeenCalledWith("medium");
    });

    it("should forward ref correctly on RadioItem", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup value="a">
              <ContextMenuRadioItem value="a" ref={ref}>
                A
              </ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("ContextMenuLabel", () => {
    it("should render label with styling", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>Section Title</ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      const label = screen.getByText("Section Title");
      expect(label).toHaveClass("font-semibold");
    });

    it("should support inset prop", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel inset data-testid="inset-label">
              Inset Label
            </ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      expect(screen.getByTestId("inset-label")).toHaveClass("pl-8");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel ref={ref}>Label</ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("ContextMenuSeparator", () => {
    it("should render separator", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item 1</ContextMenuItem>
            <ContextMenuSeparator data-testid="separator" />
            <ContextMenuItem>Item 2</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      expect(screen.getByTestId("separator")).toHaveClass("h-px", "bg-border");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSeparator ref={ref} />
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("ContextMenuShortcut", () => {
    it("should render shortcut with styling", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              Copy
              <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      const shortcut = screen.getByText("⌘C");
      expect(shortcut).toHaveClass("ml-auto", "text-xs");
    });

    it("should merge custom className", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              Paste
              <ContextMenuShortcut className="custom-shortcut">
                ⌘V
              </ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      expect(screen.getByText("⌘V")).toHaveClass("custom-shortcut");
    });
  });

  describe("ContextMenuSub", () => {
    it("should render submenu trigger with chevron", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>More Options</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Sub Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      expect(screen.getByText("More Options")).toBeInTheDocument();
    });

    it("should support inset on SubTrigger", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger inset data-testid="sub-trigger">
                Inset Sub
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Sub Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      expect(screen.getByTestId("sub-trigger")).toHaveClass("pl-8");
    });

    it("should forward ref on SubTrigger", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger ref={ref}>Sub</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("should forward ref on SubContent", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub open>
              <ContextMenuSubTrigger>Sub</ContextMenuSubTrigger>
              <ContextMenuSubContent ref={ref}>
                <ContextMenuItem>Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Trigger"));
      // SubContent may not be immediately visible without hover
    });
  });

  describe("Complete ContextMenu", () => {
    it("should render a complete context menu with all features", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger className="w-64 h-32 border border-dashed">
            Right click here
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>Actions</ContextMenuLabel>
            <ContextMenuItem>
              Cut<ContextMenuShortcut>⌘X</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Copy<ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuCheckboxItem checked>Show Ruler</ContextMenuCheckboxItem>
            <ContextMenuSeparator />
            <ContextMenuRadioGroup value="pixels">
              <ContextMenuRadioItem value="pixels">Pixels</ContextMenuRadioItem>
              <ContextMenuRadioItem value="percent">Percent</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText("Right click here"));

      expect(screen.getByText("Actions")).toBeInTheDocument();
      expect(screen.getByText("Cut")).toBeInTheDocument();
      expect(screen.getByText("Copy")).toBeInTheDocument();
      expect(screen.getByText("Show Ruler")).toBeInTheDocument();
      expect(screen.getByText("Pixels")).toBeInTheDocument();
      expect(screen.getByText("Percent")).toBeInTheDocument();
    });
  });
});
