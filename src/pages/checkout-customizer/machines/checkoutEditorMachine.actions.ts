/**
 * Checkout Editor Machine - Action Helpers
 * 
 * Pure functions for state transitions.
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module checkout-customizer/machines
 */

import type { CheckoutEditorMachineContext } from "./checkoutEditorMachine.types";
import type { CheckoutComponent, CheckoutCustomization } from "@/types/checkoutEditor";
import type { CheckoutComponentContent, CheckoutComponentType } from "@/types/checkout-components.types";
import { isValidComponentType } from "@/types/checkout-components.types";
import type { DragEndEvent } from "@dnd-kit/core";

// ============================================================================
// VIEWPORT HELPERS (Dual-Layout Support)
// ============================================================================

/** Get customization for active viewport */
export function getActiveCustomization(ctx: CheckoutEditorMachineContext): CheckoutCustomization {
  return ctx.activeViewport === "desktop"
    ? ctx.desktopCustomization
    : ctx.mobileCustomization;
}

/** Update customization for active viewport (with sync support) */
export function setActiveCustomization(
  ctx: CheckoutEditorMachineContext,
  customization: CheckoutCustomization
): Partial<CheckoutEditorMachineContext> {
  if (ctx.activeViewport === "desktop") {
    if (ctx.isMobileSynced) {
      return {
        desktopCustomization: customization,
        mobileCustomization: { ...customization },
      };
    }
    return { desktopCustomization: customization };
  }
  return { mobileCustomization: customization };
}

/** Clone desktop customization to mobile */
export function cloneDesktopToMobile(
  desktop: CheckoutCustomization
): CheckoutCustomization {
  return JSON.parse(JSON.stringify(desktop));
}

// ============================================================================
// COMPONENT ID GENERATOR
// ============================================================================

function generateComponentId(): string {
  return `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// COMPONENT CRUD HELPERS
// ============================================================================

export function updateComponentInCustomization(
  customization: CheckoutCustomization,
  componentId: string,
  partialContent: Partial<CheckoutComponentContent>
): CheckoutCustomization {
  let found = false;

  const updateList = (list: CheckoutComponent[]) =>
    list.map((c) => {
      if (c.id === componentId) {
        found = true;
        return { ...c, content: { ...c.content, ...partialContent } };
      }
      return c;
    });

  const newTop = updateList(customization.topComponents);
  if (found) return { ...customization, topComponents: newTop };

  const newBottom = updateList(customization.bottomComponents);
  if (found) return { ...customization, bottomComponents: newBottom };

  return customization;
}

export function removeComponentFromCustomization(
  customization: CheckoutCustomization,
  componentId: string
): CheckoutCustomization {
  const filter = (list: CheckoutComponent[]) =>
    list.filter((c) => c.id !== componentId);
  return {
    ...customization,
    topComponents: filter(customization.topComponents),
    bottomComponents: filter(customization.bottomComponents),
  };
}

export function duplicateComponentInCustomization(
  customization: CheckoutCustomization,
  componentId: string
): CheckoutCustomization {
  const clone = (c: CheckoutComponent): CheckoutComponent => ({
    ...c,
    id: generateComponentId(),
  });

  const topIdx = customization.topComponents.findIndex(
    (c) => c.id === componentId
  );
  if (topIdx >= 0) {
    const newArr = [...customization.topComponents];
    newArr.splice(topIdx + 1, 0, clone(customization.topComponents[topIdx]));
    return { ...customization, topComponents: newArr };
  }

  const botIdx = customization.bottomComponents.findIndex(
    (c) => c.id === componentId
  );
  if (botIdx >= 0) {
    const newArr = [...customization.bottomComponents];
    newArr.splice(
      botIdx + 1,
      0,
      clone(customization.bottomComponents[botIdx])
    );
    return { ...customization, bottomComponents: newArr };
  }

  return customization;
}

export function moveComponentInCustomization(
  customization: CheckoutCustomization,
  componentId: string,
  direction: "up" | "down"
): CheckoutCustomization {
  const move = (list: CheckoutComponent[]) => {
    const idx = list.findIndex((c) => c.id === componentId);
    if (idx === -1) return list;
    const newArr = [...list];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx >= 0 && swapIdx < newArr.length) {
      [newArr[idx], newArr[swapIdx]] = [newArr[swapIdx], newArr[idx]];
    }
    return newArr;
  };

  return {
    ...customization,
    topComponents: move(customization.topComponents),
    bottomComponents: move(customization.bottomComponents),
  };
}

// ============================================================================
// DRAG AND DROP HANDLER
// ============================================================================

export function handleDragEndAction(
  customization: CheckoutCustomization,
  event: DragEndEvent
): { customization: CheckoutCustomization; newComponentId: string | null } {
  const { active, over } = event;
  if (!over) return { customization, newComponentId: null };

  const activeIdStr = active.id as string;
  const dropZone = over.id as string;
  const isExisting = activeIdStr.startsWith("component-");

  let newComponentId: string | null = null;
  let componentToMove: CheckoutComponent | null = null;

  // Create new component if dragging from palette
  if (!isExisting) {
    newComponentId = generateComponentId();
    const componentType: CheckoutComponentType = isValidComponentType(activeIdStr)
      ? activeIdStr
      : "timer";

    componentToMove = {
      id: newComponentId,
      type: componentType,
      content:
        activeIdStr === "timer"
          ? {
              minutes: 15,
              seconds: 0,
              timerColor: "#EF4444",
              textColor: "#FFFFFF",
              activeText: "Oferta por tempo limitado",
              finishedText: "Oferta finalizada",
              fixedTop: false,
            }
          : {},
    };
  }

  let newState = { ...customization };

  // Remove from source if existing component
  if (isExisting) {
    const topIdx = customization.topComponents.findIndex(
      (c) => c.id === activeIdStr
    );
    if (topIdx >= 0) {
      componentToMove = customization.topComponents[topIdx];
      newState.topComponents = customization.topComponents.filter(
        (c) => c.id !== activeIdStr
      );
    }
    if (!componentToMove) {
      const botIdx = customization.bottomComponents.findIndex(
        (c) => c.id === activeIdStr
      );
      if (botIdx >= 0) {
        componentToMove = customization.bottomComponents[botIdx];
        newState.bottomComponents = customization.bottomComponents.filter(
          (c) => c.id !== activeIdStr
        );
      }
    }
  }

  if (!componentToMove) return { customization, newComponentId: null };

  // Add to destination
  if (dropZone === "top-drop-zone") {
    newState = {
      ...newState,
      topComponents: [...newState.topComponents, componentToMove],
    };
  } else if (dropZone === "bottom-drop-zone") {
    newState = {
      ...newState,
      bottomComponents: [...newState.bottomComponents, componentToMove],
    };
  }

  return { customization: newState, newComponentId };
}

// ============================================================================
// SELECTION HELPERS
// ============================================================================

export function getSelectedAfterRemove(
  currentId: string | null,
  removedId: string
): string | null {
  return currentId === removedId ? null : currentId;
}
