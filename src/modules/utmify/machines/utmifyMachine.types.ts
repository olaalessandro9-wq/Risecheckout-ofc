/**
 * UTMify Machine Types
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - XState Types
 */

import type { Product, UTMifyConfig } from "../types";

// ============================================================================
// CONTEXT
// ============================================================================

export interface UTMifyMachineContext {
  /** Loaded configuration */
  config: UTMifyConfig | null;
  /** Available products */
  products: Product[];
  /** Form state - token input */
  token: string;
  /** Form state - active toggle */
  active: boolean;
  /** Form state - selected products */
  selectedProducts: string[];
  /** Form state - selected events */
  selectedEvents: string[];
  /** Error message */
  error: string | null;
}

// ============================================================================
// EVENTS
// ============================================================================

export type UTMifyMachineEvent =
  | { type: "LOAD" }
  | { type: "LOAD_SUCCESS"; config: UTMifyConfig; products: Product[] }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "UPDATE_TOKEN"; token: string }
  | { type: "TOGGLE_ACTIVE" }
  | { type: "TOGGLE_PRODUCT"; productId: string }
  | { type: "TOGGLE_EVENT"; eventId: string }
  | { type: "SAVE"; vendorId: string }
  | { type: "SAVE_SUCCESS" }
  | { type: "SAVE_ERROR"; error: string }
  | { type: "RESET" };

// ============================================================================
// STATE VALUES
// ============================================================================

export type UTMifyStateValue = 
  | "idle" 
  | "loading" 
  | "ready" 
  | "saving" 
  | "error";
