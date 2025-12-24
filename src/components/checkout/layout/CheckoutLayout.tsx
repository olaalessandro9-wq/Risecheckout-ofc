/**
 * CheckoutLayout - Layout Simplificado para Checkout (Refatoração Incremental v2)
 * 
 * MUDANÇAS v2 (08/12/2025):
 * - Adicionado "frame mobile" para o preview no builder
 * - Cor fixa ao redor do checkout (cinza #2a2a2a) - não editável
 * - Cor de fundo do checkout (editável via painel Design)
 * - No modo public, a cor editável ocupa toda a tela
 */

import { ReactNode, useMemo } from "react";
import { cn } from "@/lib/utils";

interface CheckoutLayoutProps {
  /** Conteúdo da coluna esquerda (formulários, bumps, etc) */
  children: ReactNode;
  
  /** Conteúdo da coluna direita (resumo do pedido) - Opcional */
  rightColumn?: ReactNode;
  
  /** Cor de fundo do checkout (editável via Design) */
  backgroundColor?: string;
  
  /** Imagem de fundo (futuro) */
  backgroundImage?: string;
  
  /** Classes CSS adicionais para o container */
  className?: string;
  
  /** Largura máxima do container (padrão: 1100px) */
  maxWidth?: string;
  
  /** Proporção do grid (padrão: 7/5) */
  gridRatio?: "7/5" | "8/4" | "6/6";
  
  /** Se está em modo preview (remove sticky da coluna direita) */
  isPreviewMode?: boolean;
  
  /** Modo de visualização (desktop ou mobile) */
  viewMode?: "desktop" | "mobile" | "public";
}

// Cor FIXA do frame do builder (não editável pelo usuário)
const BUILDER_FRAME_COLOR = '#2a2a2a';

export const CheckoutLayout = ({ 
  children, 
  rightColumn, 
  backgroundColor = "#f3f4f6",
  backgroundImage,
  className,
  maxWidth = "1100px",
  gridRatio = "7/5",
  isPreviewMode = false,
  viewMode = "desktop"
}: CheckoutLayoutProps) => {
  
  // Grid column classes baseado no gridRatio
  const gridConfig = useMemo(() => ({
    left: {
      "7/5": "lg:col-span-7",
      "8/4": "lg:col-span-8",
      "6/6": "lg:col-span-6"
    }[gridRatio],
    right: {
      "7/5": "lg:col-span-5",
      "8/4": "lg:col-span-4",
      "6/6": "lg:col-span-6"
    }[gridRatio]
  }), [gridRatio]);

  // Determinar se estamos no builder (editor/preview) vs checkout público
  const isInBuilder = viewMode !== 'public';
  const isMobilePreview = viewMode === 'mobile';

  // Em mobile no builder: mostrar frame visual separado
  if (isMobilePreview && isInBuilder) {
    return (
      // Container externo com cor FIXA (frame do builder)
      <div 
        className={cn(
          "min-h-screen w-full flex items-start justify-center",
          "py-8 px-4",
          className
        )}
        style={{ backgroundColor: BUILDER_FRAME_COLOR }}
      >
        {/* Frame Mobile - Container interno com cor EDITÁVEL */}
        <div 
          className="w-full rounded-xl overflow-hidden shadow-2xl"
          style={{ 
            maxWidth,
            backgroundColor,
            minHeight: '80vh'
          }}
        >
          {/* Conteúdo do checkout */}
          <div className="py-4 px-3">
            <div className="space-y-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop no builder ou checkout público
  return (
    // Container Principal
    <div 
      className={cn(
        "min-h-screen w-full flex justify-center",
        "py-4 px-2 lg:py-12 lg:px-6",
        className
      )}
      style={{ backgroundColor: isInBuilder ? BUILDER_FRAME_COLOR : backgroundColor }}
    >
      {/* Container com Max-Width */}
      <div 
        className="w-full h-full"
        style={{ 
          maxWidth,
          // No builder desktop: também mostrar o container do checkout com cor editável
          ...(isInBuilder && viewMode === 'desktop' ? {
            backgroundColor,
            padding: '24px'
          } : {})
        }}
      >
        {/* Grid Responsivo */}
        <div className={cn(
          "grid grid-cols-1 gap-6 items-start",
          rightColumn && "lg:grid-cols-12 lg:gap-8"
        )}>
          
          {/* Coluna Esquerda */}
          <div className={cn(
            "w-full space-y-6",
            rightColumn && gridConfig.left
          )}>
            {children}
          </div>

          {/* Coluna Direita (Desktop Only) */}
          {rightColumn && (
            <div className={cn(
              "hidden lg:block w-full space-y-6",
              !isPreviewMode && "sticky top-6",
              gridConfig.right
            )}>
              {rightColumn}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};
