/**
 * Product Form State Machine - Main Machine Definition
 * 
 * XState v5 com tipagem correta usando setup().
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Nota 10/10
 */

import { setup, assign } from "xstate";
import type {
  ProductFormContext,
  ProductFormEvent,
  StartLoadingEvent,
  DataLoadedEvent,
  LoadErrorEvent,
  UpdateGeneralEvent,
  UpdateImageEvent,
  UpdateOffersEvent,
  AddDeletedOfferEvent,
  UpdateUpsellEvent,
  UpdateAffiliateEvent,
  UpdateCheckoutSettingsEvent,
  InitCheckoutSettingsEvent,
  SetValidationErrorEvent,
  ValidationFailedEvent,
  SaveSuccessEvent,
  SaveErrorEvent,
} from "./productFormMachine.types";
import {
  createInitialContext,
  calculateDirtyFlags,
  anyDirty,
  deriveGeneralFromProduct,
  INITIAL_IMAGE_STATE,
  INITIAL_VALIDATION,
} from "./productFormMachine.helpers";
import type { ServerDataSnapshot, EditedFormData } from "../types/productForm.types";

// ============================================================================
// MACHINE SETUP - XState v5 Pattern
// ============================================================================

export const productFormMachine = setup({
  types: {
    context: {} as ProductFormContext,
    events: {} as ProductFormEvent,
  },
  guards: {
    canRetry: ({ context }) => context.saveAttempts < 3,
  },
}).createMachine({
  id: "productForm",
  initial: "idle",
  context: createInitialContext(),
  
  states: {
    // ========================================================================
    // IDLE - Estado inicial
    // ========================================================================
    idle: {
      on: {
        START_LOADING: {
          target: "loading",
          actions: assign(({ event }) => {
            const e = event as StartLoadingEvent;
            return {
              productId: e.productId,
              userId: e.userId,
              errorMessage: null,
            };
          }),
        },
      },
    },
    
    // ========================================================================
    // LOADING - Carregando dados
    // ========================================================================
    loading: {
      on: {
        DATA_LOADED: {
          target: "editing",
          actions: assign(({ event }) => {
            const e = event as DataLoadedEvent;
            const { product, upsellSettings, affiliateSettings, offers } = e.data;
            const general = deriveGeneralFromProduct(product);
            
            const serverData: ServerDataSnapshot = {
              product,
              general,
              upsell: upsellSettings,
              affiliateSettings,
              offers,
              checkoutSettings: {
                required_fields: { name: true, email: true, phone: false, cpf: false },
                default_payment_method: "pix",
                pix_gateway: "mercadopago",
                credit_card_gateway: "mercadopago",
              },
            };
            
            const editedData: EditedFormData = {
              general,
              image: {
                imageFile: null,
                imageUrl: product?.image_url || "",
                pendingRemoval: false,
              },
              offers: {
                localOffers: offers,
                deletedOfferIds: [],
                modified: false,
              },
              upsell: upsellSettings,
              affiliate: affiliateSettings,
              checkoutSettings: serverData.checkoutSettings,
            };
            
            return {
              serverData,
              editedData,
              isDirty: false,
              dirtyFlags: {
                general: false,
                image: false,
                offers: false,
                upsell: false,
                affiliate: false,
                checkoutSettings: false,
              },
              errorMessage: null,
            };
          }),
        },
        LOAD_ERROR: {
          target: "error",
          actions: assign(({ event }) => ({
            errorMessage: (event as LoadErrorEvent).error,
          })),
        },
      },
    },
    
    // ========================================================================
    // EDITING - Estado principal
    // ========================================================================
    editing: {
      on: {
        UPDATE_GENERAL: {
          actions: assign(({ context, event }) => {
            const e = event as UpdateGeneralEvent;
            const newGeneral = { ...context.editedData.general, ...e.data };
            const newEditedData = { ...context.editedData, general: newGeneral };
            const newDirtyFlags = calculateDirtyFlags(newEditedData, context.serverData);
            return {
              editedData: newEditedData,
              dirtyFlags: newDirtyFlags,
              isDirty: anyDirty(newDirtyFlags),
            };
          }),
        },
        
        UPDATE_IMAGE: {
          actions: assign(({ context, event }) => {
            const e = event as UpdateImageEvent;
            const newImage = { ...context.editedData.image, ...e.data };
            const newEditedData = { ...context.editedData, image: newImage };
            const newDirtyFlags = calculateDirtyFlags(newEditedData, context.serverData);
            return {
              editedData: newEditedData,
              dirtyFlags: newDirtyFlags,
              isDirty: anyDirty(newDirtyFlags),
            };
          }),
        },
        
        RESET_IMAGE: {
          actions: assign(({ context }) => {
            const newEditedData = { ...context.editedData, image: INITIAL_IMAGE_STATE };
            const newDirtyFlags = calculateDirtyFlags(newEditedData, context.serverData);
            return {
              editedData: newEditedData,
              dirtyFlags: newDirtyFlags,
              isDirty: anyDirty(newDirtyFlags),
            };
          }),
        },
        
        UPDATE_OFFERS: {
          actions: assign(({ context, event }) => {
            const e = event as UpdateOffersEvent;
            const newOffers = {
              localOffers: e.data.localOffers ?? context.editedData.offers.localOffers,
              deletedOfferIds: e.data.deletedOfferIds ?? context.editedData.offers.deletedOfferIds,
              modified: e.data.modified ?? context.editedData.offers.modified,
            };
            const newEditedData = { ...context.editedData, offers: newOffers };
            const newDirtyFlags = calculateDirtyFlags(newEditedData, context.serverData);
            return {
              editedData: newEditedData,
              dirtyFlags: newDirtyFlags,
              isDirty: anyDirty(newDirtyFlags),
            };
          }),
        },
        
        ADD_DELETED_OFFER: {
          actions: assign(({ context, event }) => {
            const e = event as AddDeletedOfferEvent;
            return {
              editedData: {
                ...context.editedData,
                offers: {
                  ...context.editedData.offers,
                  deletedOfferIds: [...context.editedData.offers.deletedOfferIds, e.offerId],
                },
              },
              isDirty: true,
              dirtyFlags: { ...context.dirtyFlags, offers: true },
            };
          }),
        },
        
        UPDATE_UPSELL: {
          actions: assign(({ context, event }) => {
            const e = event as UpdateUpsellEvent;
            const newUpsell = { ...context.editedData.upsell, ...e.data };
            const newEditedData = { ...context.editedData, upsell: newUpsell };
            const newDirtyFlags = calculateDirtyFlags(newEditedData, context.serverData);
            return {
              editedData: newEditedData,
              dirtyFlags: newDirtyFlags,
              isDirty: anyDirty(newDirtyFlags),
            };
          }),
        },
        
        UPDATE_AFFILIATE: {
          actions: assign(({ context, event }) => {
            const e = event as UpdateAffiliateEvent;
            const current = context.editedData.affiliate;
            const newAffiliate = current ? { ...current, ...e.data } : e.data as typeof current;
            const newEditedData = { ...context.editedData, affiliate: newAffiliate };
            const newDirtyFlags = calculateDirtyFlags(newEditedData, context.serverData);
            return {
              editedData: newEditedData,
              dirtyFlags: newDirtyFlags,
              isDirty: anyDirty(newDirtyFlags),
            };
          }),
        },
        
        UPDATE_CHECKOUT_SETTINGS: {
          actions: assign(({ context, event }) => {
            const e = event as UpdateCheckoutSettingsEvent;
            const newSettings = { ...context.editedData.checkoutSettings, ...e.data };
            const newEditedData = { ...context.editedData, checkoutSettings: newSettings };
            const newDirtyFlags = calculateDirtyFlags(newEditedData, context.serverData);
            return {
              editedData: newEditedData,
              dirtyFlags: newDirtyFlags,
              isDirty: anyDirty(newDirtyFlags),
            };
          }),
        },
        
        INIT_CHECKOUT_SETTINGS: {
          actions: assign(({ context, event }) => {
            const e = event as InitCheckoutSettingsEvent;
            return {
              editedData: { ...context.editedData, checkoutSettings: e.settings },
              serverData: { ...context.serverData, checkoutSettings: { ...e.settings } },
              checkoutCredentials: e.credentials,
            };
          }),
        },
        
        SET_VALIDATION_ERROR: {
          actions: assign(({ context, event }) => {
            const e = event as SetValidationErrorEvent;
            return {
              validation: {
                ...context.validation,
                [e.section]: {
                  ...context.validation[e.section],
                  [e.field]: e.error,
                },
              },
            };
          }),
        },
        
        CLEAR_VALIDATION_ERRORS: {
          actions: assign(() => ({
            validation: INITIAL_VALIDATION,
          })),
        },
        
        REQUEST_SAVE: {
          target: "validating",
        },
        
        DISCARD_CHANGES: {
          actions: assign(({ context }) => {
            const editedData: EditedFormData = {
              general: { ...context.serverData.general },
              image: {
                imageFile: null,
                imageUrl: context.serverData.product?.image_url || "",
                pendingRemoval: false,
              },
              offers: {
                localOffers: [...context.serverData.offers],
                deletedOfferIds: [],
                modified: false,
              },
              upsell: { ...context.serverData.upsell },
              affiliate: context.serverData.affiliateSettings
                ? { ...context.serverData.affiliateSettings }
                : null,
              checkoutSettings: { ...context.serverData.checkoutSettings },
            };
            return {
              editedData,
              isDirty: false,
              dirtyFlags: {
                general: false,
                image: false,
                offers: false,
                upsell: false,
                affiliate: false,
                checkoutSettings: false,
              },
              validation: INITIAL_VALIDATION,
              errorMessage: null,
            };
          }),
        },
        
        RESET_TO_SERVER: {
          actions: assign(({ context }) => {
            const editedData: EditedFormData = {
              general: { ...context.serverData.general },
              image: {
                imageFile: null,
                imageUrl: context.serverData.product?.image_url || "",
                pendingRemoval: false,
              },
              offers: {
                localOffers: [...context.serverData.offers],
                deletedOfferIds: [],
                modified: false,
              },
              upsell: { ...context.serverData.upsell },
              affiliate: context.serverData.affiliateSettings
                ? { ...context.serverData.affiliateSettings }
                : null,
              checkoutSettings: { ...context.serverData.checkoutSettings },
            };
            return {
              editedData,
              isDirty: false,
              dirtyFlags: {
                general: false,
                image: false,
                offers: false,
                upsell: false,
                affiliate: false,
                checkoutSettings: false,
              },
              validation: INITIAL_VALIDATION,
              errorMessage: null,
            };
          }),
        },
        
        START_LOADING: {
          target: "loading",
          actions: assign(({ event }) => {
            const e = event as StartLoadingEvent;
            return {
              productId: e.productId,
              userId: e.userId,
              errorMessage: null,
            };
          }),
        },
      },
    },
    
    // ========================================================================
    // VALIDATING
    // ========================================================================
    validating: {
      on: {
        VALIDATION_PASSED: {
          target: "saving",
          actions: assign(({ context }) => ({
            saveAttempts: context.saveAttempts + 1,
          })),
        },
        VALIDATION_FAILED: {
          target: "editing",
          actions: assign(({ event }) => ({
            validation: (event as ValidationFailedEvent).errors,
          })),
        },
      },
    },
    
    // ========================================================================
    // SAVING
    // ========================================================================
    saving: {
      on: {
        SAVE_SUCCESS: {
          target: "saved",
          actions: assign(({ context, event }) => {
            const e = event as SaveSuccessEvent;
            return {
              serverData: {
                ...context.serverData,
                general: { ...context.editedData.general },
                upsell: { ...context.editedData.upsell },
                affiliateSettings: context.editedData.affiliate
                  ? { ...context.editedData.affiliate }
                  : null,
                offers: [...context.editedData.offers.localOffers],
                checkoutSettings: { ...context.editedData.checkoutSettings },
                ...(e.newServerData || {}),
              },
              editedData: {
                ...context.editedData,
                image: INITIAL_IMAGE_STATE,
                offers: {
                  ...context.editedData.offers,
                  deletedOfferIds: [],
                  modified: false,
                },
              },
              isDirty: false,
              dirtyFlags: {
                general: false,
                image: false,
                offers: false,
                upsell: false,
                affiliate: false,
                checkoutSettings: false,
              },
              saveAttempts: 0,
              errorMessage: null,
            };
          }),
        },
        SAVE_ERROR: {
          target: "error",
          actions: assign(({ event }) => ({
            errorMessage: (event as SaveErrorEvent).error,
          })),
        },
      },
    },
    
    // ========================================================================
    // SAVED
    // ========================================================================
    saved: {
      on: {
        CONTINUE_EDITING: {
          target: "editing",
        },
        UPDATE_GENERAL: {
          target: "editing",
          actions: assign(({ context, event }) => {
            const e = event as UpdateGeneralEvent;
            return {
              editedData: {
                ...context.editedData,
                general: { ...context.editedData.general, ...e.data },
              },
              isDirty: true,
              dirtyFlags: { ...context.dirtyFlags, general: true },
            };
          }),
        },
      },
    },
    
    // ========================================================================
    // ERROR
    // ========================================================================
    error: {
      on: {
        RETRY: {
          target: "loading",
          guard: "canRetry",
        },
        CONTINUE_EDITING: {
          target: "editing",
        },
        START_LOADING: {
          target: "loading",
          actions: assign(({ event }) => {
            const e = event as StartLoadingEvent;
            return {
              productId: e.productId,
              userId: e.userId,
              errorMessage: null,
            };
          }),
        },
      },
    },
  },
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ProductFormMachine = typeof productFormMachine;
