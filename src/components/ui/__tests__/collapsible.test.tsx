/**
 * Collapsible Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Collapsible components using fireEvent
 *
 * @module components/ui/__tests__/collapsible.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/test/utils";
import { useState } from "react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../collapsible";

describe("Collapsible", () => {
  describe("Rendering", () => {
    it("renders collapsible container", () => {
      render(
        <Collapsible data-testid="collapsible">
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByTestId("collapsible")).toBeInTheDocument();
    });

    it("renders trigger button", () => {
      render(
        <Collapsible>
          <CollapsibleTrigger data-testid="trigger">Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByTestId("trigger")).toBeInTheDocument();
    });

    it("content is hidden by default", () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Hidden Content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.queryByText("Hidden Content")).not.toBeInTheDocument();
    });
  });

  describe("Uncontrolled Mode", () => {
    it("toggles content visibility on click", async () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Visible Content</CollapsibleContent>
        </Collapsible>
      );

      expect(screen.queryByText("Visible Content")).not.toBeInTheDocument();
      fireEvent.click(screen.getByText("Toggle"));
      expect(screen.getByText("Visible Content")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Toggle"));
      await waitFor(() => {
        expect(screen.queryByText("Visible Content")).not.toBeInTheDocument();
      });
    });

    it("starts open when defaultOpen is true", () => {
      render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Initially Visible</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByText("Initially Visible")).toBeInTheDocument();
    });
  });

  describe("Controlled Mode", () => {
    function ControlledCollapsible() {
      const [open, setOpen] = useState(false);
      return (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger data-testid="trigger">Toggle</CollapsibleTrigger>
          <CollapsibleContent>Controlled Content</CollapsibleContent>
          <button data-testid="external" onClick={() => setOpen(!open)}>
            External
          </button>
        </Collapsible>
      );
    }

    it("respects controlled open state", async () => {
      render(<ControlledCollapsible />);
      expect(screen.queryByText("Controlled Content")).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId("external"));
      expect(screen.getByText("Controlled Content")).toBeInTheDocument();
    });

    it("calls onOpenChange callback", () => {
      const handleOpenChange = vi.fn();
      render(
        <Collapsible onOpenChange={handleOpenChange}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      fireEvent.click(screen.getByText("Toggle"));
      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe("Disabled State", () => {
    it("trigger has disabled attribute", () => {
      render(
        <Collapsible disabled>
          <CollapsibleTrigger data-testid="trigger">Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByTestId("trigger")).toBeDisabled();
    });
  });

  describe("Data Attributes", () => {
    it("has data-state closed when closed", () => {
      render(
        <Collapsible data-testid="collapsible">
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByTestId("collapsible")).toHaveAttribute("data-state", "closed");
    });

    it("has data-state open when open", () => {
      render(
        <Collapsible data-testid="collapsible">
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      fireEvent.click(screen.getByText("Toggle"));
      expect(screen.getByTestId("collapsible")).toHaveAttribute("data-state", "open");
    });
  });

  describe("Props Forwarding", () => {
    it("forwards className to Collapsible", () => {
      render(
        <Collapsible className="custom-collapsible" data-testid="collapsible">
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByTestId("collapsible")).toHaveClass("custom-collapsible");
    });

    it("forwards className to CollapsibleTrigger", () => {
      render(
        <Collapsible>
          <CollapsibleTrigger className="custom-trigger" data-testid="trigger">
            Toggle
          </CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByTestId("trigger")).toHaveClass("custom-trigger");
    });
  });

  describe("asChild Pattern", () => {
    it("renders trigger as custom element with asChild", () => {
      render(
        <Collapsible>
          <CollapsibleTrigger asChild>
            <button type="button" data-testid="custom-button">
              Custom Button
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByTestId("custom-button")).toBeInTheDocument();
    });
  });
});
