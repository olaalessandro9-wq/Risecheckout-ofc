/**
 * Coupon Validation API
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Pure function to validate a coupon code via the checkout-public-data edge function.
 * Extracted from SharedOrderSummary to enforce the 300-line limit and SRP.
 * 
 * Used by SharedOrderSummary in controlled mode (public checkout)
 * where XState is the SSOT for coupon state.
 * 
 * @module hooks/checkout
 */

import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import type { AppliedCoupon } from '@/types/checkout-shared.types';

const log = createLogger('validateCouponApi');

// ============================================================================
// TYPES
// ============================================================================

export interface CouponValidationResponse {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    code: string;
    name: string;
    discount_type: string;
    discount_value: number;
    apply_to_order_bumps: boolean;
  };
}

export type ValidateCouponOutcome = 
  | { success: true; coupon: AppliedCoupon; error?: never }
  | { success: false; coupon?: never; error: string };

// ============================================================================
// VALIDATION FUNCTION
// ============================================================================

/**
 * Validates a coupon code against the backend.
 * Returns a discriminated union: success with coupon data, or failure with error message.
 * 
 * This function is pure (no side effects like toasts) — the caller handles UI feedback.
 */
export async function validateCouponCode(
  couponCode: string,
  productId: string,
): Promise<ValidateCouponOutcome> {
  log.debug('Validating coupon', { code: couponCode, productId });

  try {
    const { data, error } = await api.publicCall<CouponValidationResponse>('checkout-public-data', {
      action: 'validate-coupon',
      couponCode: couponCode.trim(),
      productId,
    });

    if (error) {
      log.error('Edge function error', error);
      return { success: false, error: 'Erro ao validar cupom. Tente novamente.' };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Cupom inválido' };
    }

    const coupon: AppliedCoupon = {
      id: data.data!.id,
      code: data.data!.code,
      name: data.data!.name,
      discount_type: 'percentage' as const,
      discount_value: data.data!.discount_value,
      apply_to_order_bumps: data.data!.apply_to_order_bumps,
    };

    return { success: true, coupon };
  } catch (err: unknown) {
    log.error('Coupon validation failed', err);
    return { success: false, error: 'Erro ao validar cupom. Tente novamente.' };
  }
}
