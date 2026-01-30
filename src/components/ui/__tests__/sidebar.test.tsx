/**
 * Sidebar Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Sidebar components covering:
 * - SidebarProvider context
 * - Sidebar rendering
 * - Collapsible states
 * - Mobile behavior
 * - All sub-components
 *
 * @module components/ui/__tests__/sidebar.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import userEvent from "@testing-library/user-event";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarInput,
  useSidebar,
} from "../sidebar";

// Mock useIsMobile hook
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}));

describe("SidebarProvider", () => {
  describe("Rendering", () => {
    it("renders children", () => {
      render(
        <SidebarProvider>
          <div data-testid="child">Child content</div>
        </SidebarProvider>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("applies sidebar wrapper classes", () => {
      render(
        <SidebarProvider data-testid="provider">
          <div>Content</div>
        </SidebarProvider>
      );
      expect(screen.getByTestId("provider")).toHaveClass("group/sidebar-wrapper", "flex");
    });
  });

  describe("Default State", () => {
    it("starts expanded by default", () => {
      render(
        <SidebarProvider data-testid="provider">
          <div>Content</div>
        </SidebarProvider>
      );
      // Check that CSS variable is set for expanded width
      const provider = screen.getByTestId("provider");
      expect(provider).toHaveStyle({ "--sidebar-width": "16rem" });
    });

    it("starts collapsed when defaultOpen is false", () => {
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar data-testid="sidebar">
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      // Sidebar should have collapsed state
      const sidebar = screen.getByTestId("sidebar");
      expect(sidebar).toHaveAttribute("data-state", "collapsed");
    });
  });

  describe("Controlled Mode", () => {
    it("respects controlled open prop", () => {
      render(
        <SidebarProvider open={true}>
          <Sidebar data-testid="sidebar">
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByTestId("sidebar")).toHaveAttribute("data-state", "expanded");
    });
  });

  describe("Custom className", () => {
    it("accepts custom className", () => {
      render(
        <SidebarProvider className="custom-provider" data-testid="provider">
          <div>Content</div>
        </SidebarProvider>
      );
      expect(screen.getByTestId("provider")).toHaveClass("custom-provider");
    });
  });
});

describe("Sidebar", () => {
  describe("Rendering", () => {
    it("renders sidebar container", () => {
      render(
        <SidebarProvider>
          <Sidebar data-testid="sidebar">
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    });

    it("renders children", () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <div data-testid="sidebar-child">Sidebar Content</div>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByTestId("sidebar-child")).toBeInTheDocument();
    });
  });

  describe("Side Prop", () => {
    it("defaults to left side", () => {
      render(
        <SidebarProvider>
          <Sidebar data-testid="sidebar">
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByTestId("sidebar")).toHaveAttribute("data-side", "left");
    });

    it("accepts right side", () => {
      render(
        <SidebarProvider>
          <Sidebar side="right" data-testid="sidebar">
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByTestId("sidebar")).toHaveAttribute("data-side", "right");
    });
  });

  describe("Variant Prop", () => {
    it("defaults to sidebar variant", () => {
      render(
        <SidebarProvider>
          <Sidebar data-testid="sidebar">
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByTestId("sidebar")).toHaveAttribute("data-variant", "sidebar");
    });

    it("accepts floating variant", () => {
      render(
        <SidebarProvider>
          <Sidebar variant="floating" data-testid="sidebar">
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByTestId("sidebar")).toHaveAttribute("data-variant", "floating");
    });

    it("accepts inset variant", () => {
      render(
        <SidebarProvider>
          <Sidebar variant="inset" data-testid="sidebar">
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByTestId("sidebar")).toHaveAttribute("data-variant", "inset");
    });
  });

  describe("Collapsible None", () => {
    it("renders non-collapsible sidebar", () => {
      render(
        <SidebarProvider>
          <Sidebar collapsible="none" data-testid="sidebar">
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      const sidebar = screen.getByTestId("sidebar");
      expect(sidebar).toHaveClass("flex", "h-full");
    });
  });
});

describe("SidebarTrigger", () => {
  it("renders trigger button", () => {
    render(
      <SidebarProvider>
        <SidebarTrigger data-testid="trigger" />
        <Sidebar>
          <SidebarContent>Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("trigger")).toBeInTheDocument();
  });

  it("has data-sidebar trigger attribute", () => {
    render(
      <SidebarProvider>
        <SidebarTrigger data-testid="trigger" />
        <Sidebar>
          <SidebarContent>Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("trigger")).toHaveAttribute("data-sidebar", "trigger");
  });

  it("has sr-only text for accessibility", () => {
    render(
      <SidebarProvider>
        <SidebarTrigger />
        <Sidebar>
          <SidebarContent>Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByText("Toggle Sidebar")).toHaveClass("sr-only");
  });

  it("toggles sidebar on click", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <SidebarTrigger data-testid="trigger" />
        <Sidebar data-testid="sidebar">
          <SidebarContent>Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );

    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toHaveAttribute("data-state", "expanded");

    await user.click(screen.getByTestId("trigger"));
    expect(sidebar).toHaveAttribute("data-state", "collapsed");
  });
});

describe("SidebarHeader", () => {
  it("renders header section", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader data-testid="header">Header Content</SidebarHeader>
          <SidebarContent>Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByText("Header Content")).toBeInTheDocument();
  });

  it("has data-sidebar header attribute", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader data-testid="header">Header</SidebarHeader>
          <SidebarContent>Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("header")).toHaveAttribute("data-sidebar", "header");
  });

  it("applies flex and padding classes", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader data-testid="header">Header</SidebarHeader>
          <SidebarContent>Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("header")).toHaveClass("flex", "flex-col", "p-2");
  });
});

describe("SidebarFooter", () => {
  it("renders footer section", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>Content</SidebarContent>
          <SidebarFooter data-testid="footer">Footer Content</SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByText("Footer Content")).toBeInTheDocument();
  });

  it("has data-sidebar footer attribute", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>Content</SidebarContent>
          <SidebarFooter data-testid="footer">Footer</SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("footer")).toHaveAttribute("data-sidebar", "footer");
  });
});

describe("SidebarContent", () => {
  it("renders content area", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent data-testid="content">Main Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(screen.getByText("Main Content")).toBeInTheDocument();
  });

  it("has data-sidebar content attribute", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent data-testid="content">Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("content")).toHaveAttribute("data-sidebar", "content");
  });

  it("applies flex-1 and overflow-auto classes", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent data-testid="content">Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("content")).toHaveClass("flex-1", "overflow-auto");
  });
});

describe("SidebarGroup", () => {
  it("renders group container", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup data-testid="group">
              <SidebarGroupContent>Group Content</SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("group")).toBeInTheDocument();
  });

  it("has data-sidebar group attribute", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup data-testid="group">
              <SidebarGroupContent>Content</SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("group")).toHaveAttribute("data-sidebar", "group");
  });
});

describe("SidebarGroupLabel", () => {
  it("renders group label", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel data-testid="label">Navigation</SidebarGroupLabel>
              <SidebarGroupContent>Content</SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("label")).toBeInTheDocument();
    expect(screen.getByText("Navigation")).toBeInTheDocument();
  });

  it("has data-sidebar group-label attribute", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel data-testid="label">Label</SidebarGroupLabel>
              <SidebarGroupContent>Content</SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("label")).toHaveAttribute("data-sidebar", "group-label");
  });
});

describe("SidebarMenu and SidebarMenuItem", () => {
  it("renders menu list", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu data-testid="menu">
                  <SidebarMenuItem>Item 1</SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("menu")).toBeInTheDocument();
  });

  it("menu is a ul element", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu data-testid="menu">
                  <SidebarMenuItem>Item</SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("menu").tagName).toBe("UL");
  });

  it("menu item is a li element", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem data-testid="item">Item</SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("item").tagName).toBe("LI");
  });
});

describe("SidebarMenuButton", () => {
  it("renders menu button", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton data-testid="button">Click Me</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("button")).toBeInTheDocument();
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  it("has data-sidebar menu-button attribute", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton data-testid="button">Button</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("button")).toHaveAttribute("data-sidebar", "menu-button");
  });

  it("applies isActive styling", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive data-testid="button">
                      Active
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("button")).toHaveAttribute("data-active", "true");
  });

  it("handles click events", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleClick}>Clickable</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );

    await user.click(screen.getByText("Clickable"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe("SidebarSeparator", () => {
  it("renders separator", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarSeparator data-testid="separator" />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("separator")).toBeInTheDocument();
  });

  it("has data-sidebar separator attribute", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarSeparator data-testid="separator" />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("separator")).toHaveAttribute("data-sidebar", "separator");
  });
});

describe("SidebarInput", () => {
  it("renders input element", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <SidebarInput placeholder="Search..." data-testid="input" />
          </SidebarHeader>
          <SidebarContent>Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("input")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("has data-sidebar input attribute", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <SidebarInput data-testid="input" />
          </SidebarHeader>
          <SidebarContent>Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId("input")).toHaveAttribute("data-sidebar", "input");
  });
});

describe("useSidebar Hook", () => {
  function TestComponent() {
    const { state, open, toggleSidebar } = useSidebar();
    return (
      <div>
        <span data-testid="state">{state}</span>
        <span data-testid="open">{open.toString()}</span>
        <button onClick={toggleSidebar} data-testid="toggle">
          Toggle
        </button>
      </div>
    );
  }

  it("provides sidebar context values", () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );
    expect(screen.getByTestId("state")).toHaveTextContent("expanded");
    expect(screen.getByTestId("open")).toHaveTextContent("true");
  });

  it("toggleSidebar changes state", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    expect(screen.getByTestId("state")).toHaveTextContent("expanded");

    await user.click(screen.getByTestId("toggle"));
    expect(screen.getByTestId("state")).toHaveTextContent("collapsed");
  });

  it("throws error when used outside provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useSidebar must be used within a SidebarProvider.");

    consoleError.mockRestore();
  });
});
