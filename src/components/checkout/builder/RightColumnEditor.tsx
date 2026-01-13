import { ReactNode } from "react";
import type { ThemePreset } from "@/lib/checkout/themePresets";

interface RightColumnEditorProps {
  isPreviewMode: boolean;
  design: ThemePreset;
  children?: ReactNode;
}

/**
 * RightColumnEditor - Componente para gerenciar a coluna direita no builder
 * 
 * SIMPLIFICADO: Renderiza limpo tanto no Preview quanto no Builder
 * - Edição é feita pela aba "Configurações", não clicando no resumo
 * - Sem bordas tracejadas, ícones ou labels visuais
 */
export const RightColumnEditor = ({ 
  isPreviewMode, 
  design, 
  children 
}: RightColumnEditorProps) => {
  // Renderiza limpo em ambos os modos
  return <div className="space-y-6">{children}</div>;
};
