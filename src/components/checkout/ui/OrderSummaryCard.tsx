/**
 * Componente: OrderSummaryCard
 * 
 * Responsabilidade Única: Renderizar o card de resumo do pedido com produto,
 * order bumps selecionados e total.
 * 
 * Este é um componente de UI puro e reutilizável, usado tanto no preview
 * quanto no checkout público para garantir consistência visual.
 * 
 * @version 1.0
 */

import React, { useMemo } from 'react';
import { ImageIcon } from '@/components/icons/ImageIcon';
import { formatCentsToBRL as formatBRL } from '@/lib/money';
import type { ThemePreset } from '@/types/theme';
import type { OrderBump, ProductData } from '@/hooks/useCheckoutState';

// ============================================================================
// TYPES
// ============================================================================

export interface OrderSummaryCardProps {
  /** Dados do produto */
  productData?: ProductData;
  
  /** Lista de order bumps disponíveis */
  orderBumps?: OrderBump[];
  
  /** Set de IDs dos order bumps selecionados */
  selectedBumps: Set<string>;
  
  /** Preço total (produto + bumps) */
  totalPrice: number;
  
  /** Tema/cores do checkout */
  design: ThemePreset;
  
  /** Classes CSS adicionais */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Card de resumo do pedido.
 * 
 * Exibe o produto principal, order bumps selecionados e o total.
 * 
 * @example
 * <OrderSummaryCard
 *   productData={productData}
 *   orderBumps={orderBumps}
 *   selectedBumps={selectedBumps}
 *   totalPrice={199.80}
 *   design={design}
 * />
 */
export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  productData,
  orderBumps = [],
  selectedBumps,
  totalPrice,
  design,
  className = '',
}) => {
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  // Filtrar apenas os bumps selecionados
  const selectedBumpsList = useMemo(() => 
    orderBumps.filter(bump => selectedBumps.has(bump.id)),
    [orderBumps, selectedBumps]
  );

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div 
      className={`rounded-xl p-5 ${className}`}
      style={{ backgroundColor: design.colors.formBackground || '#FFFFFF' }}
    >
      {/* Título */}
      <h4 
        className="text-base font-bold mb-4"
        style={{ color: design.colors.primaryText }}
      >
        Resumo do pedido
      </h4>
      
      {/* Container dos itens */}
      <div 
        className="border rounded-lg p-4 space-y-4"
        style={{ borderColor: design.colors.border || '#E5E7EB' }}
      >
        {/* Produto Principal */}
        <div className="flex items-start gap-3">
          {/* Imagem do Produto */}
          {productData?.image_url ? (
            <img
              src={productData.image_url}
              alt={productData.name}
              className="w-12 h-12 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-[hsl(var(--checkout-placeholder-bg))] flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-6 h-6 text-[hsl(var(--checkout-placeholder-icon))]" />
            </div>
          )}
          
          {/* Nome e Preço */}
          <div className="flex-1 min-w-0">
            <h5 
              className="text-sm font-semibold mb-1"
              style={{ color: design.colors.primaryText }}
            >
              {productData?.name || 'Nome do Produto'}
            </h5>
            <p 
              className="text-sm font-bold"
              style={{ color: design.colors.active }}
            >
              {formatBRL(productData?.price || 0)}
            </p>
          </div>
        </div>

        {/* Order Bumps Selecionados */}
        {selectedBumpsList.length > 0 && (
          <>
            {/* Divider */}
            <div 
              className="border-t"
              style={{ borderColor: design.colors.border || '#E5E7EB' }}
            />
            
            {selectedBumpsList.map(bump => (
              <div key={bump.id} className="flex items-start gap-3">
                {/* Imagem do Bump */}
                {bump.image_url ? (
                  <img
                    src={bump.image_url}
                    alt={bump.name}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-[hsl(var(--checkout-placeholder-bg))] flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-6 h-6 text-[hsl(var(--checkout-placeholder-icon))]" />
                  </div>
                )}
                
                {/* Nome e Preço */}
                <div className="flex-1 min-w-0">
                  <h5 
                    className="text-sm font-semibold mb-1"
                    style={{ color: design.colors.primaryText }}
                  >
                    {bump.name}
                  </h5>
                  <p 
                    className="text-sm font-bold"
                    style={{ color: design.colors.active }}
                  >
                    {formatBRL(bump.price)}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Divider antes do Total */}
        <div 
          className="border-t"
          style={{ borderColor: design.colors.border || '#E5E7EB' }}
        />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span 
            className="text-base font-bold"
            style={{ color: design.colors.primaryText }}
          >
            Total
          </span>
          <span 
            className="text-xl font-bold"
            style={{ color: design.colors.active }}
          >
            {formatBRL(totalPrice)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default OrderSummaryCard;
