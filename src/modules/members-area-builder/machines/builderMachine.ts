/**
 * BuilderMachine - State Machine Principal (Dual-Layout Version)
 * 
 * Single Source of Truth para o estado do Members Area Builder.
 * Suporta layouts independentes para Desktop e Mobile.
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
import { DEFAULT_BUILDER_SETTINGS } from "../types";
import { loadBuilderActor, saveBuilderActor } from "./builderMachine.actors";
import { canSave } from "./builderMachine.guards";
import {
  getActiveSections,
  setActiveSections,
  cloneDesktopToMobile,
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
  desktopSections: [],
  mobileSections: [],
  activeViewport: "desktop",
  isMobileSynced: true,
  settings: DEFAULT_BUILDER_SETTINGS,
  selectedSectionId: null,
  selectedMenuItemId: null,
  viewMode: "desktop",
  isPreviewMode: false,
  isMenuCollapsed: false,
  modules: [],
  selectedModuleId: null,
  isEditingModule: false,
  originalDesktopSections: [],
  originalMobileSections: [],
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
  actors: { loadBuilder: loadBuilderActor, saveBuilder: saveBuilderActor },
  guards: { canSave },
}).createMachine({
  id: "builder",
  initial: "idle",
  context: initialBuilderContext,

  states: {
    idle: {
      on: {
        LOAD: {
          target: "loading",
          actions: assign({ productId: ({ event }) => event.productId, loadError: () => null }),
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
              desktopSections: data.desktopSections,
              mobileSections: data.mobileSections,
              settings: data.settings,
              modules: data.modules,
              isMobileSynced: data.isMobileSynced,
              originalDesktopSections: data.desktopSections,
              originalMobileSections: data.mobileSections,
              originalSettings: data.settings,
              loadError: null,
            };
          }),
        },
        onError: {
          target: "error",
          actions: assign({ loadError: ({ event }) => String(event.error) }),
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
        SET_ACTIVE_VIEWPORT: { actions: assign({ activeViewport: ({ event }) => event.viewport, selectedSectionId: () => null }) },
      },

      states: {
        pristine: {
          on: {
            COPY_DESKTOP_TO_MOBILE: { target: "dirty", actions: assign(({ context }) => ({ mobileSections: cloneDesktopToMobile(context.desktopSections), isMobileSynced: false })) },
            SET_MOBILE_SYNCED: { target: "dirty", actions: assign(({ context, event }) => event.synced && context.desktopSections.length > 0 ? { isMobileSynced: true, mobileSections: cloneDesktopToMobile(context.desktopSections) } : { isMobileSynced: event.synced }) },
            ADD_SECTION: { target: "dirty", actions: assign(({ context, event }) => ({ ...setActiveSections(context, addSectionToList(getActiveSections(context), event.section)), selectedSectionId: event.section.id })) },
            UPDATE_SECTION: { target: "dirty", actions: assign(({ context, event }) => setActiveSections(context, updateSectionInList(getActiveSections(context), event.id, event.updates))) },
            UPDATE_SECTION_SETTINGS: { target: "dirty", actions: assign(({ context, event }) => setActiveSections(context, updateSectionSettingsInList(getActiveSections(context), event.id, event.settings))) },
            DELETE_SECTION: { target: "dirty", actions: assign(({ context, event }) => ({ ...setActiveSections(context, deleteSectionFromList(getActiveSections(context), event.id)), selectedSectionId: getSelectedSectionAfterDelete(context.selectedSectionId, event.id) })) },
            REORDER_SECTIONS: { target: "dirty", actions: assign(({ context, event }) => setActiveSections(context, reorderSectionsInList(getActiveSections(context), event.orderedIds))) },
            DUPLICATE_SECTION: { target: "dirty", actions: assign(({ context, event }) => ({ ...setActiveSections(context, duplicateSectionInList(getActiveSections(context), event.original, event.duplicate)), selectedSectionId: event.duplicate.id })) },
            UPDATE_SETTINGS: { target: "dirty", actions: assign({ settings: ({ context, event }) => ({ ...context.settings, ...event.settings }) }) },
          },
        },

        dirty: {
          on: {
            COPY_DESKTOP_TO_MOBILE: { actions: assign(({ context }) => ({ mobileSections: cloneDesktopToMobile(context.desktopSections), isMobileSynced: false })) },
            SET_MOBILE_SYNCED: { actions: assign(({ context, event }) => event.synced && context.desktopSections.length > 0 ? { isMobileSynced: true, mobileSections: cloneDesktopToMobile(context.desktopSections) } : { isMobileSynced: event.synced }) },
            ADD_SECTION: { actions: assign(({ context, event }) => ({ ...setActiveSections(context, addSectionToList(getActiveSections(context), event.section)), selectedSectionId: event.section.id })) },
            UPDATE_SECTION: { actions: assign(({ context, event }) => setActiveSections(context, updateSectionInList(getActiveSections(context), event.id, event.updates))) },
            UPDATE_SECTION_SETTINGS: { actions: assign(({ context, event }) => setActiveSections(context, updateSectionSettingsInList(getActiveSections(context), event.id, event.settings))) },
            DELETE_SECTION: { actions: assign(({ context, event }) => ({ ...setActiveSections(context, deleteSectionFromList(getActiveSections(context), event.id)), selectedSectionId: getSelectedSectionAfterDelete(context.selectedSectionId, event.id) })) },
            REORDER_SECTIONS: { actions: assign(({ context, event }) => setActiveSections(context, reorderSectionsInList(getActiveSections(context), event.orderedIds))) },
            DUPLICATE_SECTION: { actions: assign(({ context, event }) => ({ ...setActiveSections(context, duplicateSectionInList(getActiveSections(context), event.original, event.duplicate)), selectedSectionId: event.duplicate.id })) },
            UPDATE_SETTINGS: { actions: assign({ settings: ({ context, event }) => ({ ...context.settings, ...event.settings }) }) },
            SAVE: { target: "#builder.saving", guard: "canSave" },
            DISCARD_CHANGES: { target: "pristine", actions: assign(({ context }) => ({ desktopSections: context.originalDesktopSections, mobileSections: context.originalMobileSections, settings: context.originalSettings, selectedSectionId: null })) },
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
          desktopSections: context.desktopSections,
          mobileSections: context.mobileSections,
          settings: context.settings,
          originalDesktopSections: context.originalDesktopSections,
          originalMobileSections: context.originalMobileSections,
        }),
        onDone: {
          target: "ready.pristine",
          actions: assign(({ context, event }) => {
            const data = event.output as SaveBuilderOutput;
            const updatedDesktop = data.updatedDesktopSections ?? context.desktopSections;
            const updatedMobile = data.updatedMobileSections ?? context.mobileSections;
            return {
              desktopSections: updatedDesktop,
              mobileSections: updatedMobile,
              originalDesktopSections: updatedDesktop,
              originalMobileSections: updatedMobile,
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
          actions: assign({ productId: ({ event }) => event.productId, loadError: () => null }),
        },
      },
    },
  },
});

export type BuilderMachine = typeof builderMachine;
