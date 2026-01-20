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
 * @module checkout-public/machines
 */

import { fromPromise } from "xstate";
import { api } from "@/lib/api";
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
 * 1. Calls the resolve-and-load action
 * 2. Returns raw data for validation by the machine
 * 3. Throws on network/API errors
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

    const { data, error } = await api.publicCall<{
      success: boolean;
      data?: unknown;
      error?: string;
    }>("checkout-public-data", {
      action: "resolve-and-load",
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
