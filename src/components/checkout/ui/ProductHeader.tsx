/**
 * Componente: ProductHeader
 * 
 * Responsabilidade Única: Renderizar o cabeçalho do produto com imagem, nome e preço.
 * 
 * Este é um componente de UI puro e reutilizável, usado tanto no preview
 * quanto no checkout público para garantir consistência visual.
 * 
 * @version 1.0
 */

import React from 'react';
import { ImageIcon } from '@/components/icons/ImageIcon';
import { formatCentsToBRL as formatBRL } from '@/lib/money';
import type { ThemePreset } from '@/types/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductHeaderProps {
  /** Nome do produto */
  name?: string;
  
  /** Preço do produto */
  price?: number;
  
  /** URL da imagem do produto */
  imageUrl?: string;
  
  /** Tema/cores do checkout */
  design: ThemePreset;
  
  /** Classes CSS adicionais */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Cabeçalho do produto com imagem, nome e preço.
 * 
 * @example
 * <ProductHeader
 *   name="Curso de React"
 *   price={99.90}
 *   imageUrl="https://..."
 *   design={design}
 * />
 */
export const ProductHeader: React.FC<ProductHeaderProps> = ({
  name = 'Nome do Produto',
  price = 0,
  imageUrl,
  design,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Imagem do Produto */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div 
          className="w-16 h-16 rounded-lg bg-[hsl(var(--checkout-placeholder-bg))] flex items-center justify-center text-sm flex-shrink-0"
        >
          <ImageIcon className="w-8 h-8 text-[hsl(var(--checkout-placeholder-icon))]" />
        </div>
      )}
      
      {/* Nome e Preço */}
      <div className="flex-1 min-w-0">
        <h3 
          className="text-base font-bold mb-1 truncate"
          style={{ color: design.colors.primaryText }}
        >
          {name}
        </h3>
        <p 
          className="text-lg font-bold"
          style={{ color: design.colors.productPrice || design.colors.active }}
        >
          {formatBRL(price)}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default ProductHeader;
