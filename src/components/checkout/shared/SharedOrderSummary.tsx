/**
 * SharedOrderSummary (REFATORADO)
 * 
 * Componente compartilhado para resumo do pedido
 * Usado por: Builder, Preview e Checkout Público
 * 
 * REFATORAÇÃO (RISE ARCHITECT PROTOCOL):
 * - Lógica de cupom extraída para useCouponValidation
 * - UI de cupom extraída para CouponInput
 * - Este arquivo agora tem ~200 linhas (antes: 412)
 */

import React, { useMemo, useEffect } from 'react';
import { useCouponValidation, type AppliedCoupon } from '@/hooks/checkout/useCouponValidation';
import { CouponInput } from './CouponInput';
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
  onTotalChange?: (total: number, appliedCoupon: AppliedCoupon | null) => void;
}

export const SharedOrderSummary: React.FC<SharedOrderSummaryProps> = ({
  productData,
  orderBumps,
  selectedBumps,
  design,
  mode = 'public',
  onTotalChange,
}) => {
  // Hook de validação de cupom
  const {
    couponCode,
    setCouponCode,
    appliedCoupon,
    isValidating,
    validateCoupon,
    removeCoupon,
  } = useCouponValidation({ productId: productData.id });

  // Cálculos de preço
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
    if (!appliedCoupon) return 0;
    const discountBase = appliedCoupon.apply_to_order_bumps ? subtotal : productPrice;
    // RISE V3: Apenas desconto por porcentagem é suportado
    return (discountBase * appliedCoupon.discount_value) / 100;
  }, [appliedCoupon, subtotal, productPrice]);

  const totalPrice = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

  // Notificar pai
  useEffect(() => {
    onTotalChange?.(totalPrice, appliedCoupon);
  }, [totalPrice, appliedCoupon, onTotalChange]);

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
          couponCode={couponCode}
          onCouponCodeChange={setCouponCode}
          appliedCoupon={appliedCoupon}
          isValidating={isValidating}
          onValidate={validateCoupon}
          onRemove={removeCoupon}
          design={design}
        />

        {/* Subtotal (se houver cupom) */}
        {appliedCoupon && (
          <div className="flex justify-between items-center pt-3 mt-3 border-t" style={{ borderColor }}>
            <span className="text-sm" style={{ color: design.colors.secondaryText }}>Subtotal</span>
            <span className="text-sm" style={{ color: design.colors.secondaryText }}>
              R$ {(subtotal / 100).toFixed(2).replace('.', ',')}
            </span>
          </div>
        )}

        {/* Desconto */}
        {appliedCoupon && discountAmount > 0 && (
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-medium" style={{ color: '#10B981' }}>
              Desconto ({appliedCoupon.code})
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
