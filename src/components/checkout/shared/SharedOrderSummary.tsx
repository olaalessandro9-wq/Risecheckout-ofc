/**
 * SharedOrderSummary (RISE V3 SSOT)
 * 
 * Shared order summary component.
 * Used by: Builder, Preview, and Public Checkout.
 * 
 * COUPON ARCHITECTURE:
 * - Controlled mode (public checkout): Receives appliedCoupon/onApplyCoupon/onRemoveCoupon via props.
 *   XState is the SSOT. Zero duplicate state, zero feedback loops.
 * - Uncontrolled mode (editor/preview): Uses useCouponValidation hook internally.
 *   No real orders, no desync risk.
 * 
 * @module components/checkout/shared
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useCouponValidation } from '@/hooks/checkout/useCouponValidation';
import { formatInstallmentDisplay } from '@/lib/payment-gateways/installments';
import { validateCouponCode } from '@/hooks/checkout/validateCouponApi';
import type { AppliedCoupon } from '@/types/checkout-shared.types';
import { CouponInput } from './CouponInput';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OrderBump {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  original_price?: number;
  call_to_action?: string;
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
  /** Controlled coupon state from XState (public checkout only) */
  appliedCoupon?: AppliedCoupon | null;
  /** Callback to apply validated coupon to XState (public checkout only) */
  onApplyCoupon?: (coupon: AppliedCoupon) => void;
  /** Callback to remove coupon from XState (public checkout only) */
  onRemoveCoupon?: () => void;
  /** Selected payment method for installment display */
  selectedPaymentMethod?: 'pix' | 'credit_card';
  /** Selected installment count from card form */
  selectedInstallment?: number;
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
  selectedPaymentMethod,
  selectedInstallment,
}) => {
  // ============================================================================
  // COUPON MODE: Controlled (XState SSOT) vs Uncontrolled (local hook)
  // ============================================================================

  const isControlled = !!onApplyCoupon;

  // Uncontrolled mode: local hook for editor/preview (called unconditionally per React rules)
  const localCouponHook = useCouponValidation({ productId: productData.id });

  // Controlled mode: local input state only (coupon text + loading flag)
  const [controlledCouponCode, setControlledCouponCode] = useState('');
  const [controlledIsValidating, setControlledIsValidating] = useState(false);

  // Controlled mode: validate via extracted API function, then push to XState
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
    const result = await validateCouponCode(controlledCouponCode.trim(), productData.id);
    setControlledIsValidating(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    onApplyCoupon!(result.coupon);
    toast.success(`Cupom "${result.coupon.code}" aplicado com sucesso!`);
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
        {/* Main Product */}
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

        {/* Selected Order Bumps */}
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
              <div className="flex-1 flex justify-between items-start gap-3 min-w-0">
                <p className="text-sm min-w-0 line-clamp-2" style={{ color: design.colors.secondaryText }}>
                  {bump.name}
                </p>
                <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: design.colors.primaryText }}>
                  R$ {(Number(bump.price) / 100).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          );
        })}

        {/* Coupon Field */}
        <CouponInput
          couponCode={effectiveCouponCode}
          onCouponCodeChange={effectiveSetCouponCode}
          appliedCoupon={effectiveCoupon}
          isValidating={effectiveIsValidating}
          onValidate={effectiveValidate}
          onRemove={effectiveRemove}
          design={design}
        />

        {/* Subtotal (shown when coupon is applied) */}
        {effectiveCoupon && (
          <div className="flex justify-between items-center pt-3 mt-3 border-t" style={{ borderColor }}>
            <span className="text-sm" style={{ color: design.colors.secondaryText }}>Subtotal</span>
            <span className="text-sm" style={{ color: design.colors.secondaryText }}>
              R$ {(subtotal / 100).toFixed(2).replace('.', ',')}
            </span>
          </div>
        )}

        {/* Discount */}
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
            {selectedPaymentMethod === 'credit_card' && selectedInstallment && selectedInstallment > 1
              ? formatInstallmentDisplay(totalPrice, selectedInstallment)
              : `R$ ${(totalPrice / 100).toFixed(2).replace('.', ',')}`
            }
          </span>
        </div>
      </div>
    </div>
  );
};
