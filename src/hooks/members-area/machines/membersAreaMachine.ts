/**
 * MembersAreaMachine - State Machine
 * 
 * XState State Machine for Members Area Settings.
 * Single Source of Truth for modules and contents state.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 * @module members-area/machines
 */

import { setup, assign } from 'xstate';
import type { MembersAreaMachineContext, MembersAreaMachineEvent } from './membersAreaMachine.types';
import type { MemberModuleWithContents, MemberContent } from '../types';

// ============================================================================
// INITIAL CONTEXT
// ============================================================================

export const initialMembersAreaContext: MembersAreaMachineContext = {
  modules: [],
  originalModules: [],
  isSaving: false,
  loadError: null,
  saveError: null,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function modulesChanged(
  current: MemberModuleWithContents[],
  original: MemberModuleWithContents[]
): boolean {
  if (current.length !== original.length) return true;
  
  const originalMap = new Map(original.map(m => [m.id, m]));
  
  for (const module of current) {
    const orig = originalMap.get(module.id);
    if (!orig) return true;
    if (module.position !== orig.position) return true;
    if (module.title !== orig.title) return true;
    if (module.is_active !== orig.is_active) return true;
    
    // Check contents
    if (module.contents.length !== orig.contents.length) return true;
    
    const origContentMap = new Map(orig.contents.map(c => [c.id, c]));
    for (const content of module.contents) {
      const origContent = origContentMap.get(content.id);
      if (!origContent) return true;
      if (content.position !== origContent.position) return true;
      if (content.title !== origContent.title) return true;
      if (content.is_active !== origContent.is_active) return true;
    }
  }
  
  return false;
}

// ============================================================================
// STATE MACHINE
// ============================================================================

export const membersAreaMachine = setup({
  types: {
    context: {} as MembersAreaMachineContext,
    events: {} as MembersAreaMachineEvent,
  },
  guards: {
    isDirty: ({ context }) => modulesChanged(context.modules, context.originalModules),
    canSave: ({ context }) => modulesChanged(context.modules, context.originalModules) && !context.isSaving,
    hasModules: ({ context }) => context.modules.length > 0,
    isNotDirty: ({ context }) => !modulesChanged(context.modules, context.originalModules),
  },
  actions: {
    loadModules: assign({
      modules: ({ event }) => {
        if (event.type !== "LOAD") return [];
        return event.modules;
      },
      originalModules: ({ event }) => {
        if (event.type !== "LOAD") return [];
        return event.modules;
      },
      loadError: () => null,
    }),
    setModules: assign({
      modules: ({ event }) => {
        if (event.type !== "SET_MODULES") return [];
        return event.modules;
      },
    }),
    resetModules: assign({
      modules: ({ event }) => {
        if (event.type !== "RESET") return [];
        return event.modules;
      },
      originalModules: ({ event }) => {
        if (event.type !== "RESET") return [];
        return event.modules;
      },
      isSaving: () => false,
      saveError: () => null,
    }),
    setSaving: assign({
      isSaving: ({ event }) => {
        if (event.type !== "SET_SAVING") return false;
        return event.isSaving;
      },
    }),
    saveSuccess: assign({
      isSaving: () => false,
      saveError: () => null,
      originalModules: ({ context }) => context.modules,
    }),
    saveError: assign({
      isSaving: () => false,
      saveError: ({ event }) => {
        if (event.type !== "SAVE_ERROR") return null;
        return event.error;
      },
    }),
    addModule: assign({
      modules: ({ context, event }) => {
        if (event.type !== "ADD_MODULE") return context.modules;
        return [...context.modules, event.module];
      },
    }),
    updateModule: assign({
      modules: ({ context, event }) => {
        if (event.type !== "UPDATE_MODULE") return context.modules;
        return context.modules.map(m =>
          m.id === event.id ? { ...m, ...event.data } : m
        );
      },
    }),
    deleteModule: assign({
      modules: ({ context, event }) => {
        if (event.type !== "DELETE_MODULE") return context.modules;
        return context.modules.filter(m => m.id !== event.id);
      },
    }),
    reorderModules: assign({
      modules: ({ context, event }) => {
        if (event.type !== "REORDER_MODULES") return context.modules;
        const moduleMap = new Map(context.modules.map(m => [m.id, m]));
        return event.orderedIds
          .map((id, index) => {
            const module = moduleMap.get(id);
            if (!module) return null;
            return { ...module, position: index };
          })
          .filter((m): m is MemberModuleWithContents => m !== null);
      },
    }),
    addContent: assign({
      modules: ({ context, event }) => {
        if (event.type !== "ADD_CONTENT") return context.modules;
        return context.modules.map(m =>
          m.id === event.moduleId
            ? { ...m, contents: [...m.contents, event.content] }
            : m
        );
      },
    }),
    updateContent: assign({
      modules: ({ context, event }) => {
        if (event.type !== "UPDATE_CONTENT") return context.modules;
        return context.modules.map(m => ({
          ...m,
          contents: m.contents.map((c: MemberContent) =>
            c.id === event.id ? { ...c, ...event.data } : c
          ),
        }));
      },
    }),
    deleteContent: assign({
      modules: ({ context, event }) => {
        if (event.type !== "DELETE_CONTENT") return context.modules;
        return context.modules.map(m => ({
          ...m,
          contents: m.contents.filter((c: MemberContent) => c.id !== event.id),
        }));
      },
    }),
    reorderContents: assign({
      modules: ({ context, event }) => {
        if (event.type !== "REORDER_CONTENTS") return context.modules;
        return context.modules.map(m => {
          if (m.id !== event.moduleId) return m;
          const contentMap = new Map(m.contents.map((c: MemberContent) => [c.id, c]));
          const reorderedContents = event.orderedIds
            .map((id, index) => {
              const content = contentMap.get(id);
              if (!content) return null;
              return { ...content, position: index };
            })
            .filter((c): c is MemberContent => c !== null);
          return { ...m, contents: reorderedContents };
        });
      },
    }),
  },
}).createMachine({
  id: 'membersArea',
  initial: 'idle',
  context: initialMembersAreaContext,
  states: {
    idle: {
      on: {
        LOAD: {
          target: 'ready',
          actions: 'loadModules',
        },
        SET_MODULES: {
          target: 'ready',
          actions: 'setModules',
        },
      },
    },
    ready: {
      initial: 'pristine',
      states: {
        pristine: {
          always: {
            guard: 'isDirty',
            target: 'dirty',
          },
        },
        dirty: {
          always: {
            guard: 'isNotDirty',
            target: 'pristine',
          },
        },
      },
      on: {
        // Modules CRUD
        SET_MODULES: { actions: 'setModules' },
        ADD_MODULE: { actions: 'addModule' },
        UPDATE_MODULE: { actions: 'updateModule' },
        DELETE_MODULE: { actions: 'deleteModule' },
        REORDER_MODULES: { actions: 'reorderModules' },
        
        // Contents CRUD
        ADD_CONTENT: { actions: 'addContent' },
        UPDATE_CONTENT: { actions: 'updateContent' },
        DELETE_CONTENT: { actions: 'deleteContent' },
        REORDER_CONTENTS: { actions: 'reorderContents' },
        
        // Lifecycle
        RESET: {
          target: '.pristine',
          actions: 'resetModules',
        },
        SET_SAVING: { actions: 'setSaving' },
        SAVE: {
          guard: 'canSave',
          target: 'saving',
        },
        SAVE_SUCCESS: { actions: 'saveSuccess' },
        SAVE_ERROR: { actions: 'saveError' },
        
        // Reload
        LOAD: {
          target: '.pristine',
          actions: 'loadModules',
        },
      },
    },
    saving: {
      entry: assign({ isSaving: () => true }),
      on: {
        SAVE_SUCCESS: {
          target: 'ready.pristine',
          actions: 'saveSuccess',
        },
        SAVE_ERROR: {
          target: 'ready.dirty',
          actions: 'saveError',
        },
      },
    },
  },
});

export type MembersAreaMachine = typeof membersAreaMachine;
