/**
 * useCheckoutEditor - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests checkout editor state management and actions.
 * 
 * @module hooks/__tests__/useCheckoutEditor.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCheckoutEditor } from "../useCheckoutEditor";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { CheckoutComponent, CheckoutDesign } from "@/types/checkoutEditor";

// Helper to create valid timer component
const createTimerComponent = (id: string): CheckoutComponent => ({
  id,
  type: "timer",
  content: {
    minutes: 15,
    seconds: 0,
    timerColor: "#EF4444",
    textColor: "#FFFFFF",
    activeText: "Oferta limitada",
    finishedText: "Finalizado",
    fixedTop: false,
  } as CheckoutComponent["content"],
});

// Helper to create valid text component
const createTextComponent = (id: string): CheckoutComponent => ({
  id,
  type: "text",
  content: {
    text: "Test text",
    fontSize: 16,
    color: "#000000",
    alignment: "left",
  } as CheckoutComponent["content"],
});

// Mock DEFAULT_CHECKOUT_DESIGN
vi.mock("../checkout/defaultCheckoutDesign", () => ({
  DEFAULT_CHECKOUT_DESIGN: {
    design: {
      theme: "light",
      font: "Inter",
      colors: {},
    },
    topComponents: [],
    bottomComponents: [],
  },
}));

describe("useCheckoutEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have desktop viewMode by default", () => {
      const { result } = renderHook(() => useCheckoutEditor());
      expect(result.current.viewMode).toBe("desktop");
    });

    it("should not be in preview mode by default", () => {
      const { result } = renderHook(() => useCheckoutEditor());
      expect(result.current.isPreviewMode).toBe(false);
    });

    it("should have components as default activeTab", () => {
      const { result } = renderHook(() => useCheckoutEditor());
      expect(result.current.activeTab).toBe("components");
    });

    it("should have no selected component by default", () => {
      const { result } = renderHook(() => useCheckoutEditor());
      expect(result.current.selectedComponent).toBeNull();
    });

    it("should not be dirty by default", () => {
      const { result } = renderHook(() => useCheckoutEditor());
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe("view mode", () => {
    it("should update viewMode", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      act(() => {
        result.current.setViewMode("mobile");
      });

      expect(result.current.viewMode).toBe("mobile");
    });
  });

  describe("preview mode", () => {
    it("should toggle preview mode", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      act(() => {
        result.current.setIsPreviewMode(true);
      });

      expect(result.current.isPreviewMode).toBe(true);
    });
  });

  describe("active tab", () => {
    it("should update active tab", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      act(() => {
        result.current.setActiveTab("settings");
      });

      expect(result.current.activeTab).toBe("settings");
    });
  });

  describe("design updates", () => {
    it("should update design and set dirty", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      const newDesign = {
        theme: "dark",
        font: "Roboto",
        colors: {},
      } as CheckoutDesign;

      act(() => {
        result.current.handleUpdateDesign(newDesign);
      });

      expect(result.current.customization.design.theme).toBe("dark");
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe("component selection", () => {
    it("should select component", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      act(() => {
        result.current.setSelectedComponent("component-123");
      });

      expect(result.current.selectedComponent).toBe("component-123");
    });

    it("should return null for selectedComponentData when no component selected", () => {
      const { result } = renderHook(() => useCheckoutEditor());
      expect(result.current.selectedComponentData).toBeNull();
    });
  });

  describe("component updates", () => {
    it("should update component in topComponents", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      act(() => {
        result.current.setCustomization((prev) => ({
          ...prev,
          topComponents: [createTimerComponent("comp-1")],
        }));
      });

      act(() => {
        result.current.handleUpdateComponent("comp-1", { minutes: 20 });
      });

      const content = result.current.customization.topComponents[0].content as Record<string, unknown>;
      expect(content.minutes).toBe(20);
      expect(result.current.isDirty).toBe(true);
    });

    it("should update component in bottomComponents", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      act(() => {
        result.current.setCustomization((prev) => ({
          ...prev,
          bottomComponents: [createTextComponent("comp-2")],
        }));
      });

      act(() => {
        result.current.handleUpdateComponent("comp-2", { text: "World" });
      });

      const content = result.current.customization.bottomComponents[0].content as Record<string, unknown>;
      expect(content.text).toBe("World");
    });
  });

  describe("component removal", () => {
    it("should remove component from topComponents", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      act(() => {
        result.current.setCustomization((prev) => ({
          ...prev,
          topComponents: [
            createTimerComponent("comp-1"),
            createTextComponent("comp-2"),
          ],
        }));
      });

      act(() => {
        result.current.handleRemoveComponent("comp-1");
      });

      expect(result.current.customization.topComponents).toHaveLength(1);
      expect(result.current.customization.topComponents[0].id).toBe("comp-2");
    });

    it("should clear selection when selected component is removed", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      act(() => {
        result.current.setCustomization((prev) => ({
          ...prev,
          topComponents: [createTimerComponent("comp-1")],
        }));
        result.current.setSelectedComponent("comp-1");
      });

      act(() => {
        result.current.handleRemoveComponent("comp-1");
      });

      expect(result.current.selectedComponent).toBeNull();
    });
  });

  describe("component duplication", () => {
    it("should duplicate component in topComponents", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      act(() => {
        result.current.setCustomization((prev) => ({
          ...prev,
          topComponents: [createTimerComponent("comp-1")],
        }));
      });

      act(() => {
        result.current.handleDuplicateComponent("comp-1");
      });

      expect(result.current.customization.topComponents).toHaveLength(2);
      const content = result.current.customization.topComponents[1].content as Record<string, unknown>;
      expect(content.minutes).toBe(15);
      expect(result.current.customization.topComponents[1].id).not.toBe("comp-1");
    });
  });

  describe("component movement", () => {
    it("should move component up", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      act(() => {
        result.current.setCustomization((prev) => ({
          ...prev,
          topComponents: [
            createTimerComponent("comp-1"),
            createTextComponent("comp-2"),
          ],
        }));
      });

      act(() => {
        result.current.handleMoveComponent("comp-2", "up");
      });

      expect(result.current.customization.topComponents[0].id).toBe("comp-2");
      expect(result.current.customization.topComponents[1].id).toBe("comp-1");
    });

    it("should move component down", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      act(() => {
        result.current.setCustomization((prev) => ({
          ...prev,
          topComponents: [
            createTimerComponent("comp-1"),
            createTextComponent("comp-2"),
          ],
        }));
      });

      act(() => {
        result.current.handleMoveComponent("comp-1", "down");
      });

      expect(result.current.customization.topComponents[0].id).toBe("comp-2");
      expect(result.current.customization.topComponents[1].id).toBe("comp-1");
    });

    it("should not move first component up", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      act(() => {
        result.current.setCustomization((prev) => ({
          ...prev,
          topComponents: [
            createTimerComponent("comp-1"),
            createTextComponent("comp-2"),
          ],
        }));
      });

      act(() => {
        result.current.handleMoveComponent("comp-1", "up");
      });

      expect(result.current.customization.topComponents[0].id).toBe("comp-1");
    });
  });

  describe("drag and drop", () => {
    it("should set activeId on drag start", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      const event = { active: { id: "comp-1" } } as DragStartEvent;

      act(() => {
        result.current.handleDragStart(event);
      });

      expect(result.current.activeId).toBe("comp-1");
    });

    it("should clear activeId on drag end", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      act(() => {
        result.current.handleDragStart({ active: { id: "comp-1" } } as DragStartEvent);
      });

      act(() => {
        result.current.handleDragEnd({
          active: { id: "comp-1" },
          over: null,
        } as unknown as DragEndEvent);
      });

      expect(result.current.activeId).toBeNull();
    });

    it("should add new component to top-drop-zone", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      act(() => {
        result.current.handleDragEnd({
          active: { id: "timer" },
          over: { id: "top-drop-zone" },
        } as unknown as DragEndEvent);
      });

      expect(result.current.customization.topComponents).toHaveLength(1);
      expect(result.current.customization.topComponents[0].type).toBe("timer");
    });

    it("should add new component to bottom-drop-zone", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      act(() => {
        result.current.handleDragEnd({
          active: { id: "timer" },
          over: { id: "bottom-drop-zone" },
        } as unknown as DragEndEvent);
      });

      expect(result.current.customization.bottomComponents).toHaveLength(1);
    });

    it("should move existing component between zones", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      act(() => {
        result.current.setCustomization((prev) => ({
          ...prev,
          topComponents: [createTimerComponent("component-existing")],
        }));
      });

      act(() => {
        result.current.handleDragEnd({
          active: { id: "component-existing" },
          over: { id: "bottom-drop-zone" },
        } as unknown as DragEndEvent);
      });

      expect(result.current.customization.topComponents).toHaveLength(0);
      expect(result.current.customization.bottomComponents).toHaveLength(1);
    });
  });

  describe("touch function", () => {
    it("should set dirty flag", () => {
      const { result } = renderHook(() => useCheckoutEditor());

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.touch();
      });

      expect(result.current.isDirty).toBe(true);
    });
  });
});
