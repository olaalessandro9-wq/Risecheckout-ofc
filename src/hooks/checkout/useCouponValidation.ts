/**
 * Hook: useCouponValidation
 * 
 * Gerencia validação e aplicação de cupons de desconto
 * Extraído de SharedOrderSummary para manter < 300 linhas
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

      // 1. Buscar cupom pelo código (case-insensitive)
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .ilike('code', couponCode.trim())
        .single();

      if (couponError || !coupon) {
        toast.error('Cupom inválido ou não encontrado');
        return;
      }

      // Verificar se está ativo
      if (!coupon.active) {
        toast.error('Este cupom está inativo');
        return;
      }

      // 2. Verificar se o cupom está vinculado a este produto
      const { data: couponProduct, error: cpError } = await supabase
        .from('coupon_products')
        .select('*')
        .eq('coupon_id', coupon.id)
        .eq('product_id', productId)
        .single();

      if (cpError || !couponProduct) {
        toast.error('Este cupom não é válido para este produto');
        return;
      }

      // 3. Verificar data de início
      if (coupon.start_date) {
        const startDate = new Date(coupon.start_date);
        if (new Date() < startDate) {
          toast.error('Este cupom ainda não está ativo');
          return;
        }
      }

      // 4. Verificar data de expiração
      if (coupon.expires_at) {
        const expiresAt = new Date(coupon.expires_at);
        if (new Date() > expiresAt) {
          toast.error('Este cupom expirou');
          return;
        }
      }

      // 5. Verificar limite de usos
      if (coupon.max_uses && coupon.max_uses > 0) {
        if ((coupon.uses_count ?? 0) >= coupon.max_uses) {
          toast.error('Este cupom atingiu o limite de usos');
          return;
        }
      }

      // Cupom válido! Aplicar
      const appliedCouponData: AppliedCoupon = {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name || coupon.code,
        discount_type: coupon.discount_type as 'percentage' | 'fixed',
        discount_value: Number(coupon.discount_value),
        apply_to_order_bumps: coupon.apply_to_order_bumps || false,
      };

      setAppliedCoupon(appliedCouponData);
      toast.success(`Cupom "${coupon.code}" aplicado com sucesso!`);
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
