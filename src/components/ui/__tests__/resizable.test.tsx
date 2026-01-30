/**
 * Resizable Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Resizable components covering:
 * - ResizablePanelGroup rendering
 * - ResizablePanel rendering
 * - ResizableHandle with/without handle icon
 * - Direction (horizontal/vertical)
 * - Styling
 *
 * @module components/ui/__tests__/resizable.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../resizable";

describe("ResizablePanelGroup", () => {
  describe("Rendering", () => {
    it("renders panel group container", () => {
      render(
        <ResizablePanelGroup direction="horizontal" data-testid="panel-group">
          <ResizablePanel>Panel 1</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Panel 2</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(screen.getByTestId("panel-group")).toBeInTheDocument();
    });

    it("renders children panels", () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>
            <div data-testid="panel-1">Panel 1 Content</div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>
            <div data-testid="panel-2">Panel 2 Content</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(screen.getByTestId("panel-1")).toBeInTheDocument();
      expect(screen.getByTestId("panel-2")).toBeInTheDocument();
    });
  });

  describe("Direction", () => {
    it("renders horizontal layout", () => {
      render(
        <ResizablePanelGroup direction="horizontal" data-testid="panel-group">
          <ResizablePanel>Panel 1</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Panel 2</ResizablePanel>
        </ResizablePanelGroup>
      );
      const group = screen.getByTestId("panel-group");
      expect(group).toHaveAttribute("data-panel-group-direction", "horizontal");
    });

    it("renders vertical layout", () => {
      render(
        <ResizablePanelGroup direction="vertical" data-testid="panel-group">
          <ResizablePanel>Panel 1</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Panel 2</ResizablePanel>
        </ResizablePanelGroup>
      );
      const group = screen.getByTestId("panel-group");
      expect(group).toHaveAttribute("data-panel-group-direction", "vertical");
    });
  });

  describe("Styling", () => {
    it("applies flex layout classes", () => {
      render(
        <ResizablePanelGroup direction="horizontal" data-testid="panel-group">
          <ResizablePanel>Panel</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(screen.getByTestId("panel-group")).toHaveClass("flex", "h-full", "w-full");
    });

    it("accepts custom className", () => {
      render(
        <ResizablePanelGroup direction="horizontal" className="custom-group" data-testid="panel-group">
          <ResizablePanel>Panel</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(screen.getByTestId("panel-group")).toHaveClass("custom-group");
    });
  });
});

describe("ResizablePanel", () => {
  describe("Rendering", () => {
    it("renders panel with content", () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel data-testid="panel">
            <div>Panel Content</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(screen.getByTestId("panel")).toBeInTheDocument();
      expect(screen.getByText("Panel Content")).toBeInTheDocument();
    });
  });

  describe("Default Size", () => {
    it("accepts defaultSize prop", () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={25} data-testid="panel-1">
            Panel 1
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={75} data-testid="panel-2">
            Panel 2
          </ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(screen.getByTestId("panel-1")).toBeInTheDocument();
      expect(screen.getByTestId("panel-2")).toBeInTheDocument();
    });
  });

  describe("Min/Max Size", () => {
    it("accepts minSize prop", () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel minSize={20} data-testid="panel">
            Panel
          </ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(screen.getByTestId("panel")).toBeInTheDocument();
    });

    it("accepts maxSize prop", () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel maxSize={80} data-testid="panel">
            Panel
          </ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(screen.getByTestId("panel")).toBeInTheDocument();
    });
  });
});

describe("ResizableHandle", () => {
  describe("Rendering", () => {
    it("renders resize handle", () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>Panel 1</ResizablePanel>
          <ResizableHandle data-testid="handle" />
          <ResizablePanel>Panel 2</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(screen.getByTestId("handle")).toBeInTheDocument();
    });
  });

  describe("Handle Icon", () => {
    it("renders without handle icon by default", () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>Panel 1</ResizablePanel>
          <ResizableHandle data-testid="handle" />
          <ResizablePanel>Panel 2</ResizablePanel>
        </ResizablePanelGroup>
      );
      const handle = screen.getByTestId("handle");
      expect(handle.querySelector("svg")).toBeNull();
    });

    it("renders with handle icon when withHandle is true", () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>Panel 1</ResizablePanel>
          <ResizableHandle withHandle data-testid="handle" />
          <ResizablePanel>Panel 2</ResizablePanel>
        </ResizablePanelGroup>
      );
      const handle = screen.getByTestId("handle");
      expect(handle.querySelector("svg")).toBeInTheDocument();
    });

    it("handle icon container has border styling", () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>Panel 1</ResizablePanel>
          <ResizableHandle withHandle data-testid="handle" />
          <ResizablePanel>Panel 2</ResizablePanel>
        </ResizablePanelGroup>
      );
      const handle = screen.getByTestId("handle");
      const iconContainer = handle.querySelector("div");
      expect(iconContainer).toHaveClass("border", "rounded-sm");
    });
  });

  describe("Styling", () => {
    it("applies relative and flex classes", () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>Panel 1</ResizablePanel>
          <ResizableHandle data-testid="handle" />
          <ResizablePanel>Panel 2</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(screen.getByTestId("handle")).toHaveClass("relative", "flex");
    });

    it("applies bg-border class", () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>Panel 1</ResizablePanel>
          <ResizableHandle data-testid="handle" />
          <ResizablePanel>Panel 2</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(screen.getByTestId("handle")).toHaveClass("bg-border");
    });

    it("accepts custom className", () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>Panel 1</ResizablePanel>
          <ResizableHandle className="custom-handle" data-testid="handle" />
          <ResizablePanel>Panel 2</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(screen.getByTestId("handle")).toHaveClass("custom-handle");
    });
  });

  describe("Focus Styling", () => {
    it("has focus-visible ring classes", () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>Panel 1</ResizablePanel>
          <ResizableHandle data-testid="handle" />
          <ResizablePanel>Panel 2</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(screen.getByTestId("handle")).toHaveClass("focus-visible:outline-none", "focus-visible:ring-1");
    });
  });
});

describe("Complex Layouts", () => {
  it("renders three-panel horizontal layout", () => {
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25}>
          <div data-testid="left">Left</div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>
          <div data-testid="center">Center</div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={25}>
          <div data-testid="right">Right</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    );

    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByTestId("center")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });

  it("renders nested panel groups", () => {
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel>
              <div data-testid="top-left">Top Left</div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel>
              <div data-testid="bottom-left">Bottom Left</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          <div data-testid="right">Right</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    );

    expect(screen.getByTestId("top-left")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-left")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });
});
