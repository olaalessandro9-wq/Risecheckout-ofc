/**
 * Hook: useCouponValidation
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Local coupon validation hook for editor/preview modes ONLY.
 * In public checkout, XState is the SSOT for coupon state — see validateCouponApi.ts.
 * 
 * @module hooks/checkout
 */

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';
import type { AppliedCoupon } from '@/types/checkout-shared.types';
import type { CouponValidationResponse } from './validateCouponApi';

const log = createLogger('CouponValidation');

interface UseCouponValidationParams {
  productId?: string;
}

interface UseCouponValidationReturn {
  couponCode: string;
  setCouponCode: (code: string) => void;
  appliedCoupon: AppliedCoupon | null;
  isValidating: boolean;
  validateCoupon: () => Promise<void>;
  removeCoupon: () => void;
}

export function useCouponValidation({ productId }: UseCouponValidationParams): UseCouponValidationReturn {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateCoupon = useCallback(async () => {
    if (!couponCode.trim()) {
      toast.error('Digite um código de cupom');
      return;
    }

    if (!productId) {
      toast.error('Produto não identificado');
      return;
    }

    setIsValidating(true);

    try {
      log.debug('Validando cupom', {
        code: couponCode.trim(),
        productId
      });

      const { data, error } = await api.publicCall<CouponValidationResponse>('checkout-public-data', {
        action: 'validate-coupon',
        couponCode: couponCode.trim(),
        productId,
      });

      if (error) {
        log.error('Edge function error', error);
        toast.error(error.message || 'Erro ao validar cupom. Tente novamente.');
        return;
      }

      if (!data?.success) {
        toast.error(data?.error || 'Cupom inválido');
        return;
      }

      const appliedCouponData: AppliedCoupon = {
        id: data.data.id,
        code: data.data.code,
        name: data.data.name,
        discount_type: 'percentage' as const,
        discount_value: data.data.discount_value,
        apply_to_order_bumps: data.data.apply_to_order_bumps ?? false,
      };

      setAppliedCoupon(appliedCouponData);
      toast.success(`Cupom "${data.data.code}" aplicado com sucesso!`);
    } catch (error: unknown) {
      log.error('Erro ao validar cupom', error);
      toast.error('Erro ao validar cupom. Tente novamente.');
    } finally {
      setIsValidating(false);
    }
  }, [couponCode, productId]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Cupom removido');
  }, []);

  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    isValidating,
    validateCoupon,
    removeCoupon,
  };
}
