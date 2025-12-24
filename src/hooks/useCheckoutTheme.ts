import { useEffect } from "react";
import type { ThemePreset } from "@/lib/checkout/themePresets";

// Função auxiliar para detectar se uma cor hex é escura
const isDarkColor = (hexColor: string): boolean => {
  if (!hexColor) return false;
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  // Fórmula de luminância (padrão W3C)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

interface CheckoutThemeData {
  theme?: string;
  design?: {
    theme?: string;
    colors?: {
      background?: string;
    };
  };
}

/**
 * Hook para gerenciar tema e estilos do checkout
 * 
 * Responsabilidades:
 * - Aplicar tema dark/light no documento
 * - Aplicar background do checkout no body
 * - Remover margens/padding para eliminar faixas
 * - Restaurar estilos originais ao desmontar
 * 
 * @param checkout - Dados do checkout com tema e design
 * @param design - Preset de design com cores
 */
export const useCheckoutTheme = (
  checkout: CheckoutThemeData | null,
  design: ThemePreset | null
) => {
  // Aplicar tema dark/light no documento
  useEffect(() => {
    if (!checkout) return;

    // Lógica inteligente de tema
    const explicitTheme = checkout.theme || checkout.design?.theme;
    let finalTheme = 'light';

    if (explicitTheme === 'dark') {
      finalTheme = 'dark';
    } else if (explicitTheme === 'custom') {
      // Se for custom, verifica se a cor de fundo é escura
      const bgColor = checkout.design?.colors?.background || '#ffffff';
      if (isDarkColor(bgColor)) {
        finalTheme = 'dark';
      }
    }

    const root = document.documentElement;
    if (finalTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Cleanup ao desmontar
    return () => {
      root.classList.remove('dark');
    };
  }, [checkout]);

  // Forçar background do body e remover espaços para eliminar faixas azuis
  useEffect(() => {
    if (!design) return;
    
    // Salvar valores originais
    const originalBodyBackground = document.body.style.background;
    const originalBodyMargin = document.body.style.margin;
    const originalBodyPadding = document.body.style.padding;
    const originalHtmlMargin = document.documentElement.style.margin;
    const originalHtmlPadding = document.documentElement.style.padding;
    
    // Aplicar background do checkout e remover espaços
    document.body.style.background = design.colors.background;
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    
    // Restaurar ao desmontar
    return () => {
      document.body.style.background = originalBodyBackground;
      document.body.style.margin = originalBodyMargin;
      document.body.style.padding = originalBodyPadding;
      document.documentElement.style.margin = originalHtmlMargin;
      document.documentElement.style.padding = originalHtmlPadding;
    };
  }, [design]);
};
