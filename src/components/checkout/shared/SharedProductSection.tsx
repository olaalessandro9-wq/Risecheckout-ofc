/**
 * SharedProductSection
 * 
 * Componente compartilhado para exibir informações do produto
 * Usado por: Builder, Preview e Checkout Público
 * 
 * ✅ Layout compacto e idêntico em TODOS os modos
 * ✅ Single Source of Truth para exibição do produto
 */

import React from 'react';
import { ImageIcon } from '@/components/icons/ImageIcon';

interface SharedProductSectionProps {
  productData: {
    name?: string;
    description?: string;
    price?: number;
    image_url?: string;
  };
  design: {
    colors: {
      primaryText: string;
      secondaryText: string;
      productPrice?: string;
      formBackground: string;
      active?: string;
    };
  };
  mode?: 'editor' | 'preview' | 'public';
}

export const SharedProductSection: React.FC<SharedProductSectionProps> = ({
  productData,
  design,
  mode = 'public',
}) => {
  return (
    <div>
      {/* Layout Horizontal: Miniatura + Info */}
      <div className="flex items-start gap-4 mb-6">
        {/* Miniatura do Produto */}
        {productData.image_url ? (
          <img
            src={productData.image_url}
            alt={productData.name || 'Produto'}
            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-8 h-8" color="#9CA3AF" />
          </div>
        )}

        {/* Informações do Produto */}
        <div className="flex-1 min-w-0">
          {/* Nome do Produto */}
          <h1 
            className="text-xl font-bold mb-1 line-clamp-2 leading-tight"
            style={{ color: design.colors.primaryText }}
          >
            {productData.name || 'Produto'}
          </h1>

          {/* Preço */}
          <div className="flex items-baseline gap-2">
            <span 
              // Reduzido de text-2xl para text-lg para ficar mais discreto
              className="text-lg font-bold"
              style={{ color: design.colors.productPrice || design.colors.active || design.colors.primaryText }}
            >
              R$ {(Number(productData.price || 0) / 100).toFixed(2).replace('.', ',')}
            </span>
            <span 
              className="text-sm"
              style={{ color: design.colors.secondaryText }}
            >
              à vista
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
