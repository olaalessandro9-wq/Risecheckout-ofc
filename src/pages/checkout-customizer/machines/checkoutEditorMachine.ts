/**
 * Checkout Editor State Machine
 * 
 * SSOT for checkout editor state. Mirrors Members Area Builder pattern.
 * Dual-layout support: independent Desktop/Mobile customizations.
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module checkout-customizer/machines
 */

import { setup, assign } from "xstate";
import { DEFAULT_CHECKOUT_DESIGN } from "@/hooks/checkout/defaultCheckoutDesign";
import type {
  CheckoutEditorMachineContext,
  CheckoutEditorMachineEvent,
  LoadEditorOutput,
  SaveEditorOutput,
  SaveEditorInput,
} from "./checkoutEditorMachine.types";
import { loadEditorActor, saveEditorActor } from "./checkoutEditorMachine.actors";
import { canSave } from "./checkoutEditorMachine.guards";
import {
  getActiveCustomization,
  setActiveCustomization,
  cloneDesktopToMobile,
  updateComponentInCustomization,
  removeComponentFromCustomization,
  duplicateComponentInCustomization,
  moveComponentInCustomization,
  handleDragEndAction,
  getSelectedAfterRemove,
} from "./checkoutEditorMachine.actions";

// ============================================================================
// INITIAL CONTEXT
// ============================================================================

export const initialEditorContext: CheckoutEditorMachineContext = {
  checkoutId: null,
  desktopCustomization: DEFAULT_CHECKOUT_DESIGN,
  mobileCustomization: DEFAULT_CHECKOUT_DESIGN,
  activeViewport: "desktop",
  isMobileSynced: true,
  selectedComponentId: null,
  viewMode: "desktop",
  isPreviewMode: false,
  activeTab: "components",
  activeId: null,
  originalDesktopCustomization: DEFAULT_CHECKOUT_DESIGN,
  originalMobileCustomization: DEFAULT_CHECKOUT_DESIGN,
  originalIsMobileSynced: true,
  productData: null,
  orderBumps: [],
  productOffers: [],
  currentLinks: [],
  loadError: null,
  saveError: null,
};

// ============================================================================
// STATE MACHINE
// ============================================================================

export const checkoutEditorMachine = setup({
  types: {
    context: {} as CheckoutEditorMachineContext,
    events: {} as CheckoutEditorMachineEvent,
  },
  actors: { loadEditor: loadEditorActor, saveEditor: saveEditorActor },
  guards: { canSave },
}).createMachine({
  id: "checkoutEditor",
  initial: "idle",
  context: initialEditorContext,

  states: {
    idle: {
      on: {
        LOAD: {
          target: "loading",
          actions: assign({
            checkoutId: ({ event }) => event.checkoutId,
            loadError: () => null,
          }),
        },
      },
    },

    loading: {
      invoke: {
        src: "loadEditor",
        input: ({ context }) => ({ checkoutId: context.checkoutId }),
        onDone: {
          target: "ready",
          actions: assign(({ event }) => {
            const d = event.output as LoadEditorOutput;
            return {
              desktopCustomization: d.desktopCustomization,
              mobileCustomization: d.mobileCustomization,
              isMobileSynced: d.isMobileSynced,
              originalDesktopCustomization: JSON.parse(JSON.stringify(d.desktopCustomization)),
              originalMobileCustomization: JSON.parse(JSON.stringify(d.mobileCustomization)),
              originalIsMobileSynced: d.isMobileSynced,
              productData: d.productData,
              orderBumps: d.orderBumps,
              productOffers: d.productOffers,
              currentLinks: d.currentLinks,
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
        REFRESH: {
          target: "loading",
          actions: assign({ loadError: () => null }),
        },
        SET_PREVIEW_MODE: {
          actions: assign({ isPreviewMode: ({ event }) => event.enabled }),
        },
        SET_ACTIVE_TAB: {
          actions: assign({ activeTab: ({ event }) => event.tab }),
        },
        SELECT_COMPONENT: {
          actions: assign({ selectedComponentId: ({ event }) => event.id }),
        },
        SET_ACTIVE_VIEWPORT: {
          actions: assign({
            activeViewport: ({ event }) => event.viewport,
            viewMode: ({ event }) => event.viewport,
            selectedComponentId: () => null,
          }),
        },
        DRAG_START: {
          actions: assign({ activeId: ({ event }) => event.event.active.id as string }),
        },
      },

      states: {
        pristine: {
          on: {
            UPDATE_DESIGN: {
              target: "dirty",
              actions: assign(({ context, event }) => {
                const updated = { ...getActiveCustomization(context), design: event.design };
                return setActiveCustomization(context, updated);
              }),
            },
            UPDATE_COMPONENT: {
              target: "dirty",
              actions: assign(({ context, event }) => {
                const active = getActiveCustomization(context);
                const updated = updateComponentInCustomization(active, event.componentId, event.content);
                return setActiveCustomization(context, updated);
              }),
            },
            REMOVE_COMPONENT: {
              target: "dirty",
              actions: assign(({ context, event }) => {
                const active = getActiveCustomization(context);
                const updated = removeComponentFromCustomization(active, event.componentId);
                return {
                  ...setActiveCustomization(context, updated),
                  selectedComponentId: getSelectedAfterRemove(context.selectedComponentId, event.componentId),
                };
              }),
            },
            DUPLICATE_COMPONENT: {
              target: "dirty",
              actions: assign(({ context, event }) => {
                const active = getActiveCustomization(context);
                const updated = duplicateComponentInCustomization(active, event.componentId);
                return setActiveCustomization(context, updated);
              }),
            },
            MOVE_COMPONENT: {
              target: "dirty",
              actions: assign(({ context, event }) => {
                const active = getActiveCustomization(context);
                const updated = moveComponentInCustomization(active, event.componentId, event.direction);
                return setActiveCustomization(context, updated);
              }),
            },
            DRAG_END: {
              target: "dirty",
              actions: assign(({ context, event }) => {
                const active = getActiveCustomization(context);
                const { customization, newComponentId } = handleDragEndAction(active, event.event);
                return {
                  ...setActiveCustomization(context, customization),
                  activeId: null,
                  selectedComponentId: newComponentId ?? context.selectedComponentId,
                };
              }),
            },
            COPY_DESKTOP_TO_MOBILE: {
              target: "dirty",
              actions: assign(({ context }) => ({
                mobileCustomization: cloneDesktopToMobile(context.desktopCustomization),
                isMobileSynced: false,
              })),
            },
            SET_MOBILE_SYNCED: {
              target: "dirty",
              actions: assign(({ context, event }) =>
                event.synced
                  ? {
                      isMobileSynced: true,
                      mobileCustomization: cloneDesktopToMobile(context.desktopCustomization),
                    }
                  : { isMobileSynced: false }
              ),
            },
          },
        },

        dirty: {
          on: {
            UPDATE_DESIGN: {
              actions: assign(({ context, event }) => {
                const updated = { ...getActiveCustomization(context), design: event.design };
                return setActiveCustomization(context, updated);
              }),
            },
            UPDATE_COMPONENT: {
              actions: assign(({ context, event }) => {
                const active = getActiveCustomization(context);
                const updated = updateComponentInCustomization(active, event.componentId, event.content);
                return setActiveCustomization(context, updated);
              }),
            },
            REMOVE_COMPONENT: {
              actions: assign(({ context, event }) => {
                const active = getActiveCustomization(context);
                const updated = removeComponentFromCustomization(active, event.componentId);
                return {
                  ...setActiveCustomization(context, updated),
                  selectedComponentId: getSelectedAfterRemove(context.selectedComponentId, event.componentId),
                };
              }),
            },
            DUPLICATE_COMPONENT: {
              actions: assign(({ context, event }) => {
                const active = getActiveCustomization(context);
                const updated = duplicateComponentInCustomization(active, event.componentId);
                return setActiveCustomization(context, updated);
              }),
            },
            MOVE_COMPONENT: {
              actions: assign(({ context, event }) => {
                const active = getActiveCustomization(context);
                const updated = moveComponentInCustomization(active, event.componentId, event.direction);
                return setActiveCustomization(context, updated);
              }),
            },
            DRAG_END: {
              actions: assign(({ context, event }) => {
                const active = getActiveCustomization(context);
                const { customization, newComponentId } = handleDragEndAction(active, event.event);
                return {
                  ...setActiveCustomization(context, customization),
                  activeId: null,
                  selectedComponentId: newComponentId ?? context.selectedComponentId,
                };
              }),
            },
            COPY_DESKTOP_TO_MOBILE: {
              actions: assign(({ context }) => ({
                mobileCustomization: cloneDesktopToMobile(context.desktopCustomization),
                isMobileSynced: false,
              })),
            },
            SET_MOBILE_SYNCED: {
              actions: assign(({ context, event }) =>
                event.synced
                  ? {
                      isMobileSynced: true,
                      mobileCustomization: cloneDesktopToMobile(context.desktopCustomization),
                    }
                  : { isMobileSynced: false }
              ),
            },
            SAVE: {
              target: "#checkoutEditor.saving",
              guard: "canSave",
            },
            DISCARD_CHANGES: {
              target: "pristine",
              actions: assign(({ context }) => ({
                desktopCustomization: JSON.parse(JSON.stringify(context.originalDesktopCustomization)),
                mobileCustomization: JSON.parse(JSON.stringify(context.originalMobileCustomization)),
                isMobileSynced: context.originalIsMobileSynced,
                selectedComponentId: null,
              })),
            },
          },
        },
      },
    },

    saving: {
      entry: assign({ saveError: () => null }),
      invoke: {
        src: "saveEditor",
        input: ({ context }): SaveEditorInput => ({
          checkoutId: context.checkoutId,
          desktopCustomization: context.desktopCustomization,
          mobileCustomization: context.mobileCustomization,
          isMobileSynced: context.isMobileSynced,
        }),
        onDone: {
          target: "ready.pristine",
          actions: assign(({ context }) => ({
            originalDesktopCustomization: JSON.parse(JSON.stringify(context.desktopCustomization)),
            originalMobileCustomization: JSON.parse(JSON.stringify(context.mobileCustomization)),
            originalIsMobileSynced: context.isMobileSynced,
            saveError: null,
          })),
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
            checkoutId: ({ event }) => event.checkoutId,
            loadError: () => null,
          }),
        },
      },
    },
  },
});

export type CheckoutEditorMachine = typeof checkoutEditorMachine;
