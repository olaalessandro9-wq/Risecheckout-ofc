/**
 * Checkout Public State Machine
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * XState v5 State Machine for the public checkout flow.
 * This is the SINGLE SOURCE OF TRUTH for all checkout state.
 * 
 * @module checkout-public/machines
 */

import { setup, assign } from "xstate";
import type { CheckoutPublicContext, CheckoutPublicEvent, NavigationData } from "./checkoutPublicMachine.types";
import { fetchCheckoutDataActor } from "./checkoutPublicMachine.actors";
import { createOrderActor, processPixPaymentActor, processCardPaymentActor } from "./actors";
import { canRetry, isDataValid, hasRequiredFormFields } from "./checkoutPublicMachine.guards";
import {
  getValidatedContextData,
  toggleBumpInArray,
  removeFieldError,
  createFetchError,
  createNetworkError,
  createValidationError,
  createSubmitError,
  createPaymentError,
  createPaymentTimeoutError,
} from "./checkoutPublicMachine.actions";
import { createOrderInput, processPixInput, processCardInput } from "./checkoutPublicMachine.inputs";

// ============================================================================
// INITIAL CONTEXT
// ============================================================================

export const initialCheckoutContext: CheckoutPublicContext = {
  slug: null,
  affiliateCode: null,
  rawData: null,
  checkout: null,
  product: null,
  offer: null,
  orderBumps: [],
  affiliate: null,
  design: null,
  resolvedGateways: {
    pix: 'mercadopago',
    creditCard: 'mercadopago',
    mercadoPagoPublicKey: null,
    stripePublicKey: null,
  },
  formData: { name: '', email: '', phone: '', cpf: '', document: '' },
  formErrors: {},
  selectedBumps: [],
  appliedCoupon: null,
  selectedPaymentMethod: 'pix',
  orderId: null,
  accessToken: null,
  paymentData: null,
  navigationData: null,
  cardFormData: null,
  error: null,
  loadedAt: null,
  retryCount: 0,
};

// ============================================================================
// STATE MACHINE
// ============================================================================

export const checkoutPublicMachine = setup({
  types: {
    context: {} as CheckoutPublicContext,
    events: {} as CheckoutPublicEvent,
  },
  actors: {
    fetchCheckoutData: fetchCheckoutDataActor,
    createOrder: createOrderActor,
    processPixPayment: processPixPaymentActor,
    processCardPayment: processCardPaymentActor,
  },
  guards: {
    canRetry,
    isDataValid,
    hasRequiredFormFields,
    isPixPayment: ({ context }) => context.selectedPaymentMethod === 'pix',
    isCardPayment: ({ context }) => context.selectedPaymentMethod === 'credit_card',
    isCardApproved: (_, params: { output?: { navigationData?: NavigationData } }) => 
      params?.output?.navigationData?.type === 'card' && params.output.navigationData.status === 'approved',
  },
}).createMachine({
  id: "checkoutPublic",
  initial: "idle",
  context: initialCheckoutContext,

  states: {
    idle: {
      on: {
        LOAD: {
          target: "loading",
          actions: assign({
            slug: ({ event }) => event.slug,
            affiliateCode: ({ event }) => event.affiliateCode || null,
            error: () => null,
          }),
        },
      },
    },

    loading: {
      invoke: {
        src: "fetchCheckoutData",
        input: ({ context }) => ({ slug: context.slug!, affiliateCode: context.affiliateCode || undefined }),
        onDone: [
          {
            guard: ({ event }) => event.output.success === true,
            target: "validating",
            actions: assign({ rawData: ({ event }) => event.output.data }),
          },
          {
            target: "error",
            actions: assign({ error: ({ event }) => createFetchError(event.output.error || "") }),
          },
        ],
        onError: {
          target: "error",
          actions: assign({ error: ({ event }) => createNetworkError(event.error) }),
        },
      },
    },

    validating: {
      always: [
        {
          guard: "isDataValid",
          target: "ready",
          actions: assign(({ context }) => getValidatedContextData(context)),
        },
        { target: "error", actions: assign({ error: () => createValidationError() }) },
      ],
    },

    ready: {
      initial: "form",
      states: {
        form: {
          on: {
            UPDATE_FIELD: {
              actions: assign(({ context, event }) => ({
                formData: { ...context.formData, [event.field]: event.value },
                formErrors: removeFieldError(context.formErrors, event.field),
              })),
            },
            UPDATE_MULTIPLE_FIELDS: {
              actions: assign(({ context, event }) => ({
                formData: { ...context.formData, ...event.fields },
              })),
            },
            TOGGLE_BUMP: {
              actions: assign(({ context, event }) => ({
                selectedBumps: toggleBumpInArray(context.selectedBumps, event.bumpId),
              })),
            },
            SET_PAYMENT_METHOD: {
              actions: assign({ selectedPaymentMethod: ({ event }) => event.method }),
            },
            APPLY_COUPON: { actions: assign({ appliedCoupon: ({ event }) => event.coupon }) },
            REMOVE_COUPON: { actions: assign({ appliedCoupon: () => null }) },
            SUBMIT: {
              target: "#checkoutPublic.submitting",
              guard: "hasRequiredFormFields",
              actions: assign(({ context, event }) => ({
                formData: event.snapshot ? { ...context.formData, ...event.snapshot } : context.formData,
                cardFormData: event.cardData || null,
              })),
            },
          },
        },
      },
    },

    submitting: {
      initial: "creatingOrder",
      states: {
        creatingOrder: {
          invoke: {
            src: "createOrder",
            input: ({ context }) => createOrderInput(context),
            onDone: [
              {
                guard: ({ event }) => event.output.success === true,
                target: "processingPayment",
                actions: assign({
                  orderId: ({ event }) => event.output.orderId,
                  accessToken: ({ event }) => event.output.accessToken,
                }),
              },
              {
                target: "#checkoutPublic.ready.form",
                actions: assign({ error: ({ event }) => createSubmitError(event.output.error || "Erro ao criar pedido") }),
              },
            ],
            onError: {
              target: "#checkoutPublic.ready.form",
              actions: assign({ error: ({ event }) => createNetworkError(event.error) }),
            },
          },
        },

        processingPayment: {
          always: [
            { guard: "isPixPayment", target: "processingPix" },
            { guard: "isCardPayment", target: "processingCard" },
          ],
        },

        processingPix: {
          invoke: {
            src: "processPixPayment",
            input: ({ context }) => processPixInput(context),
            onDone: [
              {
                guard: ({ event }) => event.output.success === true,
                target: "#checkoutPublic.paymentPending",
                actions: assign({ navigationData: ({ event }) => event.output.navigationData }),
              },
              {
                target: "#checkoutPublic.ready.form",
                actions: assign({ error: ({ event }) => createPaymentError(event.output.error || "Erro PIX") }),
              },
            ],
            onError: {
              target: "#checkoutPublic.ready.form",
              actions: assign({ error: ({ event }) => createNetworkError(event.error) }),
            },
          },
        },

        processingCard: {
          invoke: {
            src: "processCardPayment",
            input: ({ context }) => processCardInput(context),
            onDone: [
              {
                guard: "isCardApproved",
                target: "#checkoutPublic.success",
                actions: assign({ navigationData: ({ event }) => event.output.navigationData }),
              },
              {
                guard: ({ event }) => event.output.success === true,
                target: "#checkoutPublic.paymentPending",
                actions: assign({ navigationData: ({ event }) => event.output.navigationData }),
              },
              {
                target: "#checkoutPublic.ready.form",
                actions: assign({ error: ({ event }) => createPaymentError(event.output.error || "Recusado") }),
              },
            ],
            onError: {
              target: "#checkoutPublic.ready.form",
              actions: assign({ error: ({ event }) => createNetworkError(event.error) }),
            },
          },
        },
      },
    },

    paymentPending: {
      on: {
        PAYMENT_CONFIRMED: { target: "success" },
        PAYMENT_FAILED: {
          target: "ready.form",
          actions: assign({ error: ({ event }) => createPaymentError(event.error) }),
        },
        PAYMENT_TIMEOUT: {
          target: "ready.form",
          actions: assign({ error: () => createPaymentTimeoutError() }),
        },
      },
    },

    success: { type: "final" },

    error: {
      on: {
        RETRY: {
          target: "loading",
          guard: "canRetry",
          actions: assign({ retryCount: ({ context }) => context.retryCount + 1, error: () => null }),
        },
        GIVE_UP: {},
      },
    },
  },
});

export type CheckoutPublicMachine = typeof checkoutPublicMachine;
