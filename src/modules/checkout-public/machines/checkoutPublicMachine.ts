/**
 * Checkout Public State Machine
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * XState v5 State Machine for the public checkout flow.
 * This is the SINGLE SOURCE OF TRUTH for all checkout state.
 * 
 * States:
 * - idle: Initial state, waiting for LOAD
 * - loading: Fetching data from BFF
 * - validating: Validating BFF response with Zod
 * - ready.form: User can fill the form
 * - submitting: Payment is being processed
 * - paymentPending: Waiting for payment confirmation (PIX)
 * - success: Payment confirmed
 * - error: An error occurred (with retry capability)
 * 
 * @module checkout-public/machines
 */

import { setup, assign } from "xstate";
import type { CheckoutPublicContext, CheckoutPublicEvent } from "./checkoutPublicMachine.types";
import { fetchCheckoutDataActor } from "./checkoutPublicMachine.actors";
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
  paymentData: null,
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
  },
  guards: {
    canRetry,
    isDataValid,
    hasRequiredFormFields,
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
        input: ({ context }) => ({
          slug: context.slug!,
          affiliateCode: context.affiliateCode || undefined,
        }),
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
        {
          target: "error",
          actions: assign({ error: () => createValidationError() }),
        },
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
            APPLY_COUPON: {
              actions: assign({ appliedCoupon: ({ event }) => event.coupon }),
            },
            REMOVE_COUPON: {
              actions: assign({ appliedCoupon: () => null }),
            },
            SUBMIT: {
              target: "#checkoutPublic.submitting",
              guard: "hasRequiredFormFields",
              actions: assign(({ context, event }) => ({
                formData: event.snapshot ? { ...context.formData, ...event.snapshot } : context.formData,
              })),
            },
          },
        },
      },
    },

    submitting: {
      on: {
        SUBMIT_SUCCESS: {
          target: "paymentPending",
          actions: assign({
            orderId: ({ event }) => event.orderId,
            paymentData: ({ event }) => event.paymentData,
          }),
        },
        SUBMIT_ERROR: {
          target: "ready.form",
          actions: assign({ error: ({ event }) => createSubmitError(event.error) }),
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
          actions: assign({
            retryCount: ({ context }) => context.retryCount + 1,
            error: () => null,
          }),
        },
        GIVE_UP: {},
      },
    },
  },
});

export type CheckoutPublicMachine = typeof checkoutPublicMachine;
