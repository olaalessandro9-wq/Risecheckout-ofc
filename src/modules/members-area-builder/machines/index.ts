/**
 * Builder Machines Module
 * 
 * Re-exports all State Machine components.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 * @module members-area-builder/machines
 */

// State Machine
export { builderMachine, initialBuilderContext } from "./builderMachine";
export type { BuilderMachine } from "./builderMachine";

// Types
export type {
  BuilderMachineContext,
  BuilderMachineEvent,
  LoadBuilderInput,
  LoadBuilderOutput,
  SaveBuilderInput,
  SaveBuilderOutput,
  SectionCreateInput,
} from "./builderMachine.types";

// Guards
export { isDirty, canSave, hasSelectedSection, hasProduct } from "./builderMachine.guards";

// Actors
export { loadBuilderActor, saveBuilderActor } from "./builderMachine.actors";
