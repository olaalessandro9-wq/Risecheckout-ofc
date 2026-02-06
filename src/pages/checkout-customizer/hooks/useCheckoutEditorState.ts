/**
 * useCheckoutEditorState - XState-based Checkout Editor Hook
 * 
 * Wraps the checkoutEditorMachine and exposes a clean API surface.
 * Replaces both useCheckoutEditor and useCheckoutPersistence.
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module checkout-customizer/hooks
 */

import { useCallback, useEffect, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { checkoutEditorMachine } from "../machines/checkoutEditorMachine";
import { isDirty } from "../machines/checkoutEditorMachine.guards";
import type { CheckoutViewport, ViewMode, CheckoutDesign, CheckoutCustomization } from "@/types/checkoutEditor";
import type { CheckoutComponentContent } from "@/types/checkout-components.types";

// ============================================================================
// HOOK
// ============================================================================

export function useCheckoutEditorState(checkoutId: string | null) {
  const [state, send] = useMachine(checkoutEditorMachine);
  const ctx = state.context;

  // Load on mount / when checkoutId changes
  useEffect(() => {
    if (checkoutId) {
      send({ type: "LOAD", checkoutId });
    }
  }, [checkoutId, send]);

  // Reload on window focus (if not dirty)
  useEffect(() => {
    const handleFocus = () => {
      if (checkoutId && !isDirty({ context: ctx })) {
        send({ type: "REFRESH" });
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [checkoutId, ctx, send]);

  // Derived: active customization based on viewport
  const customization: CheckoutCustomization = useMemo(() => {
    return ctx.activeViewport === "desktop"
      ? ctx.desktopCustomization
      : ctx.mobileCustomization;
  }, [ctx.activeViewport, ctx.desktopCustomization, ctx.mobileCustomization]);

  // Derived: selected component data
  const selectedComponentData = useMemo(() => {
    if (!ctx.selectedComponentId) return null;
    const top = customization.topComponents.find(
      (c) => c.id === ctx.selectedComponentId
    );
    if (top) return top;
    const bottom = customization.bottomComponents.find(
      (c) => c.id === ctx.selectedComponentId
    );
    if (bottom) return bottom;
    return null;
  }, [ctx.selectedComponentId, customization]);

  // State checks
  const isLoading = state.matches("loading");
  const isSaving = state.matches("saving");
  const dirty = isDirty({ context: ctx });

  // --- Action Callbacks ---

  const setViewMode = useCallback(
    (viewport: CheckoutViewport) => {
      send({ type: "SET_ACTIVE_VIEWPORT", viewport });
    },
    [send]
  );

  const setIsPreviewMode = useCallback(
    (enabled: boolean) => send({ type: "SET_PREVIEW_MODE", enabled }),
    [send]
  );

  const setActiveTab = useCallback(
    (tab: "components" | "settings") => send({ type: "SET_ACTIVE_TAB", tab }),
    [send]
  );

  const setSelectedComponent = useCallback(
    (id: string | null) => send({ type: "SELECT_COMPONENT", id }),
    [send]
  );

  const handleUpdateDesign = useCallback(
    (design: CheckoutDesign) => send({ type: "UPDATE_DESIGN", design }),
    [send]
  );

  const handleUpdateComponent = useCallback(
    (componentId: string, content: Partial<CheckoutComponentContent>) =>
      send({ type: "UPDATE_COMPONENT", componentId, content }),
    [send]
  );

  const handleRemoveComponent = useCallback(
    (componentId: string) => send({ type: "REMOVE_COMPONENT", componentId }),
    [send]
  );

  const handleDuplicateComponent = useCallback(
    (componentId: string) => send({ type: "DUPLICATE_COMPONENT", componentId }),
    [send]
  );

  const handleMoveComponent = useCallback(
    (componentId: string, direction: "up" | "down") =>
      send({ type: "MOVE_COMPONENT", componentId, direction }),
    [send]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => send({ type: "DRAG_START", event }),
    [send]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => send({ type: "DRAG_END", event }),
    [send]
  );

  const handleSave = useCallback(() => send({ type: "SAVE" }), [send]);

  const handleDiscard = useCallback(
    () => send({ type: "DISCARD_CHANGES" }),
    [send]
  );

  const copyDesktopToMobile = useCallback(
    () => send({ type: "COPY_DESKTOP_TO_MOBILE" }),
    [send]
  );

  const setMobileSynced = useCallback(
    (synced: boolean) => send({ type: "SET_MOBILE_SYNCED", synced }),
    [send]
  );

  return {
    // State
    customization,
    viewMode: ctx.viewMode as ViewMode,
    activeViewport: ctx.activeViewport,
    isPreviewMode: ctx.isPreviewMode,
    activeTab: ctx.activeTab,
    activeId: ctx.activeId,
    selectedComponent: ctx.selectedComponentId,
    selectedComponentData,
    isDirty: dirty,
    isLoading,
    isSaving,
    isMobileSynced: ctx.isMobileSynced,

    // Persistence data
    productData: ctx.productData,
    orderBumps: ctx.orderBumps,

    // Actions
    setViewMode,
    setIsPreviewMode,
    setActiveTab,
    setSelectedComponent,
    handleUpdateDesign,
    handleUpdateComponent,
    handleRemoveComponent,
    handleDuplicateComponent,
    handleMoveComponent,
    handleDragStart,
    handleDragEnd,
    handleSave,
    handleDiscard,
    copyDesktopToMobile,
    setMobileSynced,
  };
}
