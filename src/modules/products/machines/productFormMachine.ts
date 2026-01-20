/**
 * ProductFormMachine - State Machine Principal
 * 
 * Single Source of Truth para todo o estado do módulo de Produtos.
 * Implementa o padrão Actor Model com XState v5.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solução 10.0/10
 * @module products/machines
 */

import { setup, assign } from "xstate";
import type { ProductFormContext, ProductFormEvent, MappedProductData } from "./productFormMachine.types";
import { loadProductActor, saveAllActor } from "./productFormMachine.actors";

// ============================================================================
// INITIAL CONTEXT
// ============================================================================

export const initialContext: ProductFormContext = {
  serverData: {
    product: null,
    general: {
      name: "",
      description: "",
      price: 0,
      support_name: "",
      support_email: "",
      delivery_url: "",
      external_delivery: false,
    },
    upsell: {
      hasCustomThankYouPage: false,
      customPageUrl: "",
      redirectIgnoringOrderBumpFailures: false,
    },
    affiliateSettings: null,
    offers: [],
    checkoutSettings: {
      required_fields: { name: true, email: true, phone: true, cpf: false },
      default_payment_method: "credit_card",
      pix_gateway: "",
      credit_card_gateway: "",
    },
  },
  editedData: {
    general: {
      name: "",
      description: "",
      price: 0,
      support_name: "",
      support_email: "",
      delivery_url: "",
      external_delivery: false,
    },
    image: { imageFile: null, imageUrl: "", pendingRemoval: false },
    offers: { localOffers: [], deletedOfferIds: [], modified: false },
    upsell: { hasCustomThankYouPage: false, customPageUrl: "", redirectIgnoringOrderBumpFailures: false },
    affiliate: null,
    checkoutSettings: {
      required_fields: { name: true, email: true, phone: true, cpf: false },
      default_payment_method: "credit_card",
      pix_gateway: "",
      credit_card_gateway: "",
    },
  },
  entities: { orderBumps: [], checkouts: [], paymentLinks: [], coupons: [] },
  credentials: {},
  productId: null,
  userId: undefined,
  validationErrors: { general: {}, upsell: {}, affiliate: {}, checkoutSettings: {} },
  saveError: null,
  loadError: null,
  lastLoadedAt: null,
  lastSavedAt: null,
  activeTab: "geral",
  tabErrors: {},
  isCheckoutSettingsInitialized: false,
};

// ============================================================================
// STATE MACHINE
// ============================================================================

export const productFormMachine = setup({
  types: {
    context: {} as ProductFormContext,
    events: {} as ProductFormEvent,
  },
  actors: {
    loadProduct: loadProductActor,
    saveAll: saveAllActor,
  },
}).createMachine({
  id: "productForm",
  initial: "idle",
  context: initialContext,
  
  states: {
    idle: {
      on: {
        LOAD_DATA: {
          target: "loading",
          actions: assign({
            productId: ({ event }) => event.productId,
            userId: ({ event }) => event.userId,
          }),
        },
      },
    },
    
    loading: {
      invoke: {
        src: "loadProduct",
        input: ({ context }) => ({ productId: context.productId, userId: context.userId }),
        onDone: {
          target: "ready",
          actions: assign(({ event }) => {
            const data = event.output as MappedProductData;
            const general = {
              name: data.product?.name ?? "",
              description: data.product?.description ?? "",
              price: data.product?.price ?? 0,
              support_name: data.product?.support_name ?? "",
              support_email: data.product?.support_email ?? "",
              delivery_url: data.product?.delivery_url ?? "",
              external_delivery: data.product?.external_delivery ?? false,
            };
            return {
              serverData: {
                product: data.product,
                general,
                upsell: data.upsellSettings,
                affiliateSettings: data.affiliateSettings,
                offers: data.offers,
                checkoutSettings: initialContext.serverData.checkoutSettings,
              },
              editedData: {
                general,
                image: { imageFile: null, imageUrl: data.product?.image_url ?? "", pendingRemoval: false },
                offers: { localOffers: data.offers, deletedOfferIds: [], modified: false },
                upsell: data.upsellSettings,
                affiliate: data.affiliateSettings,
                checkoutSettings: initialContext.editedData.checkoutSettings,
              },
              entities: {
                orderBumps: data.orderBumps,
                checkouts: data.checkouts,
                paymentLinks: data.paymentLinks,
                coupons: data.coupons,
              },
              lastLoadedAt: Date.now(),
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
        REFRESH: "loading",
        SET_TAB: { actions: assign({ activeTab: ({ event }) => event.tab }) },
        SET_TAB_ERRORS: { actions: assign({ tabErrors: ({ event }) => event.errors }) },
        CLEAR_TAB_ERRORS: { actions: assign({ tabErrors: () => ({}) }) },
        SET_VALIDATION_ERROR: {
          actions: assign(({ context, event }) => ({
            validationErrors: {
              ...context.validationErrors,
              [event.section]: {
                ...context.validationErrors[event.section],
                [event.field]: event.error,
              },
            },
          })),
        },
        CLEAR_VALIDATION_ERRORS: {
          actions: assign(() => ({
            validationErrors: { general: {}, upsell: {}, affiliate: {}, checkoutSettings: {} },
          })),
        },
        INIT_CHECKOUT_SETTINGS: {
          actions: assign(({ context, event }) => ({
            editedData: { ...context.editedData, checkoutSettings: event.settings },
            serverData: { ...context.serverData, checkoutSettings: event.settings },
            credentials: event.credentials,
            isCheckoutSettingsInitialized: true,
          })),
        },
      },
      
      states: {
        pristine: {
          on: {
            EDIT_GENERAL: { target: "dirty", actions: assign(({ context, event }) => ({ editedData: { ...context.editedData, general: { ...context.editedData.general, ...event.payload } } })) },
            EDIT_IMAGE: { target: "dirty", actions: assign(({ context, event }) => ({ editedData: { ...context.editedData, image: { ...context.editedData.image, ...event.payload } } })) },
            EDIT_OFFERS: { target: "dirty", actions: assign(({ context, event }) => ({ editedData: { ...context.editedData, offers: { ...context.editedData.offers, ...event.payload } } })) },
            ADD_DELETED_OFFER: { target: "dirty", actions: assign(({ context, event }) => ({ editedData: { ...context.editedData, offers: { ...context.editedData.offers, deletedOfferIds: [...context.editedData.offers.deletedOfferIds, event.offerId], modified: true } } })) },
            EDIT_UPSELL: { target: "dirty", actions: assign(({ context, event }) => ({ editedData: { ...context.editedData, upsell: { ...context.editedData.upsell, ...event.payload } } })) },
            EDIT_AFFILIATE: { target: "dirty", actions: assign(({ context, event }) => ({ editedData: { ...context.editedData, affiliate: { ...(context.editedData.affiliate ?? { enabled: false, defaultRate: 10, requireApproval: true, attributionModel: "last_click" as const, cookieDuration: 30 }), ...event.payload } } })) },
            EDIT_CHECKOUT_SETTINGS: { target: "dirty", actions: assign(({ context, event }) => ({ editedData: { ...context.editedData, checkoutSettings: { ...context.editedData.checkoutSettings, ...event.payload } } })) },
          },
        },
        
        dirty: {
          on: {
            EDIT_GENERAL: { actions: assign(({ context, event }) => ({ editedData: { ...context.editedData, general: { ...context.editedData.general, ...event.payload } } })) },
            EDIT_IMAGE: { actions: assign(({ context, event }) => ({ editedData: { ...context.editedData, image: { ...context.editedData.image, ...event.payload } } })) },
            EDIT_OFFERS: { actions: assign(({ context, event }) => ({ editedData: { ...context.editedData, offers: { ...context.editedData.offers, ...event.payload } } })) },
            ADD_DELETED_OFFER: { actions: assign(({ context, event }) => ({ editedData: { ...context.editedData, offers: { ...context.editedData.offers, deletedOfferIds: [...context.editedData.offers.deletedOfferIds, event.offerId], modified: true } } })) },
            EDIT_UPSELL: { actions: assign(({ context, event }) => ({ editedData: { ...context.editedData, upsell: { ...context.editedData.upsell, ...event.payload } } })) },
            EDIT_AFFILIATE: { actions: assign(({ context, event }) => ({ editedData: { ...context.editedData, affiliate: { ...(context.editedData.affiliate ?? { enabled: false, defaultRate: 10, requireApproval: true, attributionModel: "last_click" as const, cookieDuration: 30 }), ...event.payload } } })) },
            EDIT_CHECKOUT_SETTINGS: { actions: assign(({ context, event }) => ({ editedData: { ...context.editedData, checkoutSettings: { ...context.editedData.checkoutSettings, ...event.payload } } })) },
            SAVE_ALL: "#productForm.saving",
            DISCARD_CHANGES: {
              target: "pristine",
              actions: assign(({ context }) => ({
                editedData: {
                  general: { ...context.serverData.general },
                  image: { imageFile: null, imageUrl: context.serverData.product?.image_url ?? "", pendingRemoval: false },
                  offers: { localOffers: [...context.serverData.offers], deletedOfferIds: [], modified: false },
                  upsell: { ...context.serverData.upsell },
                  affiliate: context.serverData.affiliateSettings ? { ...context.serverData.affiliateSettings } : null,
                  checkoutSettings: { ...context.serverData.checkoutSettings },
                },
                validationErrors: { general: {}, upsell: {}, affiliate: {}, checkoutSettings: {} },
                tabErrors: {},
              })),
            },
          },
        },
      },
    },
    
    saving: {
      entry: assign({ saveError: () => null }),
      on: {
        SAVE_SUCCESS: {
          target: "ready.pristine",
          actions: assign(({ context }) => ({
            serverData: {
              ...context.serverData,
              general: { ...context.editedData.general },
              upsell: { ...context.editedData.upsell },
              affiliateSettings: context.editedData.affiliate ? { ...context.editedData.affiliate } : null,
              offers: [...context.editedData.offers.localOffers],
              checkoutSettings: { ...context.editedData.checkoutSettings },
            },
            editedData: {
              ...context.editedData,
              image: { ...context.editedData.image, imageFile: null, pendingRemoval: false },
              offers: { ...context.editedData.offers, deletedOfferIds: [], modified: false },
            },
            lastSavedAt: Date.now(),
            saveError: null,
          })),
        },
        SAVE_ERROR: {
          target: "ready.dirty",
          actions: assign({ saveError: ({ event }) => event.error }),
        },
      },
    },
    
    error: {
      on: {
        LOAD_DATA: {
          target: "loading",
          actions: assign({
            productId: ({ event }) => event.productId,
            userId: ({ event }) => event.userId,
          }),
        },
      },
    },
  },
});

export type ProductFormMachine = typeof productFormMachine;
