/**
 * Checkout Public Machine Actors
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Async actors for the XState state machine.
 * 
 * NOTE: Payment actors have been moved to ./actors/ directory
 * for better modularization (createOrderActor, processPixPaymentActor, processCardPaymentActor).
 * 
 * PHASE 2: Uses resilientApi for automatic retry and circuit breaker.
 * 
 * @module checkout-public/machines
 */

import { fromPromise } from "xstate";
import { resilientApi } from "@/lib/api/resilient-client";
import type {
  FetchCheckoutInput,
  FetchCheckoutOutput,
} from "./checkoutPublicMachine.types";

// ============================================================================
// FETCH CHECKOUT ACTOR
// ============================================================================

/**
 * Fetches checkout data from the BFF (checkout-public-data)
 * 
 * This actor:
 * 1. Calls the resolve-and-load action with resilient retry
 * 2. Returns raw data for validation by the machine
 * 3. Uses circuit breaker to prevent cascading failures
 * 
 * PHASE 2: Upgraded to resilientApi for automatic retry with backoff.
 */
export const fetchCheckoutDataActor = fromPromise<FetchCheckoutOutput, FetchCheckoutInput>(
  async ({ input }) => {
    const { slug, affiliateCode } = input;

    if (!slug) {
      return {
        success: false,
        error: "Slug is required",
      };
    }

    // Use resilientApi with resolve-universal for Zero Latency Architecture
    // This accepts BOTH checkout_slug AND payment_link_slug, eliminating
    // the need for a separate PaymentLinkRedirect step.
    const { data, error } = await resilientApi.checkout<{
      success: boolean;
      data?: unknown;
      error?: string;
      reason?: string;
    }>("checkout-public-data", {
      action: "resolve-universal",
      slug,
      affiliateCode,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Network error",
      };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || "Checkout não encontrado",
      };
    }

    return {
      success: true,
      data: data,
    };
  }
);
