/**
 * Checkout Editor Machine - Type Definitions
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Mirrors Members Area Builder pattern for architectural consistency.
 * 
 * @module checkout-customizer/machines
 */

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type {
  CheckoutViewport,
  ViewMode,
  CheckoutComponent,
  CheckoutDesign,
  CheckoutCustomization,
} from "@/types/checkoutEditor";
import type { CheckoutComponentContent } from "@/types/checkout-components.types";
import type { OrderBump, ProductData } from "@/types/checkout";
import type { ProductOffer, PaymentLinkData, OrderBumpApiResponse } from "../types";

// ============================================================================
// CONTEXT
// ============================================================================

export interface CheckoutEditorMachineContext {
  checkoutId: string | null;

  // Dual-Layout: Separate customizations per viewport
  desktopCustomization: CheckoutCustomization;
  mobileCustomization: CheckoutCustomization;

  // Active editing viewport
  activeViewport: CheckoutViewport;

  // Mobile sync mode: when true, mobile mirrors desktop automatically
  isMobileSynced: boolean;

  // Selection
  selectedComponentId: string | null;

  // View
  viewMode: ViewMode;
  isPreviewMode: boolean;
  activeTab: "components" | "settings";
  activeId: string | null; // DnD active dragging

  // Originals for dirty comparison
  originalDesktopCustomization: CheckoutCustomization;
  originalMobileCustomization: CheckoutCustomization;

  // Persistence data (loaded from API)
  productData: ProductData | null;
  orderBumps: OrderBump[];
  productOffers: ProductOffer[];
  currentLinks: PaymentLinkData[];

  // Errors
  loadError: string | null;
  saveError: string | null;
}

// ============================================================================
// EVENTS
// ============================================================================

export type CheckoutEditorMachineEvent =
  // Lifecycle
  | { type: "LOAD"; checkoutId: string }
  | { type: "SAVE" }
  | { type: "DISCARD_CHANGES" }
  | { type: "REFRESH" }

  // Design
  | { type: "UPDATE_DESIGN"; design: CheckoutDesign }

  // Component CRUD (operates on active viewport)
  | { type: "UPDATE_COMPONENT"; componentId: string; content: Partial<CheckoutComponentContent> }
  | { type: "REMOVE_COMPONENT"; componentId: string }
  | { type: "DUPLICATE_COMPONENT"; componentId: string }
  | { type: "MOVE_COMPONENT"; componentId: string; direction: "up" | "down" }

  // Selection
  | { type: "SELECT_COMPONENT"; id: string | null }

  // View
  | { type: "SET_PREVIEW_MODE"; enabled: boolean }
  | { type: "SET_ACTIVE_TAB"; tab: "components" | "settings" }

  // Viewport Switching (Dual Layout)
  | { type: "SET_ACTIVE_VIEWPORT"; viewport: CheckoutViewport }
  | { type: "COPY_DESKTOP_TO_MOBILE" }
  | { type: "SET_MOBILE_SYNCED"; synced: boolean }

  // DnD
  | { type: "DRAG_START"; event: DragStartEvent }
  | { type: "DRAG_END"; event: DragEndEvent };

// ============================================================================
// ACTOR INPUT/OUTPUT
// ============================================================================

export interface LoadEditorInput {
  checkoutId: string | null;
}

export interface LoadEditorOutput {
  desktopCustomization: CheckoutCustomization;
  mobileCustomization: CheckoutCustomization;
  isMobileSynced: boolean;
  productData: ProductData | null;
  orderBumps: OrderBump[];
  productOffers: ProductOffer[];
  currentLinks: PaymentLinkData[];
}

export interface SaveEditorInput {
  checkoutId: string | null;
  desktopCustomization: CheckoutCustomization;
  mobileCustomization: CheckoutCustomization;
  isMobileSynced: boolean;
}

export interface SaveEditorOutput {
  success: boolean;
}
