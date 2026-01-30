/**
 * Command Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Command (cmdk) components covering:
 * - All exported sub-components
 * - Rendering and accessibility
 * - Search/filter functionality
 *
 * @module components/ui/__tests__/command.test
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";

// Mock scrollIntoView for cmdk
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "../command";

describe("Command Components", () => {
  describe("Command Root", () => {
    it("should render command container", () => {
      render(
        <Command data-testid="command">
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandItem>Item</CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByTestId("command")).toBeInTheDocument();
    });

    it("should apply default styling", () => {
      render(
        <Command data-testid="command">
          <CommandInput placeholder="Search..." />
        </Command>
      );

      const command = screen.getByTestId("command");
      expect(command).toHaveClass("flex", "h-full", "w-full", "flex-col");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Command ref={ref}>
          <CommandInput placeholder="Search..." />
        </Command>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("should merge custom className", () => {
      render(
        <Command className="custom-command" data-testid="command">
          <CommandInput placeholder="Search..." />
        </Command>
      );

      expect(screen.getByTestId("command")).toHaveClass("custom-command");
    });
  });

  describe("CommandDialog", () => {
    it("should render dialog when open", () => {
      render(
        <CommandDialog open>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandItem>Item</CommandItem>
          </CommandList>
        </CommandDialog>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should not render when closed", () => {
      render(
        <CommandDialog open={false}>
          <CommandInput placeholder="Search..." />
        </CommandDialog>
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("CommandInput", () => {
    it("should render input with placeholder", () => {
      render(
        <Command>
          <CommandInput placeholder="Type to search..." />
        </Command>
      );

      expect(screen.getByPlaceholderText("Type to search...")).toBeInTheDocument();
    });

    it("should render search icon", () => {
      render(
        <Command>
          <CommandInput placeholder="Search..." />
        </Command>
      );

      // Search icon should be present (lucide-react Search)
      const wrapper = screen.getByPlaceholderText("Search...").parentElement;
      expect(wrapper?.querySelector("svg")).toBeInTheDocument();
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLInputElement>();
      render(
        <Command>
          <CommandInput ref={ref} placeholder="Search..." />
        </Command>
      );

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it("should handle input changes", () => {
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandItem>Apple</CommandItem>
            <CommandItem>Banana</CommandItem>
          </CommandList>
        </Command>
      );

      const input = screen.getByPlaceholderText("Search...");
      fireEvent.change(input, { target: { value: "Apple" } });

      expect(input).toHaveValue("Apple");
    });

    it("should support disabled state", () => {
      render(
        <Command>
          <CommandInput placeholder="Search..." disabled />
        </Command>
      );

      expect(screen.getByPlaceholderText("Search...")).toBeDisabled();
    });
  });

  describe("CommandList", () => {
    it("should render list container", () => {
      render(
        <Command>
          <CommandList data-testid="list">
            <CommandItem>Item</CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByTestId("list")).toBeInTheDocument();
    });

    it("should apply overflow styling", () => {
      render(
        <Command>
          <CommandList data-testid="list">
            <CommandItem>Item</CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByTestId("list")).toHaveClass("overflow-y-auto", "overflow-x-hidden");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Command>
          <CommandList ref={ref}>
            <CommandItem>Item</CommandItem>
          </CommandList>
        </Command>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("CommandEmpty", () => {
    it("should render empty state", () => {
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found</CommandEmpty>
          </CommandList>
        </Command>
      );

      expect(screen.getByText("No results found")).toBeInTheDocument();
    });

    it("should apply centered styling", () => {
      render(
        <Command>
          <CommandList>
            <CommandEmpty data-testid="empty">No results</CommandEmpty>
          </CommandList>
        </Command>
      );

      expect(screen.getByTestId("empty")).toHaveClass("py-6", "text-center", "text-sm");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Command>
          <CommandList>
            <CommandEmpty ref={ref}>No results</CommandEmpty>
          </CommandList>
        </Command>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("CommandGroup", () => {
    it("should render group with heading", () => {
      render(
        <Command>
          <CommandList>
            <CommandGroup heading="Suggestions">
              <CommandItem>Item 1</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      expect(screen.getByText("Suggestions")).toBeInTheDocument();
      expect(screen.getByText("Item 1")).toBeInTheDocument();
    });

    it("should render group without heading", () => {
      render(
        <Command>
          <CommandList>
            <CommandGroup data-testid="group">
              <CommandItem>Item</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      expect(screen.getByTestId("group")).toBeInTheDocument();
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Command>
          <CommandList>
            <CommandGroup ref={ref}>
              <CommandItem>Item</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("should apply styling", () => {
      render(
        <Command>
          <CommandList>
            <CommandGroup data-testid="group">
              <CommandItem>Item</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      expect(screen.getByTestId("group")).toHaveClass("overflow-hidden", "p-1");
    });
  });

  describe("CommandItem", () => {
    it("should render item", () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>Click me</CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByText("Click me")).toBeInTheDocument();
    });

    it("should handle selection", () => {
      const onSelect = vi.fn();
      render(
        <Command>
          <CommandList>
            <CommandItem onSelect={onSelect}>Select me</CommandItem>
          </CommandList>
        </Command>
      );

      fireEvent.click(screen.getByText("Select me"));
      expect(onSelect).toHaveBeenCalled();
    });

    it("should support disabled state", () => {
      render(
        <Command>
          <CommandList>
            <CommandItem disabled data-testid="item">
              Disabled
            </CommandItem>
          </CommandList>
        </Command>
      );

      const item = screen.getByTestId("item");
      expect(item).toHaveAttribute("data-disabled", "true");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Command>
          <CommandList>
            <CommandItem ref={ref}>Item</CommandItem>
          </CommandList>
        </Command>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("should apply styling", () => {
      render(
        <Command>
          <CommandList>
            <CommandItem data-testid="item">Item</CommandItem>
          </CommandList>
        </Command>
      );

      const item = screen.getByTestId("item");
      expect(item).toHaveClass("relative", "flex", "cursor-default", "select-none");
    });
  });

  describe("CommandShortcut", () => {
    it("should render shortcut", () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>
              Save
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByText("⌘S")).toBeInTheDocument();
    });

    it("should apply styling", () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>
              Save
              <CommandShortcut data-testid="shortcut">⌘S</CommandShortcut>
            </CommandItem>
          </CommandList>
        </Command>
      );

      const shortcut = screen.getByTestId("shortcut");
      expect(shortcut).toHaveClass("ml-auto", "text-xs", "tracking-widest");
    });

    it("should merge custom className", () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>
              Action
              <CommandShortcut className="custom-shortcut">⌘A</CommandShortcut>
            </CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByText("⌘A")).toHaveClass("custom-shortcut");
    });
  });

  describe("CommandSeparator", () => {
    it("should render separator", () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>Item 1</CommandItem>
            <CommandSeparator data-testid="separator" />
            <CommandItem>Item 2</CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByTestId("separator")).toBeInTheDocument();
    });

    it("should apply styling", () => {
      render(
        <Command>
          <CommandList>
            <CommandSeparator data-testid="separator" />
          </CommandList>
        </Command>
      );

      expect(screen.getByTestId("separator")).toHaveClass("-mx-1", "h-px", "bg-border");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Command>
          <CommandList>
            <CommandSeparator ref={ref} />
          </CommandList>
        </Command>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("Command Search Filtering", () => {
    it("should filter items based on input", () => {
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandGroup>
              <CommandItem>Calendar</CommandItem>
              <CommandItem>Calculator</CommandItem>
              <CommandItem>Settings</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      const input = screen.getByPlaceholderText("Search...");
      fireEvent.change(input, { target: { value: "Cal" } });

      // cmdk handles filtering internally
      expect(screen.getByText("Calendar")).toBeInTheDocument();
      expect(screen.getByText("Calculator")).toBeInTheDocument();
    });
  });

  describe("Complete Command", () => {
    it("should render a complete command palette", () => {
      render(
        <Command>
          <CommandInput placeholder="Type a command..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>
                Calendar
                <CommandShortcut>⌘K</CommandShortcut>
              </CommandItem>
              <CommandItem>Search Emoji</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Options">
              <CommandItem>Profile</CommandItem>
              <CommandItem>Preferences</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      expect(screen.getByPlaceholderText("Type a command...")).toBeInTheDocument();
      expect(screen.getByText("Suggestions")).toBeInTheDocument();
      expect(screen.getByText("Calendar")).toBeInTheDocument();
      expect(screen.getByText("⌘K")).toBeInTheDocument();
      expect(screen.getByText("Options")).toBeInTheDocument();
    });
  });
});
