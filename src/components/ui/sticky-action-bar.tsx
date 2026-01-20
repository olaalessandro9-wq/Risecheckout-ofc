/**
 * StickyActionBar - Barra de Ações Fixa Inferior
 * 
 * Componente reutilizável para barras de ação fixas na parte inferior da tela.
 * Inspirado na implementação do Cakto, com melhorias arquiteturais.
 * 
 * Features:
 * - Posicionamento fixo com offset dinâmico da sidebar
 * - Fundo sólido com backdrop blur
 * - Borda superior para separação visual
 * - Responsivo (mobile e desktop)
 * - Slots para ações customizadas (esquerda e direita)
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Manutenibilidade Infinita
 * @see docs/ARCHITECTURE.md - Componentes Reutilizáveis
 * 
 * @example
 * ```tsx
 * <StickyActionBar
 *   leftAction={<Button variant="destructive">Excluir</Button>}
 *   rightAction={<Button>Salvar</Button>}
 * />
 * ```
 */

import { useNavigation } from "@/modules/navigation/hooks";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface StickyActionBarProps {
  /**
   * Ação a ser renderizada no lado esquerdo da barra
   * Tipicamente ações destrutivas ou secundárias
   */
  leftAction?: React.ReactNode;
  
  /**
   * Ação a ser renderizada no lado direito da barra
   * Tipicamente ações primárias (ex: Salvar)
   */
  rightAction?: React.ReactNode;
  
  /**
   * Classes CSS adicionais para o container
   */
  className?: string;
  
  /**
   * Classes CSS adicionais para o inner container (max-width)
   */
  innerClassName?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StickyActionBar({
  leftAction,
  rightAction,
  className,
  innerClassName,
}: StickyActionBarProps) {
  const navigation = useNavigation();
  const isMobile = useIsMobile();
  
  // Offset dinâmico: em mobile sidebar é overlay, em desktop considera largura
  const leftOffset = isMobile ? 0 : navigation.currentWidth;
  
  return (
    <div
      className={cn(
        // Posicionamento fixo
        "fixed bottom-0 right-0",
        
        // Z-index: abaixo de modais (z-50), acima de conteúdo normal
        "z-40",
        
        // Visual
        "bg-background/95 backdrop-blur-sm",
        "border-t border-border",
        
        // Espaçamento
        "py-4 px-6",
        
        // Classes customizadas
        className
      )}
      style={{
        left: `${leftOffset}px`,
        transition: "left 0.2s ease-in-out",
      }}
    >
      <div
        className={cn(
          "max-w-7xl mx-auto",
          "flex items-center justify-between",
          "gap-4", // Espaçamento entre ações em mobile
          innerClassName
        )}
      >
        {/* Ação Esquerda (Destrutiva/Secundária) */}
        {leftAction && (
          <div className="flex-shrink-0">
            {leftAction}
          </div>
        )}
        
        {/* Ação Direita (Primária) */}
        {rightAction && (
          <div className="flex-shrink-0 ml-auto">
            {rightAction}
          </div>
        )}
      </div>
    </div>
  );
}
