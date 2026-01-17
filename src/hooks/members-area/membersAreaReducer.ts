/**
 * Members Area Reducer
 * 
 * Single Source of Truth para estado local da Members Area
 * Gerencia modules e estado de saving
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - State Management via Reducer
 */

import type { MemberModule, MemberContent, MemberModuleWithContents } from "./types";

// ============================================================================
// STATE TYPE
// ============================================================================

export interface MembersAreaState {
  modules: MemberModuleWithContents[];
  isSaving: boolean;
}

export const INITIAL_MEMBERS_AREA_STATE: MembersAreaState = {
  modules: [],
  isSaving: false,
};

// ============================================================================
// ACTION TYPES
// ============================================================================

export type MembersAreaAction =
  // Modules
  | { type: 'SET_MODULES'; modules: MemberModuleWithContents[] }
  | { type: 'ADD_MODULE'; module: MemberModuleWithContents }
  | { type: 'UPDATE_MODULE'; id: string; data: Partial<MemberModule> }
  | { type: 'DELETE_MODULE'; id: string }
  | { type: 'REORDER_MODULES'; orderedIds: string[] }
  // Contents
  | { type: 'ADD_CONTENT'; moduleId: string; content: MemberContent }
  | { type: 'UPDATE_CONTENT'; id: string; data: Partial<MemberContent> }
  | { type: 'DELETE_CONTENT'; id: string }
  | { type: 'REORDER_CONTENTS'; moduleId: string; orderedIds: string[] }
  // UI State
  | { type: 'SET_SAVING'; isSaving: boolean }
  | { type: 'RESET'; modules: MemberModuleWithContents[] };

// ============================================================================
// REDUCER
// ============================================================================

export function membersAreaReducer(
  state: MembersAreaState,
  action: MembersAreaAction
): MembersAreaState {
  switch (action.type) {
    // -------------------------------------------------------------------------
    // MODULES
    // -------------------------------------------------------------------------
    case 'SET_MODULES':
      return { ...state, modules: action.modules };

    case 'ADD_MODULE':
      return { ...state, modules: [...state.modules, action.module] };

    case 'UPDATE_MODULE':
      return {
        ...state,
        modules: state.modules.map(m =>
          m.id === action.id ? { ...m, ...action.data } : m
        ),
      };

    case 'DELETE_MODULE':
      return {
        ...state,
        modules: state.modules.filter(m => m.id !== action.id),
      };

    case 'REORDER_MODULES': {
      const moduleMap = new Map(state.modules.map(m => [m.id, m]));
      const reorderedModules = action.orderedIds
        .map((id, index) => {
          const module = moduleMap.get(id);
          if (!module) return null;
          return { ...module, position: index };
        })
        .filter((m): m is MemberModuleWithContents => m !== null);
      return { ...state, modules: reorderedModules };
    }

    // -------------------------------------------------------------------------
    // CONTENTS
    // -------------------------------------------------------------------------
    case 'ADD_CONTENT':
      return {
        ...state,
        modules: state.modules.map(m =>
          m.id === action.moduleId
            ? { ...m, contents: [...m.contents, action.content] }
            : m
        ),
      };

    case 'UPDATE_CONTENT':
      return {
        ...state,
        modules: state.modules.map(m => ({
          ...m,
          contents: m.contents.map(c =>
            c.id === action.id ? { ...c, ...action.data } : c
          ),
        })),
      };

    case 'DELETE_CONTENT':
      return {
        ...state,
        modules: state.modules.map(m => ({
          ...m,
          contents: m.contents.filter(c => c.id !== action.id),
        })),
      };

    case 'REORDER_CONTENTS': {
      return {
        ...state,
        modules: state.modules.map(m => {
          if (m.id !== action.moduleId) return m;
          const contentMap = new Map(m.contents.map(c => [c.id, c]));
          const reorderedContents = action.orderedIds
            .map((id, index) => {
              const content = contentMap.get(id);
              if (!content) return null;
              return { ...content, position: index };
            })
            .filter((c): c is MemberContent => c !== null);
          return { ...m, contents: reorderedContents };
        }),
      };
    }

    // -------------------------------------------------------------------------
    // UI STATE
    // -------------------------------------------------------------------------
    case 'SET_SAVING':
      return { ...state, isSaving: action.isSaving };

    case 'RESET':
      return { modules: action.modules, isSaving: false };

    default:
      return state;
  }
}
