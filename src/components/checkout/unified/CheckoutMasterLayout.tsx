/**
 * CheckoutMasterLayout
 * 
 * 🎯 Single Source of Truth para TODA a estrutura de página do checkout
 * 
 * Responsabilidades:
 * - Wrapper da página (min-h-screen, background, font)
 * - Container responsivo (max-width, padding)
 * - TopComponents (lógica condicional por MODE: editor vs preview/public)
 * - Checkout fixo no meio (formulário, pagamento, resumo)
 * - BottomComponents (lógica condicional por MODE)
 * 
 * Usado por:
 * - CheckoutEditorMode (Builder com drag-and-drop)
 * - CheckoutPreviewLayout (Preview sem interatividade)
 * - PublicCheckoutV2 (Checkout público funcional)
 * 
 * ✅ Alterar layout: 1 arquivo ao invés de 3
 * ✅ Garantia de consistência visual entre todos os modos
 * ✅ Mantém performance (componentes leves vs pesados por modo)
 * 
 * 🔧 REFATORAÇÃO FINAL (08/12/2025):
 * - Removida toda lógica de 'rows' (componentes no meio)
 * - Apenas topComponents e bottomComponents são editáveis
 * - O meio é o checkout fixo (não editável, apenas cores via Design)
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { CheckoutLayout } from '@/components/checkout/layout/CheckoutLayout';
import { ComponentRenderer } from '@/components/checkout/builder/ComponentRenderer';
import CheckoutComponentRenderer from '@/components/checkout/CheckoutComponentRenderer';
import { CheckoutCustomization, ViewMode } from '@/hooks/useCheckoutEditor';
import { ThemePreset } from '@/types/theme';
import { cn } from '@/lib/utils';

interface CheckoutMasterLayoutProps {
  // Modo de operação
  mode: 'editor' | 'preview' | 'public';
  
  // Configurações visuais
  design: ThemePreset;
  customization?: CheckoutCustomization;
  
  // ViewMode (desktop/mobile/public)
  viewMode?: ViewMode;
  
  // Conteúdo central (slot para o checkout fixo)
  children: React.ReactNode;
  
  // Props específicas do editor/preview
  isPreviewMode?: boolean;
  selectedComponentId?: string | null;
  onSelectComponent?: (id: string | null) => void;
}

export const CheckoutMasterLayout: React.FC<CheckoutMasterLayoutProps> = ({
  mode,
  design,
  customization,
  viewMode = 'desktop',
  children,
  isPreviewMode = false,
  selectedComponentId,
  onSelectComponent,
}) => {
  // Drop zones (apenas para modo editor)
  const { setNodeRef: setTopRef, isOver: isTopOver } = useDroppable({ 
    id: 'top-drop-zone',
    disabled: mode !== 'editor'
  });
  
  const { setNodeRef: setBottomRef, isOver: isBottomOver } = useDroppable({ 
    id: 'bottom-drop-zone',
    disabled: mode !== 'editor'
  });

  // Determinar max-width baseado no viewMode
  // Mobile: 480px para dar mais espaço horizontal aos componentes
  const maxWidth = viewMode === 'mobile' ? '480px' : viewMode === 'public' ? '7xl' : '1100px';
  
  // IMPORTANTE: Sistema de Cores do Checkout
  // - BUILDER_FRAME_COLOR: Cor FIXA ao redor do checkout (frame do builder)
  // - checkoutBackgroundColor: Cor EDITÁVEL do bloco do checkout (via painel Design)
  const BUILDER_FRAME_COLOR = '#2a2a2a'; // Cor fixa do frame (não editável)
  const checkoutBackgroundColor = design.colors.background || '#FFFFFF';

  // Verificar se há componentes para renderizar
  const hasTopComponents = customization?.topComponents && customization.topComponents.length > 0;
  const hasBottomComponents = customization?.bottomComponents && customization.bottomComponents.length > 0;
  
  // Determinar se estamos no builder (editor/preview) vs checkout público
  const isInBuilder = mode !== 'public';
  const isMobilePreview = viewMode === 'mobile';

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        // No builder: usar cor do frame fixa | No público: usar cor editável
        backgroundColor: isInBuilder ? BUILDER_FRAME_COLOR : checkoutBackgroundColor,
      }}
    >
      {mode === 'public' ? (
        // Modo Público: Container simples
        // AJUSTE MOBILE: Reduzido padding horizontal de px-4 para px-2 no mobile (md:px-4)
        // Isso permite que o conteúdo ocupe quase toda a largura da tela, estilo Cakto
        <div className="py-4 px-2 md:py-8 md:px-4">
          <div className="max-w-7xl mx-auto">
            {/* TopComponents no público (topo absoluto) */}
            {hasTopComponents && (
              <div className="mb-4 md:mb-6">
                {customization.topComponents.map((component) => (
                  <CheckoutComponentRenderer
                    key={component.id}
                    component={component}
                    design={design}
                    isPreviewMode={false}
                  />
                ))}
              </div>
            )}

            {/* Checkout fixo (formulário, pagamento, resumo) */}
            {children}

            {/* BottomComponents no público (rodapé) */}
            {hasBottomComponents && (
              <div className="mt-4 md:mt-6">
                {customization.bottomComponents.map((component) => (
                  <CheckoutComponentRenderer
                    key={component.id}
                    component={component}
                    design={design}
                    isPreviewMode={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Modo Editor/Preview: Usa CheckoutLayout
        <CheckoutLayout
          maxWidth={maxWidth}
          backgroundColor={checkoutBackgroundColor}
          isPreviewMode={isPreviewMode}
          viewMode={viewMode}
        >
          {/* TopComponents - Área Editável do Topo */}
          {mode === 'editor' ? (
            // Editor: Drop zone + componentes editáveis
            <div
              ref={setTopRef}
              className={cn(
                'border-2 border-dashed rounded-lg p-4 mb-6 transition-all',
                isTopOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400',
                hasTopComponents && 'min-h-[100px]'
              )}
            >
              {hasTopComponents ? (
                <div className="space-y-2">
                  {customization.topComponents.map((component) => (
                    <ComponentRenderer
                      key={component.id}
                      component={component}
                      customization={customization}
                      isSelected={selectedComponentId === component.id}
                      onClick={() => onSelectComponent?.(component.id)}
                      isDraggable={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <Plus className="w-5 h-5" />
                  <span className="text-sm">Arraste componentes aqui (topo)</span>
                </div>
              )}
            </div>
          ) : (
            // Preview: Componentes apenas para visualização
            hasTopComponents && (
              <div className="mb-6 space-y-2">
                {customization.topComponents.map((component) => (
                  <CheckoutComponentRenderer
                    key={component.id}
                    component={component}
                    design={design}
                    isPreviewMode={false}
                  />
                ))}
              </div>
            )
          )}

          {/* Checkout fixo no meio (formulário, pagamento, resumo) */}
          {children}

          {/* BottomComponents - Área Editável do Rodapé */}
          {mode === 'editor' ? (
            // Editor: Drop zone + componentes editáveis
            <div
              ref={setBottomRef}
              className={cn(
                'border-2 border-dashed rounded-lg p-4 mt-6 transition-all',
                isBottomOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400',
                hasBottomComponents && 'min-h-[100px]'
              )}
            >
              {hasBottomComponents ? (
                <div className="space-y-2">
                  {customization.bottomComponents.map((component) => (
                    <ComponentRenderer
                      key={component.id}
                      component={component}
                      customization={customization}
                      isSelected={selectedComponentId === component.id}
                      onClick={() => onSelectComponent?.(component.id)}
                      isDraggable={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <Plus className="w-5 h-5" />
                  <span className="text-sm">Arraste componentes aqui (rodapé)</span>
                </div>
              )}
            </div>
          ) : (
            // Preview: Componentes apenas para visualização
            hasBottomComponents && (
              <div className="mt-6 space-y-2">
                {customization.bottomComponents.map((component) => (
                  <CheckoutComponentRenderer
                    key={component.id}
                    component={component}
                    design={design}
                    isPreviewMode={false}
                  />
                ))}
              </div>
            )
          )}
        </CheckoutLayout>
      )}
    </div>
  );
};
