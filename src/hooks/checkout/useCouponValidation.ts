/**
 * Hook: useCouponValidation
 * 
 * MIGRATED: Uses checkout-public-data Edge Function
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CouponValidationResponse {
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

export interface AppliedCoupon {
  id: string;
  code: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  apply_to_order_bumps: boolean;
}

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
      console.log('[useCouponValidation] Validando cupom:', {
        code: couponCode.trim(),
        productId
      });

      const { data, error } = await api.publicCall<CouponValidationResponse>('checkout-public-data', {
        action: 'validate-coupon',
        couponCode: couponCode.trim(),
        productId,
      });

      if (error) {
        console.error('[useCouponValidation] Edge function error:', error);
        toast.error('Erro ao validar cupom. Tente novamente.');
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
        discount_type: data.data.discount_type as 'percentage' | 'fixed',
        discount_value: data.data.discount_value,
        apply_to_order_bumps: data.data.apply_to_order_bumps,
      };

      setAppliedCoupon(appliedCouponData);
      toast.success(`Cupom "${data.data.code}" aplicado com sucesso!`);
    } catch (error: unknown) {
      console.error('[useCouponValidation] Erro ao validar cupom:', error);
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
