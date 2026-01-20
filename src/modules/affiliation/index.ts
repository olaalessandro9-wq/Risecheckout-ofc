/**
 * Affiliation Module
 * 
 * Public exports for the Affiliation module.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 * @module affiliation
 */

// Context
export { AffiliationProvider, useAffiliationContext } from "./context/AffiliationContext";

// Machines
export {
  affiliationMachine,
  initialAffiliationContext,
  loadAffiliationActor,
} from "./machines";

// Types
export type {
  AffiliationMachine,
  AffiliationTabId,
  AffiliationMachineContext,
  AffiliationMachineEvent,
  LoadAffiliationInput,
  LoadAffiliationOutput,
} from "./machines";
