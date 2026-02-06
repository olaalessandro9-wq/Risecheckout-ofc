/**
 * SharedOrderSummary (REFATORADO - RISE V3 SSOT)
 * 
 * Componente compartilhado para resumo do pedido
 * Usado por: Builder, Preview e Checkout Público
 * 
 * RISE V3 COUPON ARCHITECTURE:
 * - Modo Controlado (public checkout): Recebe appliedCoupon/onApplyCoupon/onRemoveCoupon via props.
 *   XState é o SSOT. Zero estado duplicado, zero feedback loops.
 * - Modo Local (editor/preview): Usa useCouponValidation internamente.
 *   Sem ordens reais, sem risco de dessincronia.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useCouponValidation } from '@/hooks/checkout/useCouponValidation';
import type { AppliedCoupon } from '@/types/checkout-shared.types';
import { CouponInput } from './CouponInput';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const log = createLogger('SharedOrderSummary');

interface OrderBump {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  original_price?: number;
  call_to_action?: string;
}

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

interface SharedOrderSummaryProps {
  productData: {
    name?: string;
    price?: number;
    image_url?: string;
    id?: string;
  };
  orderBumps: OrderBump[];
  selectedBumps: Set<string>;
  design: {
    colors: {
      primaryText: string;
      secondaryText: string;
      formBackground: string;
      border: string;
      active: string;
    };
  };
  mode?: 'editor' | 'preview' | 'public';
  /** RISE V3: Controlled coupon state from XState (public checkout only) */
  appliedCoupon?: AppliedCoupon | null;
  /** RISE V3: Callback to apply validated coupon to XState (public checkout only) */
  onApplyCoupon?: (coupon: AppliedCoupon) => void;
  /** RISE V3: Callback to remove coupon from XState (public checkout only) */
  onRemoveCoupon?: () => void;
}

export const SharedOrderSummary: React.FC<SharedOrderSummaryProps> = ({
  productData,
  orderBumps,
  selectedBumps,
  design,
  mode = 'public',
  appliedCoupon: controlledCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  // ============================================================================
  // COUPON MODE: Controlled (XState SSOT) vs Uncontrolled (local hook)
  // ============================================================================

  const isControlled = !!onApplyCoupon;

  // Uncontrolled mode: local hook for editor/preview
  // Hook MUST be called unconditionally (React rules)
  const localCouponHook = useCouponValidation({ productId: productData.id });

  // Controlled mode: local input state only (coupon text + loading flag)
  const [controlledCouponCode, setControlledCouponCode] = useState('');
  const [controlledIsValidating, setControlledIsValidating] = useState(false);

  // Controlled mode: validate coupon via API, then push to XState
  const controlledValidate = useCallback(async () => {
    if (!controlledCouponCode.trim()) {
      toast.error('Digite um código de cupom');
      return;
    }

    if (!productData.id) {
      toast.error('Produto não identificado');
      return;
    }

    setControlledIsValidating(true);

    try {
      log.debug('Validando cupom (controlled)', {
        code: controlledCouponCode.trim(),
        productId: productData.id,
      });

      const { data, error } = await api.publicCall<CouponValidationResponse>('checkout-public-data', {
        action: 'validate-coupon',
        couponCode: controlledCouponCode.trim(),
        productId: productData.id,
      });

      if (error) {
        log.error('Edge function error', error);
        toast.error('Erro ao validar cupom. Tente novamente.');
        return;
      }

      if (!data?.success) {
        toast.error(data?.error || 'Cupom inválido');
        return;
      }

      const couponData: AppliedCoupon = {
        id: data.data!.id,
        code: data.data!.code,
        name: data.data!.name,
        discount_type: 'percentage' as const,
        discount_value: data.data!.discount_value,
        apply_to_order_bumps: data.data!.apply_to_order_bumps,
      };

      // Push directly to XState (SSOT) - zero dual state
      onApplyCoupon!(couponData);
      toast.success(`Cupom "${data.data!.code}" aplicado com sucesso!`);
    } catch (err: unknown) {
      log.error('Erro ao validar cupom', err);
      toast.error('Erro ao validar cupom. Tente novamente.');
    } finally {
      setControlledIsValidating(false);
    }
  }, [controlledCouponCode, productData.id, onApplyCoupon]);

  // Controlled mode: remove coupon from XState + clear local input
  const controlledRemove = useCallback(() => {
    onRemoveCoupon?.();
    setControlledCouponCode('');
    toast.success('Cupom removido');
  }, [onRemoveCoupon]);

  // ============================================================================
  // EFFECTIVE STATE: choose controlled vs uncontrolled
  // ============================================================================

  const effectiveCoupon = isControlled ? (controlledCoupon ?? null) : localCouponHook.appliedCoupon;
  const effectiveCouponCode = isControlled ? controlledCouponCode : localCouponHook.couponCode;
  const effectiveSetCouponCode = isControlled ? setControlledCouponCode : localCouponHook.setCouponCode;
  const effectiveIsValidating = isControlled ? controlledIsValidating : localCouponHook.isValidating;
  const effectiveValidate = isControlled ? controlledValidate : localCouponHook.validateCoupon;
  const effectiveRemove = isControlled ? controlledRemove : localCouponHook.removeCoupon;

  // ============================================================================
  // PRICE CALCULATIONS
  // ============================================================================

  const productPrice = useMemo(() => Number(productData.price) || 0, [productData.price]);

  const bumpsTotal = useMemo(() => 
    Array.from(selectedBumps).reduce((total, bumpId) => {
      const bump = orderBumps.find(b => b.id === bumpId);
      return total + (bump ? Number(bump.price) : 0);
    }, 0),
    [selectedBumps, orderBumps]
  );

  const subtotal = useMemo(() => productPrice + bumpsTotal, [productPrice, bumpsTotal]);

  const discountAmount = useMemo(() => {
    if (!effectiveCoupon) return 0;
    const discountBase = effectiveCoupon.apply_to_order_bumps ? subtotal : productPrice;
    // RISE V3: Apenas desconto por porcentagem é suportado
    return (discountBase * effectiveCoupon.discount_value) / 100;
  }, [effectiveCoupon, subtotal, productPrice]);

  const totalPrice = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

  const borderColor = design.colors.primaryText + '20';

  return (
    <div className="mt-10">
      <h2 
        className="text-lg font-semibold mb-2"
        style={{ color: design.colors.primaryText }}
      >
        Resumo do pedido
      </h2>

      <div 
        className="rounded-lg border p-4 space-y-4"
        style={{ borderColor, backgroundColor: 'transparent' }}
      >
        {/* Produto Principal */}
        <div className="flex items-center gap-4 pb-4 border-b" style={{ borderColor }}>
          {productData.image_url && (
            <img
              src={productData.image_url}
              alt={productData.name}
              className="w-16 h-16 object-cover rounded-md shadow-sm flex-shrink-0"
            />
          )}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            {productData.name && productData.name.length > 35 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p 
                    className="font-semibold text-lg mb-1 leading-tight truncate cursor-help max-w-full"
                    style={{ color: design.colors.primaryText }}
                  >
                    {productData.name}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px] break-words">
                  {productData.name}
                </TooltipContent>
              </Tooltip>
            ) : (
              <p 
                className="font-semibold text-lg mb-1 leading-tight"
                style={{ color: design.colors.primaryText }}
              >
                {productData.name || 'Produto'}
              </p>
            )}
            <p 
              className="font-bold text-sm"
              style={{ color: design.colors.active }}
            >
              R$ {(productPrice / 100).toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>

        {/* Order Bumps Selecionados */}
        {Array.from(selectedBumps).map(bumpId => {
          const bump = orderBumps.find(b => b.id === bumpId);
          if (!bump) return null;

          return (
            <div 
              key={bump.id}
              className="flex items-center gap-4 pb-4 border-b"
              style={{ borderColor }}
            >
              {bump.image_url && (
                <img
                  src={bump.image_url}
                  alt={bump.name}
                  className="w-12 h-12 object-cover rounded-md shadow-sm"
                />
              )}
              <div className="flex-1 flex justify-between items-center">
                <p className="text-sm pr-4" style={{ color: design.colors.secondaryText }}>
                  {bump.name}
                </p>
                <span className="font-medium whitespace-nowrap" style={{ color: design.colors.primaryText }}>
                  R$ {(Number(bump.price) / 100).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          );
        })}

        {/* Campo de Cupom */}
        <CouponInput
          couponCode={effectiveCouponCode}
          onCouponCodeChange={effectiveSetCouponCode}
          appliedCoupon={effectiveCoupon}
          isValidating={effectiveIsValidating}
          onValidate={effectiveValidate}
          onRemove={effectiveRemove}
          design={design}
        />

        {/* Subtotal (se houver cupom) */}
        {effectiveCoupon && (
          <div className="flex justify-between items-center pt-3 mt-3 border-t" style={{ borderColor }}>
            <span className="text-sm" style={{ color: design.colors.secondaryText }}>Subtotal</span>
            <span className="text-sm" style={{ color: design.colors.secondaryText }}>
              R$ {(subtotal / 100).toFixed(2).replace('.', ',')}
            </span>
          </div>
        )}

        {/* Desconto */}
        {effectiveCoupon && discountAmount > 0 && (
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-medium" style={{ color: '#10B981' }}>
              Desconto ({effectiveCoupon.code})
            </span>
            <span className="text-sm font-medium" style={{ color: '#10B981' }}>
              - R$ {(discountAmount / 100).toFixed(2).replace('.', ',')}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center pt-4 mt-4 border-t" style={{ borderColor }}>
          <span className="font-medium text-base" style={{ color: design.colors.primaryText }}>Total</span>
          <span className="font-medium text-lg" style={{ color: design.colors.primaryText }}>
            R$ {(totalPrice / 100).toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>
    </div>
  );
};
