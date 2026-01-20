/**
 * BuilderMachine - State Machine Principal
 * 
 * Single Source of Truth para o estado do Members Area Builder.
 * Implementa o padrão Actor Model com XState v5.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 * @module members-area-builder/machines
 */

import { setup, assign } from "xstate";
import type { 
  BuilderMachineContext, 
  BuilderMachineEvent,
  LoadBuilderOutput,
  SaveBuilderOutput,
  SaveBuilderInput,
} from "./builderMachine.types";
import { DEFAULT_BUILDER_SETTINGS } from "../types/builder.types";
import { loadBuilderActor, saveBuilderActor } from "./builderMachine.actors";
import { canSave } from "./builderMachine.guards";
import {
  addSectionToList,
  updateSectionInList,
  updateSectionSettingsInList,
  deleteSectionFromList,
  reorderSectionsInList,
  duplicateSectionInList,
  getSelectedSectionAfterDelete,
} from "./builderMachine.actions";

// ============================================================================
// INITIAL CONTEXT
// ============================================================================

export const initialBuilderContext: BuilderMachineContext = {
  productId: null,
  sections: [],
  settings: DEFAULT_BUILDER_SETTINGS,
  selectedSectionId: null,
  selectedMenuItemId: null,
  viewMode: "desktop",
  isPreviewMode: false,
  isMenuCollapsed: false,
  modules: [],
  selectedModuleId: null,
  isEditingModule: false,
  originalSections: [],
  originalSettings: DEFAULT_BUILDER_SETTINGS,
  loadError: null,
  saveError: null,
};

// ============================================================================
// STATE MACHINE
// ============================================================================

export const builderMachine = setup({
  types: {
    context: {} as BuilderMachineContext,
    events: {} as BuilderMachineEvent,
  },
  actors: {
    loadBuilder: loadBuilderActor,
    saveBuilder: saveBuilderActor,
  },
  guards: {
    canSave,
  },
}).createMachine({
  id: "builder",
  initial: "idle",
  context: initialBuilderContext,

  states: {
    idle: {
      on: {
        LOAD: {
          target: "loading",
          actions: assign({
            productId: ({ event }) => event.productId,
            loadError: () => null,
          }),
        },
      },
    },

    loading: {
      invoke: {
        src: "loadBuilder",
        input: ({ context }) => ({ productId: context.productId }),
        onDone: {
          target: "ready",
          actions: assign(({ event }) => {
            const data = event.output as LoadBuilderOutput;
            return {
              sections: data.sections,
              settings: data.settings,
              modules: data.modules,
              originalSections: data.sections,
              originalSettings: data.settings,
              loadError: null,
            };
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            loadError: ({ event }) => String(event.error),
          }),
        },
      },
    },

    ready: {
      initial: "pristine",
      on: {
        REFRESH: { target: "loading", actions: assign({ loadError: () => null }) },
        SET_VIEW_MODE: { actions: assign({ viewMode: ({ event }) => event.mode }) },
        TOGGLE_PREVIEW_MODE: { actions: assign({ isPreviewMode: ({ context }) => !context.isPreviewMode }) },
        TOGGLE_MENU_COLLAPSE: { actions: assign({ isMenuCollapsed: ({ context }) => !context.isMenuCollapsed }) },
        SELECT_SECTION: { actions: assign({ selectedSectionId: ({ event }) => event.id, selectedMenuItemId: () => null }) },
        SELECT_MENU_ITEM: { actions: assign({ selectedMenuItemId: ({ event }) => event.id, selectedSectionId: () => null }) },
        SET_MODULES: { actions: assign({ modules: ({ event }) => event.modules }) },
        SELECT_MODULE: { actions: assign({ selectedModuleId: ({ event }) => event.id, isEditingModule: ({ event }) => event.id !== null }) },
        SET_EDITING_MODULE: { actions: assign({ isEditingModule: ({ event }) => event.isEditing, selectedModuleId: ({ context, event }) => event.isEditing ? context.selectedModuleId : null }) },
        UPDATE_MODULE: { actions: assign({ modules: ({ context, event }) => context.modules.map(m => m.id === event.id ? { ...m, ...event.data } : m) }) },
      },

      states: {
        pristine: {
          on: {
            ADD_SECTION: {
              target: "dirty",
              actions: assign({
                sections: ({ context, event }) => addSectionToList(context.sections, event.section),
                selectedSectionId: ({ event }) => event.section.id,
              }),
            },
            UPDATE_SECTION: {
              target: "dirty",
              actions: assign({
                sections: ({ context, event }) => updateSectionInList(context.sections, event.id, event.updates),
              }),
            },
            UPDATE_SECTION_SETTINGS: {
              target: "dirty",
              actions: assign({
                sections: ({ context, event }) => updateSectionSettingsInList(context.sections, event.id, event.settings),
              }),
            },
            DELETE_SECTION: {
              target: "dirty",
              actions: assign({
                sections: ({ context, event }) => deleteSectionFromList(context.sections, event.id),
                selectedSectionId: ({ context, event }) => getSelectedSectionAfterDelete(context.selectedSectionId, event.id),
              }),
            },
            REORDER_SECTIONS: {
              target: "dirty",
              actions: assign({
                sections: ({ context, event }) => reorderSectionsInList(context.sections, event.orderedIds),
              }),
            },
            DUPLICATE_SECTION: {
              target: "dirty",
              actions: assign({
                sections: ({ context, event }) => duplicateSectionInList(context.sections, event.original, event.duplicate),
                selectedSectionId: ({ event }) => event.duplicate.id,
              }),
            },
            UPDATE_SETTINGS: {
              target: "dirty",
              actions: assign({
                settings: ({ context, event }) => ({ ...context.settings, ...event.settings }),
              }),
            },
          },
        },

        dirty: {
          on: {
            ADD_SECTION: {
              actions: assign({
                sections: ({ context, event }) => addSectionToList(context.sections, event.section),
                selectedSectionId: ({ event }) => event.section.id,
              }),
            },
            UPDATE_SECTION: {
              actions: assign({
                sections: ({ context, event }) => updateSectionInList(context.sections, event.id, event.updates),
              }),
            },
            UPDATE_SECTION_SETTINGS: {
              actions: assign({
                sections: ({ context, event }) => updateSectionSettingsInList(context.sections, event.id, event.settings),
              }),
            },
            DELETE_SECTION: {
              actions: assign({
                sections: ({ context, event }) => deleteSectionFromList(context.sections, event.id),
                selectedSectionId: ({ context, event }) => getSelectedSectionAfterDelete(context.selectedSectionId, event.id),
              }),
            },
            REORDER_SECTIONS: {
              actions: assign({
                sections: ({ context, event }) => reorderSectionsInList(context.sections, event.orderedIds),
              }),
            },
            DUPLICATE_SECTION: {
              actions: assign({
                sections: ({ context, event }) => duplicateSectionInList(context.sections, event.original, event.duplicate),
                selectedSectionId: ({ event }) => event.duplicate.id,
              }),
            },
            UPDATE_SETTINGS: {
              actions: assign({
                settings: ({ context, event }) => ({ ...context.settings, ...event.settings }),
              }),
            },
            SAVE: { target: "#builder.saving", guard: "canSave" },
            DISCARD_CHANGES: {
              target: "pristine",
              actions: assign(({ context }) => ({
                sections: context.originalSections,
                settings: context.originalSettings,
                selectedSectionId: null,
              })),
            },
          },
        },
      },
    },

    saving: {
      entry: assign({ saveError: () => null }),
      invoke: {
        src: "saveBuilder",
        input: ({ context }): SaveBuilderInput => ({
          productId: context.productId,
          sections: context.sections,
          settings: context.settings,
          originalSections: context.originalSections,
        }),
        onDone: {
          target: "ready.pristine",
          actions: assign(({ context, event }) => {
            const data = event.output as SaveBuilderOutput;
            const updatedSections = data.updatedSections ?? context.sections;
            return {
              sections: updatedSections,
              originalSections: updatedSections,
              originalSettings: context.settings,
              saveError: null,
            };
          }),
        },
        onError: {
          target: "ready.dirty",
          actions: assign({ saveError: ({ event }) => String(event.error) }),
        },
      },
    },

    error: {
      on: {
        LOAD: {
          target: "loading",
          actions: assign({
            productId: ({ event }) => event.productId,
            loadError: () => null,
          }),
        },
      },
    },
  },
});

export type BuilderMachine = typeof builderMachine;
