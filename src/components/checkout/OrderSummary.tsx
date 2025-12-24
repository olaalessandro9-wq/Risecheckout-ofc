import { useState, useEffect } from "react";
import { ImageIcon } from "@/components/icons/ImageIcon";
import { CouponField, type AppliedCoupon } from "./CouponField";

interface OrderSummaryProps {
  checkout: any;
  design: any;
  selectedBumps: Set<string>;
  orderBumps: any[];
  paymentMethod: 'pix' | 'credit_card';
  onTotalChange?: (total: number, appliedCoupon: AppliedCoupon | null) => void;
}

export function OrderSummary({ 
  checkout, 
  design, 
  selectedBumps, 
  orderBumps, 
  paymentMethod,
  onTotalChange
}: OrderSummaryProps) {
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  
  // Cálculo do Total
  const productPrice = Number(checkout.product?.price) || 0;
  const bumpsTotal = Array.from(selectedBumps).reduce((total, bumpId) => {
    const bump = orderBumps.find(b => b.id === bumpId);
    return total + (bump ? Number(bump.price) : 0);
  }, 0);
  
  const subtotal = productPrice + bumpsTotal;
  
  // Cálculo do desconto
  let discountAmount = 0;
  if (appliedCoupon) {
    // Determinar base de cálculo do desconto
    const discountBase = appliedCoupon.apply_to_order_bumps ? subtotal : productPrice;
    
    if (appliedCoupon.discount_type === "percentage") {
      discountAmount = (discountBase * appliedCoupon.discount_value) / 100;
    } else {
      // fixed
      discountAmount = appliedCoupon.discount_value;
    }
    
    // Garantir que o desconto não seja maior que o subtotal
    discountAmount = Math.min(discountAmount, subtotal);
  }
  
  const finalTotal = subtotal - discountAmount;

  // Notificar componente pai sobre mudança no total
  useEffect(() => {
    if (onTotalChange) {
      onTotalChange(finalTotal, appliedCoupon);
    }
  }, [finalTotal, appliedCoupon, onTotalChange]);

  return (
    <>
      <h4 
        className="font-semibold mb-3 text-base tracking-tight mt-16"
        style={{ color: design.colors.orderSummary?.titleText || '#000000' }}
      >
        Resumo do pedido
      </h4>
      
      <div 
        className="rounded-lg p-4"
        style={{
          backgroundColor: design.colors.orderSummary?.background || '#F9FAFB',
          borderColor: design.colors.orderSummary?.borderColor || '#D1D5DB',
          borderWidth: '1px',
          borderStyle: 'solid'
        }}
      >
        {/* Produto Principal */}
        <div className="flex items-start gap-3 mb-3 pb-3 border-b" style={{ borderColor: design.colors.orderSummary?.borderColor || '#D1D5DB' }}>
          {checkout.product?.image_url ? (
            <img 
              src={checkout.product.image_url} 
              alt={checkout.product?.name || 'Produto'}
              className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
            />
          ) : (
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: design.colors.placeholder || 'rgba(0,0,0,0.05)' }}
            >
              <ImageIcon 
                className="w-5 h-5" 
                color={design.colors.secondaryText || '#9CA3AF'} 
              />
            </div>
          )}
          <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
            <h5 
              className="text-sm font-medium leading-tight"
              style={{ color: design.colors.orderSummary?.productName || '#000000' }}
            >
              {checkout.product?.name}
            </h5>
            <p 
              className="text-sm font-bold whitespace-nowrap"
              style={{ color: design.colors.orderSummary?.priceText || '#000000' }}
            >
              R$ {productPrice.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>

        {/* Order Bumps Selecionados */}
        {selectedBumps.size > 0 && (
          <div className="space-y-2 mb-3 pb-3 border-b" style={{ borderColor: design.colors.orderSummary?.borderColor || '#D1D5DB' }}>
            {Array.from(selectedBumps).map(bumpId => {
              const bump = orderBumps.find(b => b.id === bumpId);
              if (!bump) return null;
              
              return (
                <div key={bumpId} className="flex items-start gap-3">
                  {bump.image_url && (
                    <img
                      src={bump.image_url}
                      alt={bump.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                    <p 
                      className="text-sm font-medium leading-tight line-clamp-1"
                      style={{ color: design.colors.orderSummary?.productName || '#000000' }}
                    >
                      {bump.name}
                    </p>
                    <p 
                      className="text-sm font-bold whitespace-nowrap"
                      style={{ color: design.colors.active }}
                    >
                      R$ {(Number(bump.price || 0)).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Campo de Cupom */}
        <CouponField
          productId={checkout.product?.id}
          design={design}
          onCouponApplied={setAppliedCoupon}
        />

        {/* Totais */}
        <div className="space-y-1.5 text-sm">
          {/* Subtotal (se houver cupom) */}
          {appliedCoupon && (
            <div className="flex justify-between">
              <span style={{ color: design.colors.orderSummary?.labelText || '#6B7280' }}>
                Subtotal
              </span>
              <span style={{ color: design.colors.orderSummary?.labelText || '#6B7280' }}>
                R$ {subtotal.toFixed(2).replace('.', ',')}
              </span>
            </div>
          )}

          {/* Desconto (se houver cupom) */}
          {appliedCoupon && discountAmount > 0 && (
            <div className="flex justify-between">
              <span style={{ color: design.colors.success?.text || '#10B981' }}>
                Desconto ({appliedCoupon.code})
              </span>
              <span style={{ color: design.colors.success?.text || '#10B981' }}>
                - R$ {discountAmount.toFixed(2).replace('.', ',')}
              </span>
            </div>
          )}

          {/* Total */}
          <div 
            className="flex justify-between text-base font-bold pt-2 border-t"
            style={{ borderTopColor: design.colors.orderSummary?.borderColor || '#D1D5DB' }}
          >
            <span style={{ color: design.colors.orderSummary?.priceText || '#000000' }}>
              Total
            </span>
            <span style={{ color: design.colors.orderSummary?.priceText || '#000000' }}>
              R$ {finalTotal.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {paymentMethod === 'credit_card' && (
          <p 
            className="text-xs mt-2"
            style={{ color: design.colors.orderSummary?.labelText || '#6B7280' }}
          >
            à vista no Cartão de Crédito
          </p>
        )}
      </div>
    </>
  );
}
