/**
 * SharedOrderBumps
 * 
 * Componente compartilhado para exibir ofertas limitadas (order bumps)
 * Usado por: Builder, Preview e Checkout Público
 * 
 * ESTRUTURA 100% IDÊNTICA AO PREVIEW + CORES EDITÁVEIS + CORES PARA SELECIONADO
 */

import React from 'react';

interface OrderBump {
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  image_url?: string;
  call_to_action?: string;
}

interface SharedOrderBumpsProps {
  orderBumps: OrderBump[];
  selectedBumps: Set<string>;
  onToggleBump: (bumpId: string) => void;
  design: {
    colors: {
      primaryText: string;
      secondaryText: string;
      formBackground: string;
      orderBump: {
        headerBackground: string;
        headerText: string;
        contentBackground: string;
        titleText: string;
        descriptionText: string;
        priceText: string;
        footerBackground: string;
        footerText: string;
        // Cores quando selecionado
        selectedHeaderBackground?: string;
        selectedHeaderText?: string;
        selectedFooterBackground?: string;
        selectedFooterText?: string;
      };
    };
  };
  mode?: 'editor' | 'preview' | 'public';
  disabled?: boolean;
}

export const SharedOrderBumps: React.FC<SharedOrderBumpsProps> = ({
  orderBumps,
  selectedBumps,
  onToggleBump,
  design,
  mode = 'public',
  disabled = false,
}) => {
  if (!orderBumps || orderBumps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {orderBumps.map((bump) => {
        const isSelected = selectedBumps.has(bump.id);
        
        // Cores do header (com fallback para as cores normais)
        const headerBg = isSelected 
          ? (design.colors.orderBump.selectedHeaderBackground || design.colors.orderBump.headerBackground)
          : design.colors.orderBump.headerBackground;
        
        const headerText = isSelected
          ? (design.colors.orderBump.selectedHeaderText || design.colors.orderBump.headerText)
          : design.colors.orderBump.headerText;
        
        // Cores do footer (com fallback para as cores normais)
        const footerBg = isSelected
          ? (design.colors.orderBump.selectedFooterBackground || design.colors.orderBump.footerBackground)
          : design.colors.orderBump.footerBackground;
        
        const footerText = isSelected
          ? (design.colors.orderBump.selectedFooterText || design.colors.orderBump.footerText)
          : design.colors.orderBump.footerText;
        
        return (
          <div
            key={bump.id}
            onClick={() => !disabled && onToggleBump(bump.id)}
            className="rounded-lg overflow-hidden cursor-pointer transition-all"
            style={{ 
              backgroundColor: design.colors.orderBump.contentBackground,
              border: `1px solid ${headerBg}`
            }}
          >
            {/* Cabeçalho - Call to Action */}
            <div 
              className="px-3 py-2 flex items-center justify-between"
              style={{ 
                backgroundColor: headerBg
              }}
            >
              <span 
                className="text-xs font-semibold uppercase"
                style={{ color: headerText }}
              >
                {bump.call_to_action || "SIM, EU ACEITO ESSA OFERTA ESPECIAL!"}
              </span>
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ 
                  backgroundColor: isSelected ? headerText : 'transparent'
                }}
              >
                {isSelected && (
                  <svg className="w-3 h-3" fill="white" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            
            {/* Conteúdo Principal - RESTAURADO TAMANHO ORIGINAL */}
            <div className="px-3 py-2.5 space-y-1.5">
              <div className="flex gap-3">
                {/* Imagem (condicional) - Tamanho original (64px) */}
                {bump.image_url && (
                  <div 
                    className="w-16 h-16 rounded overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: headerBg }}
                  >
                    <img 
                      src={bump.image_url} 
                      alt={bump.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  {/* Título - Tamanho original */}
                  <h3 
                    className="text-sm font-semibold leading-tight"
                    style={{ color: design.colors.orderBump.titleText }}
                  >
                    {bump.name}
                  </h3>
                  
                  {/* Descrição - Tamanho original */}
                  {bump.description && (
                    <p 
                      className="text-xs mt-1 leading-relaxed"
                      style={{ color: design.colors.orderBump.descriptionText }}
                    >
                      {bump.description}
                    </p>
                  )}
                  
                  {/* Preço - Tamanho original */}
                  <div className="flex items-center gap-2 mt-2">
                    {bump.original_price && bump.original_price > bump.price ? (
                      <>
                        <span 
                          className="text-xs line-through"
                          style={{ color: design.colors.orderBump.descriptionText }}
                        >
                          R$ {(Number(bump.original_price) / 100).toFixed(2).replace('.', ',')}
                        </span>
                        <span 
                          className="text-base font-bold"
                          style={{ color: design.colors.orderBump.priceText }}
                        >
                          R$ {(Number(bump.price) / 100).toFixed(2).replace('.', ',')}
                        </span>
                      </>
                    ) : (
                      <span 
                        className="text-base font-bold"
                        style={{ color: design.colors.orderBump.priceText }}
                      >
                        R$ {(Number(bump.price) / 100).toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé - Checkbox Adicionar */}
            <div 
              className="px-3 py-2"
              style={{ 
                backgroundColor: footerBg
              }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 border-2 rounded flex items-center justify-center"
                  style={{ 
                    borderColor: isSelected ? design.colors.orderBump.priceText : footerText,
                    backgroundColor: isSelected ? design.colors.orderBump.priceText : 'transparent'
                  }}
                >
                  {isSelected && (
                    <svg className="w-3 h-3" fill="white" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span 
                  className="text-xs"
                  style={{ color: footerText }}
                >
                  Adicionar Produto
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
