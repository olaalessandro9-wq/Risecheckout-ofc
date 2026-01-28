/**
 * Gradient Utilities
 * Gera CSS para gradientes baseado em configuração
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 * @module members-area-builder/utils
 */

import type { GradientOverlayConfig, GradientDirection } from '../types/builder.types';

const DIRECTION_MAP: Record<GradientDirection, string> = {
  bottom: 'to bottom',
  top: 'to top',
  left: 'to left',
  right: 'to right',
};

/**
 * Default gradient configuration for backwards compatibility
 * Used when banners don't have gradient_overlay settings
 */
export const DEFAULT_GRADIENT_CONFIG: GradientOverlayConfig = {
  enabled: true,
  direction: 'bottom',
  strength: 60,
  use_theme_color: true,
  custom_color: undefined,
};

/**
 * Gera o gradiente de fade inferior (Netflix-style)
 * Este gradiente fica DENTRO do banner e faz a imagem
 * transicionar para cor sólida no bottom
 * 
 * ARQUITETURA CORRETA: O banner TERMINA em cor sólida,
 * não precisa de "extension" externa
 * 
 * @param config - Configuração do gradiente
 * @returns String CSS do gradiente
 */
export function generateBottomFadeCSS(
  config: GradientOverlayConfig
): string {
  if (!config.enabled) return 'none';
  
  const color = config.use_theme_color 
    ? 'hsl(var(--background))' 
    : (config.custom_color || '#000000');
  
  // Netflix pattern: transparente no topo, sólido no bottom
  // A imagem "dissolve" em cor sólida - transição imperceptível
  return `linear-gradient(to bottom, transparent 0%, transparent 30%, ${color}40 50%, ${color}80 70%, ${color} 100%)`;
}

/**
 * Gera o gradiente lateral complementar (efeito Netflix)
 * Usado em combinação com o gradiente principal para profundidade
 * 
 * @param config - Configuração do gradiente
 * @param themeColor - Cor do tema (usada se use_theme_color = true)
 * @returns String CSS do gradiente lateral
 */
export function generateSideGradientCSS(
  config: GradientOverlayConfig,
  themeColor?: string
): string {
  if (!config.enabled) return 'none';
  
  const color = config.use_theme_color 
    ? (themeColor || 'hsl(var(--background))') 
    : (config.custom_color || '#000000');
  
  // Gradiente lateral suave para dar profundidade (vinheta nas bordas)
  return `linear-gradient(to right, ${color}80 0%, transparent 40%, transparent 60%, ${color}40 100%)`;
}

// generateExtensionGradientCSS foi removida - arquitetura Netflix não precisa de extension
// O gradiente INTERNO (generateBottomFadeCSS) faz a imagem terminar em cor sólida

/**
 * Resolve a configuração de gradiente com fallback para default
 * Garante retrocompatibilidade com banners existentes
 * 
 * @param settings - Settings parciais do banner (pode não ter gradient_overlay)
 * @returns Configuração de gradiente completa e válida
 */
export function resolveGradientConfig(
  gradientOverlay?: Partial<GradientOverlayConfig>
): GradientOverlayConfig {
  if (!gradientOverlay) return DEFAULT_GRADIENT_CONFIG;
  
  return {
    enabled: gradientOverlay.enabled ?? DEFAULT_GRADIENT_CONFIG.enabled,
    direction: gradientOverlay.direction ?? DEFAULT_GRADIENT_CONFIG.direction,
    strength: gradientOverlay.strength ?? DEFAULT_GRADIENT_CONFIG.strength,
    use_theme_color: gradientOverlay.use_theme_color ?? DEFAULT_GRADIENT_CONFIG.use_theme_color,
    custom_color: gradientOverlay.custom_color ?? DEFAULT_GRADIENT_CONFIG.custom_color,
  };
}
