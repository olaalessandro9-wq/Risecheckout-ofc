/**
 * AffiliationMachine Types
 * 
 * Type definitions for the Affiliation State Machine.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 * @module affiliation/machines
 */

import type {
  AffiliationDetails,
  OtherProducerProduct,
} from "@/hooks/useAffiliationDetails";

// ============================================================================
// TAB TYPES
// ============================================================================

export type AffiliationTabId = 
  | "gateways" 
  | "offers" 
  | "pixels" 
  | "details" 
  | "other-products";

// ============================================================================
// CONTEXT
// ============================================================================

export interface AffiliationMachineContext {
  affiliationId: string | null;
  affiliation: AffiliationDetails | null;
  otherProducts: OtherProducerProduct[];
  activeTab: AffiliationTabId;
  tabErrors: Partial<Record<AffiliationTabId, boolean>>;
  loadError: string | null;
}

// ============================================================================
// EVENTS
// ============================================================================

export type AffiliationMachineEvent =
  | { type: "LOAD"; affiliationId: string }
  | { type: "RECEIVE_DATA"; affiliation: AffiliationDetails; otherProducts: OtherProducerProduct[] }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "SET_TAB"; tab: AffiliationTabId }
  | { type: "SET_TAB_ERROR"; tab: AffiliationTabId; hasError: boolean }
  | { type: "CLEAR_TAB_ERRORS" }
  | { type: "REFRESH" };

// ============================================================================
// ACTOR INPUT
// ============================================================================

export interface LoadAffiliationInput {
  affiliationId: string | null;
}

export interface LoadAffiliationOutput {
  affiliation: AffiliationDetails;
  otherProducts: OtherProducerProduct[];
}
