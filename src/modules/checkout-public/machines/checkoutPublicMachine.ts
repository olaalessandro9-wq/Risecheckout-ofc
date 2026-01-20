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
import { validateResolveAndLoadResponse } from "../contracts";
import { mapResolveAndLoad } from "../mappers";

// ============================================================================
// INITIAL CONTEXT
// ============================================================================

export const initialCheckoutContext: CheckoutPublicContext = {
  // Slug and Raw Data
  slug: null,
  affiliateCode: null,
  rawData: null,
  
  // Loaded Data
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
  
  // Form State
  formData: { name: '', email: '', phone: '', cpf: '', document: '' },
  formErrors: {},
  selectedBumps: [],
  appliedCoupon: null,
  selectedPaymentMethod: 'pix',
  
  // Payment State
  orderId: null,
  paymentData: null,
  
  // Error State
  error: null,
  
  // Metadata
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
    // =========================================================================
    // IDLE - Waiting for LOAD event
    // =========================================================================
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

    // =========================================================================
    // LOADING - Fetching data from BFF
    // =========================================================================
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
            actions: assign({
              rawData: ({ event }) => event.output.data,
            }),
          },
          {
            target: "error",
            actions: assign({
              error: ({ event }) => ({
                reason: 'FETCH_FAILED' as const,
                message: event.output.error || "Erro ao carregar checkout",
              }),
            }),
          },
        ],
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => ({
              reason: 'NETWORK_ERROR' as const,
              message: String(event.error) || "Erro de rede",
            }),
          }),
        },
      },
    },

    // =========================================================================
    // VALIDATING - Validating BFF response with Zod
    // =========================================================================
    validating: {
      always: [
        {
          guard: "isDataValid",
          target: "ready",
          actions: assign(({ context }) => {
            const validation = validateResolveAndLoadResponse(context.rawData);
            if (!validation.success) {
              // This shouldn't happen due to guard, but TypeScript needs it
              return {};
            }
            
            const mapped = mapResolveAndLoad(validation.data);
            
            return {
              checkout: mapped.checkout,
              product: mapped.product,
              offer: mapped.offer,
              orderBumps: mapped.orderBumps,
              affiliate: mapped.affiliate,
              design: mapped.design,
              resolvedGateways: mapped.resolvedGateways,
              selectedPaymentMethod: mapped.product.default_payment_method,
              loadedAt: Date.now(),
              retryCount: 0,
            };
          }),
        },
        {
          target: "error",
          actions: assign({
            error: () => ({
              reason: 'VALIDATION_FAILED' as const,
              message: "Dados do checkout inválidos",
            }),
          }),
        },
      ],
    },

    // =========================================================================
    // READY - User can interact with the form
    // =========================================================================
    ready: {
      initial: "form",
      states: {
        form: {
          on: {
            UPDATE_FIELD: {
              actions: assign(({ context, event }) => ({
                formData: { ...context.formData, [event.field]: event.value },
                formErrors: Object.fromEntries(
                  Object.entries(context.formErrors).filter(([k]) => k !== event.field)
                ),
              })),
            },
            UPDATE_MULTIPLE_FIELDS: {
              actions: assign(({ context, event }) => ({
                formData: { ...context.formData, ...event.fields },
              })),
            },
            TOGGLE_BUMP: {
              actions: assign(({ context, event }) => {
                const currentBumps = new Set(context.selectedBumps);
                if (currentBumps.has(event.bumpId)) {
                  currentBumps.delete(event.bumpId);
                } else {
                  currentBumps.add(event.bumpId);
                }
                return { selectedBumps: Array.from(currentBumps) };
              }),
            },
            SET_PAYMENT_METHOD: {
              actions: assign({
                selectedPaymentMethod: ({ event }) => event.method,
              }),
            },
            APPLY_COUPON: {
              actions: assign({
                appliedCoupon: ({ event }) => event.coupon,
              }),
            },
            REMOVE_COUPON: {
              actions: assign({
                appliedCoupon: () => null,
              }),
            },
            SUBMIT: {
              target: "#checkoutPublic.submitting",
              guard: "hasRequiredFormFields",
              actions: assign(({ context, event }) => ({
                formData: event.snapshot
                  ? { ...context.formData, ...event.snapshot }
                  : context.formData,
              })),
            },
          },
        },
      },
    },

    // =========================================================================
    // SUBMITTING - Payment is being processed
    // =========================================================================
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
          actions: assign({
            error: ({ event }) => ({
              reason: 'SUBMIT_FAILED' as const,
              message: event.error,
            }),
          }),
        },
      },
    },

    // =========================================================================
    // PAYMENT PENDING - Waiting for payment confirmation
    // =========================================================================
    paymentPending: {
      on: {
        PAYMENT_CONFIRMED: {
          target: "success",
        },
        PAYMENT_FAILED: {
          target: "ready.form",
          actions: assign({
            error: ({ event }) => ({
              reason: 'PAYMENT_FAILED' as const,
              message: event.error,
            }),
          }),
        },
        PAYMENT_TIMEOUT: {
          target: "ready.form",
          actions: assign({
            error: () => ({
              reason: 'PAYMENT_FAILED' as const,
              message: "Tempo de pagamento expirado",
            }),
          }),
        },
      },
    },

    // =========================================================================
    // SUCCESS - Payment confirmed
    // =========================================================================
    success: {
      type: "final",
    },

    // =========================================================================
    // ERROR - An error occurred
    // =========================================================================
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
        GIVE_UP: {
          // Stay in error state, user gave up
        },
      },
    },
  },
});

export type CheckoutPublicMachine = typeof checkoutPublicMachine;
