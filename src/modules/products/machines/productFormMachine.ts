/**
 * Product Form State Machine - Main Machine Definition
 * 
 * Esta é a definição principal da máquina de estados XState.
 * Implementa transições formais e previsíveis para todo o ciclo
 * de vida do formulário de produto.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Nota 10/10
 */

import { createMachine, assign } from "xstate";
import type {
  ProductFormContext,
  ProductFormEvent,
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
// MACHINE DEFINITION
// ============================================================================

export const productFormMachine = createMachine({
  id: "productForm",
  initial: "idle",
  context: createInitialContext(),
  types: {} as {
    context: ProductFormContext;
    events: ProductFormEvent;
  },
  
  states: {
    // ========================================================================
    // IDLE - Estado inicial, aguardando dados
    // ========================================================================
    idle: {
      on: {
        START_LOADING: {
          target: "loading",
          actions: assign({
            productId: ({ event }) => event.productId,
            userId: ({ event }) => event.userId,
            errorMessage: () => null,
          }),
        },
      },
    },
    
    // ========================================================================
    // LOADING - Carregando dados do servidor
    // ========================================================================
    loading: {
      on: {
        DATA_LOADED: {
          target: "editing",
          actions: assign({
            serverData: ({ event }): ServerDataSnapshot => {
              const { product, upsellSettings, affiliateSettings, offers } = event.data;
              const general = deriveGeneralFromProduct(product);
              return {
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
            },
            editedData: ({ event }): EditedFormData => {
              const { product, upsellSettings, affiliateSettings, offers } = event.data;
              const general = deriveGeneralFromProduct(product);
              return {
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
                checkoutSettings: {
                  required_fields: { name: true, email: true, phone: false, cpf: false },
                  default_payment_method: "pix",
                  pix_gateway: "mercadopago",
                  credit_card_gateway: "mercadopago",
                },
              };
            },
            isDirty: () => false,
            dirtyFlags: () => ({
              general: false,
              image: false,
              offers: false,
              upsell: false,
              affiliate: false,
              checkoutSettings: false,
            }),
            errorMessage: () => null,
          }),
        },
        LOAD_ERROR: {
          target: "error",
          actions: assign({
            errorMessage: ({ event }) => event.error,
          }),
        },
      },
    },
    
    // ========================================================================
    // EDITING - Estado principal de edição
    // ========================================================================
    editing: {
      on: {
        // Atualizações de formulário
        UPDATE_GENERAL: {
          actions: assign({
            editedData: ({ context, event }) => ({
              ...context.editedData,
              general: { ...context.editedData.general, ...event.data },
            }),
            dirtyFlags: ({ context, event }) => {
              const newGeneral = { ...context.editedData.general, ...event.data };
              const newEditedData = { ...context.editedData, general: newGeneral };
              return calculateDirtyFlags(newEditedData, context.serverData);
            },
            isDirty: ({ context, event }) => {
              const newGeneral = { ...context.editedData.general, ...event.data };
              const newEditedData = { ...context.editedData, general: newGeneral };
              return anyDirty(calculateDirtyFlags(newEditedData, context.serverData));
            },
          }),
        },
        
        UPDATE_IMAGE: {
          actions: assign({
            editedData: ({ context, event }) => ({
              ...context.editedData,
              image: { ...context.editedData.image, ...event.data },
            }),
            dirtyFlags: ({ context, event }) => {
              const newImage = { ...context.editedData.image, ...event.data };
              const newEditedData = { ...context.editedData, image: newImage };
              return calculateDirtyFlags(newEditedData, context.serverData);
            },
            isDirty: ({ context, event }) => {
              const newImage = { ...context.editedData.image, ...event.data };
              const newEditedData = { ...context.editedData, image: newImage };
              return anyDirty(calculateDirtyFlags(newEditedData, context.serverData));
            },
          }),
        },
        
        RESET_IMAGE: {
          actions: assign({
            editedData: ({ context }) => ({
              ...context.editedData,
              image: INITIAL_IMAGE_STATE,
            }),
            dirtyFlags: ({ context }) => {
              const newEditedData = { ...context.editedData, image: INITIAL_IMAGE_STATE };
              return calculateDirtyFlags(newEditedData, context.serverData);
            },
            isDirty: ({ context }) => {
              const newEditedData = { ...context.editedData, image: INITIAL_IMAGE_STATE };
              return anyDirty(calculateDirtyFlags(newEditedData, context.serverData));
            },
          }),
        },
        
        UPDATE_OFFERS: {
          actions: assign({
            editedData: ({ context, event }) => ({
              ...context.editedData,
              offers: {
                localOffers: event.data.localOffers ?? context.editedData.offers.localOffers,
                deletedOfferIds: event.data.deletedOfferIds ?? context.editedData.offers.deletedOfferIds,
                modified: event.data.modified ?? context.editedData.offers.modified,
              },
            }),
            dirtyFlags: ({ context, event }) => {
              const newOffers = {
                localOffers: event.data.localOffers ?? context.editedData.offers.localOffers,
                deletedOfferIds: event.data.deletedOfferIds ?? context.editedData.offers.deletedOfferIds,
                modified: event.data.modified ?? context.editedData.offers.modified,
              };
              const newEditedData = { ...context.editedData, offers: newOffers };
              return calculateDirtyFlags(newEditedData, context.serverData);
            },
            isDirty: ({ context, event }) => {
              const newOffers = {
                localOffers: event.data.localOffers ?? context.editedData.offers.localOffers,
                deletedOfferIds: event.data.deletedOfferIds ?? context.editedData.offers.deletedOfferIds,
                modified: event.data.modified ?? context.editedData.offers.modified,
              };
              const newEditedData = { ...context.editedData, offers: newOffers };
              return anyDirty(calculateDirtyFlags(newEditedData, context.serverData));
            },
          }),
        },
        
        ADD_DELETED_OFFER: {
          actions: assign({
            editedData: ({ context, event }) => ({
              ...context.editedData,
              offers: {
                ...context.editedData.offers,
                deletedOfferIds: [...context.editedData.offers.deletedOfferIds, event.offerId],
              },
            }),
            isDirty: () => true,
            dirtyFlags: ({ context }) => ({ ...context.dirtyFlags, offers: true }),
          }),
        },
        
        UPDATE_UPSELL: {
          actions: assign({
            editedData: ({ context, event }) => ({
              ...context.editedData,
              upsell: { ...context.editedData.upsell, ...event.data },
            }),
            dirtyFlags: ({ context, event }) => {
              const newUpsell = { ...context.editedData.upsell, ...event.data };
              const newEditedData = { ...context.editedData, upsell: newUpsell };
              return calculateDirtyFlags(newEditedData, context.serverData);
            },
            isDirty: ({ context, event }) => {
              const newUpsell = { ...context.editedData.upsell, ...event.data };
              const newEditedData = { ...context.editedData, upsell: newUpsell };
              return anyDirty(calculateDirtyFlags(newEditedData, context.serverData));
            },
          }),
        },
        
        UPDATE_AFFILIATE: {
          actions: assign({
            editedData: ({ context, event }) => {
              const current = context.editedData.affiliate;
              return {
                ...context.editedData,
                affiliate: current ? { ...current, ...event.data } : event.data as typeof current,
              };
            },
            dirtyFlags: ({ context, event }) => {
              const current = context.editedData.affiliate;
              const newAffiliate = current ? { ...current, ...event.data } : event.data;
              const newEditedData = { ...context.editedData, affiliate: newAffiliate as typeof current };
              return calculateDirtyFlags(newEditedData, context.serverData);
            },
            isDirty: ({ context, event }) => {
              const current = context.editedData.affiliate;
              const newAffiliate = current ? { ...current, ...event.data } : event.data;
              const newEditedData = { ...context.editedData, affiliate: newAffiliate as typeof current };
              return anyDirty(calculateDirtyFlags(newEditedData, context.serverData));
            },
          }),
        },
        
        UPDATE_CHECKOUT_SETTINGS: {
          actions: assign({
            editedData: ({ context, event }) => ({
              ...context.editedData,
              checkoutSettings: { ...context.editedData.checkoutSettings, ...event.data },
            }),
            dirtyFlags: ({ context, event }) => {
              const newSettings = { ...context.editedData.checkoutSettings, ...event.data };
              const newEditedData = { ...context.editedData, checkoutSettings: newSettings };
              return calculateDirtyFlags(newEditedData, context.serverData);
            },
            isDirty: ({ context, event }) => {
              const newSettings = { ...context.editedData.checkoutSettings, ...event.data };
              const newEditedData = { ...context.editedData, checkoutSettings: newSettings };
              return anyDirty(calculateDirtyFlags(newEditedData, context.serverData));
            },
          }),
        },
        
        INIT_CHECKOUT_SETTINGS: {
          actions: assign({
            editedData: ({ context, event }) => ({
              ...context.editedData,
              checkoutSettings: event.settings,
            }),
            serverData: ({ context, event }) => ({
              ...context.serverData,
              checkoutSettings: { ...event.settings },
            }),
            checkoutCredentials: ({ event }) => event.credentials,
          }),
        },
        
        // Validação
        SET_VALIDATION_ERROR: {
          actions: assign({
            validation: ({ context, event }) => ({
              ...context.validation,
              [event.section]: {
                ...context.validation[event.section],
                [event.field]: event.error,
              },
            }),
          }),
        },
        
        CLEAR_VALIDATION_ERRORS: {
          actions: assign({
            validation: () => INITIAL_VALIDATION,
          }),
        },
        
        // Transições de estado
        REQUEST_SAVE: {
          target: "validating",
        },
        
        DISCARD_CHANGES: {
          actions: assign({
            editedData: ({ context }): EditedFormData => ({
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
            }),
            isDirty: () => false,
            dirtyFlags: () => ({
              general: false,
              image: false,
              offers: false,
              upsell: false,
              affiliate: false,
              checkoutSettings: false,
            }),
            validation: () => INITIAL_VALIDATION,
            errorMessage: () => null,
          }),
        },
        
        RESET_TO_SERVER: {
          actions: assign({
            editedData: ({ context }): EditedFormData => ({
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
            }),
            isDirty: () => false,
            dirtyFlags: () => ({
              general: false,
              image: false,
              offers: false,
              upsell: false,
              affiliate: false,
              checkoutSettings: false,
            }),
            validation: () => INITIAL_VALIDATION,
            errorMessage: () => null,
          }),
        },
        
        START_LOADING: {
          target: "loading",
          actions: assign({
            productId: ({ event }) => event.productId,
            userId: ({ event }) => event.userId,
            errorMessage: () => null,
          }),
        },
      },
    },
    
    // ========================================================================
    // VALIDATING - Validando dados antes de salvar
    // ========================================================================
    validating: {
      on: {
        VALIDATION_PASSED: {
          target: "saving",
          actions: assign({
            saveAttempts: ({ context }) => context.saveAttempts + 1,
          }),
        },
        VALIDATION_FAILED: {
          target: "editing",
          actions: assign({
            validation: ({ event }) => event.errors,
          }),
        },
      },
    },
    
    // ========================================================================
    // SAVING - Salvando dados no servidor
    // ========================================================================
    saving: {
      on: {
        SAVE_SUCCESS: {
          target: "saved",
          actions: assign({
            serverData: ({ context, event }) => ({
              ...context.serverData,
              general: { ...context.editedData.general },
              upsell: { ...context.editedData.upsell },
              affiliateSettings: context.editedData.affiliate
                ? { ...context.editedData.affiliate }
                : null,
              offers: [...context.editedData.offers.localOffers],
              checkoutSettings: { ...context.editedData.checkoutSettings },
              ...(event.newServerData || {}),
            }),
            editedData: ({ context }) => ({
              ...context.editedData,
              image: INITIAL_IMAGE_STATE,
              offers: {
                ...context.editedData.offers,
                deletedOfferIds: [],
                modified: false,
              },
            }),
            isDirty: () => false,
            dirtyFlags: () => ({
              general: false,
              image: false,
              offers: false,
              upsell: false,
              affiliate: false,
              checkoutSettings: false,
            }),
            saveAttempts: () => 0,
            errorMessage: () => null,
          }),
        },
        SAVE_ERROR: {
          target: "error",
          actions: assign({
            errorMessage: ({ event }) => event.error,
          }),
        },
      },
    },
    
    // ========================================================================
    // SAVED - Dados salvos com sucesso
    // ========================================================================
    saved: {
      on: {
        CONTINUE_EDITING: {
          target: "editing",
        },
        UPDATE_GENERAL: {
          target: "editing",
          actions: assign({
            editedData: ({ context, event }) => ({
              ...context.editedData,
              general: { ...context.editedData.general, ...event.data },
            }),
            isDirty: () => true,
            dirtyFlags: ({ context }) => ({ ...context.dirtyFlags, general: true }),
          }),
        },
      },
    },
    
    // ========================================================================
    // ERROR - Estado de erro
    // ========================================================================
    error: {
      on: {
        RETRY: {
          target: "loading",
          guard: ({ context }) => context.saveAttempts < 3,
        },
        CONTINUE_EDITING: {
          target: "editing",
        },
        START_LOADING: {
          target: "loading",
          actions: assign({
            productId: ({ event }) => event.productId,
            userId: ({ event }) => event.userId,
            errorMessage: () => null,
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
