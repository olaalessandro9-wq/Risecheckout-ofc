/**
 * MembersAreaMachine Types
 * 
 * Type definitions for the Members Area Settings State Machine.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 * @module members-area/machines
 */

import type { MemberModule, MemberContent, MemberModuleWithContents } from '../types';

// ============================================================================
// CONTEXT
// ============================================================================

export interface MembersAreaMachineContext {
  modules: MemberModuleWithContents[];
  originalModules: MemberModuleWithContents[];
  isSaving: boolean;
  loadError: string | null;
  saveError: string | null;
}

// ============================================================================
// EVENTS
// ============================================================================

export type MembersAreaMachineEvent =
  // Lifecycle
  | { type: "LOAD"; modules: MemberModuleWithContents[] }
  | { type: "SAVE" }
  | { type: "SAVE_SUCCESS" }
  | { type: "SAVE_ERROR"; error: string }
  | { type: "RESET"; modules: MemberModuleWithContents[] }
  
  // Modules CRUD
  | { type: "SET_MODULES"; modules: MemberModuleWithContents[] }
  | { type: "ADD_MODULE"; module: MemberModuleWithContents }
  | { type: "UPDATE_MODULE"; id: string; data: Partial<MemberModule> }
  | { type: "DELETE_MODULE"; id: string }
  | { type: "REORDER_MODULES"; orderedIds: string[] }
  
  // Contents CRUD
  | { type: "ADD_CONTENT"; moduleId: string; content: MemberContent }
  | { type: "UPDATE_CONTENT"; id: string; data: Partial<MemberContent> }
  | { type: "DELETE_CONTENT"; id: string }
  | { type: "REORDER_CONTENTS"; moduleId: string; orderedIds: string[] }
  
  // UI State (legacy compatibility)
  | { type: "SET_SAVING"; isSaving: boolean };
