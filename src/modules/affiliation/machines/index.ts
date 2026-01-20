/**
 * Affiliation Machines Module
 * 
 * Re-exports all State Machine components.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 * @module affiliation/machines
 */

// State Machine
export { affiliationMachine, initialAffiliationContext } from "./affiliationMachine";
export type { AffiliationMachine } from "./affiliationMachine";

// Types
export type {
  AffiliationTabId,
  AffiliationMachineContext,
  AffiliationMachineEvent,
  LoadAffiliationInput,
  LoadAffiliationOutput,
} from "./affiliationMachine.types";

// Actors
export { loadAffiliationActor } from "./affiliationMachine.actors";
