/**
 * SharedOrderSummary
 * 
 * Componente compartilhado para resumo do pedido
 * Usado por: Builder, Preview e Checkout Público
 * 
 * Garante consistência visual entre todos os modos
 */

import React, { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppliedCoupon {
  id: string;
  code: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  apply_to_order_bumps: boolean;
}

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
    name: string;
    price: number;
    image_url?: string;
    id?: string; // ID do produto para validar cupom
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
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const productPrice = useMemo(() => 
    Number(productData.price) || 0,
    [productData.price]
  );

  const bumpsTotal = useMemo(() => 
    Array.from(selectedBumps).reduce((total, bumpId) => {
      const bump = orderBumps.find(b => b.id === bumpId);
      return total + (bump ? Number(bump.price) : 0);
    }, 0),
    [selectedBumps, orderBumps]
  );

  const subtotal = useMemo(() => 
    productPrice + bumpsTotal,
    [productPrice, bumpsTotal]
  );

  // Cálculo do desconto
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    
    const discountBase = appliedCoupon.apply_to_order_bumps ? subtotal : productPrice;
    
    if (appliedCoupon.discount_type === 'percentage') {
      return (discountBase * appliedCoupon.discount_value) / 100;
    } else {
      return appliedCoupon.discount_value;
    }
  }, [appliedCoupon, subtotal, productPrice]);

  const totalPrice = useMemo(() => 
    Math.max(0, subtotal - discountAmount),
    [subtotal, discountAmount]
  );

  // Função de validação de cupom
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Digite um código de cupom');
      return;
    }

    if (!productData.id) {
      toast.error('Produto não identificado');
      return;
    }

    setIsValidating(true);

    try {
      console.log('[SharedOrderSummary] Validando cupom:', {
        code: couponCode.trim(),
        productId: productData.id
      });

      // 1. Buscar cupom pelo código (case-insensitive)
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .ilike('code', couponCode.trim())
        .single();

      console.log('[SharedOrderSummary] Resultado busca cupom:', { coupon, couponError });

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
        .eq('product_id', productData.id)
        .single();

      console.log('[SharedOrderSummary] Resultado vinculação:', { couponProduct, cpError });

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
        if (coupon.uses_count >= coupon.max_uses) {
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
    } catch (error: any) {
      console.error('[CUPOM] Erro ao validar cupom:', error);
      toast.error('Erro ao validar cupom. Tente novamente.');
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Cupom removido');
  };

  return (
    <div className="mt-10"> {/* Aumentado espaçamento superior (mt-8 -> mt-10) */}
      <h2 
        className="text-lg font-semibold mb-2" // Reduzido margem inferior (mb-4 -> mb-2) para aproximar do bloco
        style={{ color: design.colors.primaryText }}
      >
        Resumo do pedido
      </h2>

      {/* Container com borda envolvendo todo o resumo */}
      <div 
        className="rounded-lg border p-4 space-y-4"
        style={{ 
          borderColor: design.colors.primaryText + '20', // 20 = 12% opacity
          backgroundColor: 'transparent'
        }}
      >
        {/* Produto Principal - Layout Ajustado */}
        <div className="flex items-center gap-4 pb-4 border-b" style={{ borderColor: design.colors.primaryText + '20' }}>
          {productData.image_url && (
            <img
              src={productData.image_url}
              alt={productData.name}
              className="w-16 h-16 object-cover rounded-md shadow-sm"
            />
          )}
          <div className="flex-1 flex flex-col justify-center"> {/* Mudado para flex-col */}
            <p 
              className="font-semibold text-lg mb-1 leading-tight" // Aumentado tamanho da fonte (text-sm -> text-base)
              style={{ color: design.colors.primaryText }}
            >
              {productData.name}
            </p>
            <p 
              className="font-bold text-sm" // Reduzido tamanho da fonte (text-lg -> text-sm)
              style={{ color: design.colors.active }}
            >
              R$ {(productPrice / 100).toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>

        {/* Order Bumps Selecionados - Mantido layout original (preço na direita) */}
        {Array.from(selectedBumps).map(bumpId => {
          const bump = orderBumps.find(b => b.id === bumpId);
          if (!bump) return null;

          return (
            <div 
              key={bump.id}
              className="flex items-center gap-4 pb-4 border-b"
              style={{ borderColor: design.colors.primaryText + '20' }}
            >
              {bump.image_url && (
                <img
                  src={bump.image_url}
                  alt={bump.name}
                  className="w-12 h-12 object-cover rounded-md shadow-sm"
                />
              )}
              <div className="flex-1 flex justify-between items-center">
                <p 
                  className="text-sm pr-4"
                  style={{ color: design.colors.secondaryText }}
                >
                  {bump.name}
                </p>
                <span 
                  className="font-medium whitespace-nowrap"
                  style={{ color: design.colors.primaryText }}
                >
                  R$ {(Number(bump.price) / 100).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          );
        })}

        {/* Campo de Cupom */}
        <div className="pt-2">
          <label 
            className="text-sm font-medium mb-2 flex items-center gap-2"
            style={{ color: design.colors.primaryText }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Cupom de desconto
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="DIGITE O CÓDIGO"
              disabled={isValidating || !!appliedCoupon}
              className="flex-1 px-3 py-2 border rounded-lg text-sm uppercase transition-colors focus:ring-2 focus:ring-opacity-50"
              style={{ 
                borderColor: design.colors.primaryText + '20', // 20 = 12% opacity
                color: design.colors.primaryText,
                backgroundColor: design.colors.formBackground,
                // @ts-ignore
                '--tw-ring-color': design.colors.active
              }}
            />
            {!appliedCoupon ? (
              <button
                type="button"
                onClick={validateCoupon}
                disabled={isValidating || !couponCode.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: design.colors.active,
                  color: '#FFFFFF'
                }}
              >
                {isValidating ? 'Validando...' : 'Aplicar'}
              </button>
            ) : (
              <button
                type="button"
                onClick={removeCoupon}
                disabled={false}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF'
                }}
              >
                Remover
              </button>
            )}
          </div>
        </div>

        {/* Subtotal (se houver cupom) */}
        {appliedCoupon && (
          <div 
            className="flex justify-between items-center pt-3 mt-3 border-t"
            style={{ borderColor: design.colors.primaryText + '20' }}
          >
            <span 
              className="text-sm"
              style={{ color: design.colors.secondaryText }}
            >
              Subtotal
            </span>
            <span 
              className="text-sm"
              style={{ color: design.colors.secondaryText }}
            >
              R$ {(subtotal / 100).toFixed(2).replace('.', ',')}
            </span>
          </div>
        )}

        {/* Desconto (se houver cupom) */}
        {appliedCoupon && discountAmount > 0 && (
          <div className="flex justify-between items-center pt-2">
            <span 
              className="text-sm font-medium"
              style={{ color: '#10B981' }}
            >
              Desconto ({appliedCoupon.code})
            </span>
            <span 
              className="text-sm font-medium"
              style={{ color: '#10B981' }}
            >
              - R$ {(discountAmount / 100).toFixed(2).replace('.', ',')}
            </span>
          </div>
        )}

        {/* Total - Minimalista */}
        <div 
          className="flex justify-between items-center pt-4 mt-4 border-t"
          style={{ borderColor: design.colors.primaryText + '20' }}
        >
          <span 
            className="font-medium text-base"
            style={{ color: design.colors.primaryText }}
          >
            Total
          </span>
          <span 
            className="font-medium text-lg"
            style={{ color: design.colors.primaryText }}
          >
            R$ {(totalPrice / 100).toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>
    </div>
  );
};
