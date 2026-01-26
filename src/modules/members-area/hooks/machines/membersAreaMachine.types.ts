/**
 * MembersAreaMachine Types
 * 
 * Type definitions for the Members Area Settings State Machine.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 * @module members-area/machines
 */

import type { MemberModule, MemberContent, ModuleWithContents } from '../../types';

// ============================================================================
// CONTEXT
// ============================================================================

export interface MembersAreaMachineContext {
  modules: ModuleWithContents[];
  originalModules: ModuleWithContents[];
  isSaving: boolean;
  loadError: string | null;
  saveError: string | null;
}

// ============================================================================
// EVENTS
// ============================================================================

export type MembersAreaMachineEvent =
  // Lifecycle
  | { type: "LOAD"; modules: ModuleWithContents[] }
  | { type: "SAVE" }
  | { type: "SAVE_SUCCESS" }
  | { type: "SAVE_ERROR"; error: string }
  | { type: "RESET"; modules: ModuleWithContents[] }
  
  // Modules CRUD
  | { type: "SET_MODULES"; modules: ModuleWithContents[] }
  | { type: "ADD_MODULE"; module: ModuleWithContents }
  | { type: "UPDATE_MODULE"; id: string; data: Partial<MemberModule> }
  | { type: "DELETE_MODULE"; id: string }
  | { type: "REORDER_MODULES"; orderedIds: string[] }
  
  // Contents CRUD
  | { type: "ADD_CONTENT"; moduleId: string; content: MemberContent }
  | { type: "UPDATE_CONTENT"; id: string; data: Partial<MemberContent> }
  | { type: "DELETE_CONTENT"; id: string }
  | { type: "REORDER_CONTENTS"; moduleId: string; orderedIds: string[] }
  
  // UI State (public API event)
  | { type: "SET_SAVING"; isSaving: boolean };
