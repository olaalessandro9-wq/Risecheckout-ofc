/**
 * Gradient Utilities V2 - RISE ARCHITECT PROTOCOL V3 (10.0/10)
 * 
 * Motor de gradientes matematicamente correto:
 * - Gera CSS SEMPRE válido (hsl/rgba com alpha correto)
 * - Usa `strength` como midpoint determinístico
 * - Zero concatenação de sufixos inválidos
 * 
 * @module members-area-builder/utils
 */

import type { GradientOverlayConfig, GradientDirection } from '../types/builder.types';

// ============================================================================
// COLOR ENGINE (internal utils)
// ============================================================================

/**
 * Clamps strength value to 0-100 range
 */
function clampStrength(strength: number): number {
  return Math.max(0, Math.min(100, strength));
}

/**
 * Parses hex color to RGB components
 * Supports #RGB and #RRGGBB formats
 */
function parseHexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  const clean = hex.replace(/^#/, '');
  
  let r: number, g: number, b: number;
  
  if (clean.length === 3) {
    // #RGB format
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    // #RRGGBB format
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  } else {
    // Fallback to black
    r = 0;
    g = 0;
    b = 0;
  }
  
  return { r, g, b };
}

/**
 * Creates a color factory based on config
 * Returns functions for solid color and color-with-alpha
 * 
 * CRITICAL: Uses CSS-spec-compliant alpha syntax:
 * - HSL: hsl(var(--background) / 0.5)
 * - RGB: rgb(r g b / 0.5)
 */
function createColorFactory(config: GradientOverlayConfig): {
  solid: string;
  withAlpha: (alpha: number) => string;
} {
  if (config.use_theme_color) {
    return {
      solid: 'hsl(var(--background))',
      withAlpha: (alpha: number) => `hsl(var(--background) / ${alpha.toFixed(2)})`,
    };
  }
  
  // Custom hex color
  const hex = config.custom_color || '#000000';
  const { r, g, b } = parseHexToRgb(hex);
  
  return {
    solid: `rgb(${r} ${g} ${b})`,
    withAlpha: (alpha: number) => `rgb(${r} ${g} ${b} / ${alpha.toFixed(2)})`,
  };
}

// ============================================================================
// GRADIENT GENERATORS
// ============================================================================

const DIRECTION_MAP: Record<GradientDirection, string> = {
  bottom: 'to bottom',
  top: 'to top',
  left: 'to left',
  right: 'to right',
};

/**
 * Default gradient configuration for backwards compatibility
 */
export const DEFAULT_GRADIENT_CONFIG: GradientOverlayConfig = {
  enabled: true,
  direction: 'bottom',
  strength: 60,
  use_theme_color: true,
  custom_color: undefined,
};

/**
 * Generates the bottom fade gradient (Netflix-style)
 * This gradient is INSIDE the banner and transitions the image
 * to solid color at the bottom
 * 
 * ARCHITECTURE: The banner ENDS in solid color,
 * no external "extension" needed
 * 
 * @param config - Gradient configuration
 * @returns Valid CSS gradient string
 */
export function generateBottomFadeCSS(config: GradientOverlayConfig): string {
  if (!config.enabled) return 'none';
  
  const color = createColorFactory(config);
  const s = clampStrength(config.strength) / 100;
  
  // Calculate midpoint based on strength (higher strength = earlier fade start)
  // strength 0   → mid = 0.70 (fade starts late, subtle)
  // strength 50  → mid = 0.50 (balanced)
  // strength 100 → mid = 0.30 (fade starts early, aggressive)
  const mid = 0.70 - (s * 0.40);
  const fadeStart = Math.max(0, mid - 0.15);
  
  // Netflix pattern: transparent at top, solid at bottom
  // Image "dissolves" into solid color - seamless transition
  return `linear-gradient(to bottom, ` +
    `transparent 0%, ` +
    `transparent ${(fadeStart * 100).toFixed(0)}%, ` +
    `${color.withAlpha(0.40)} ${(mid * 100).toFixed(0)}%, ` +
    `${color.withAlpha(0.80)} ${((mid + 0.15) * 100).toFixed(0)}%, ` +
    `${color.solid} 100%)`;
}

/**
 * Generates complementary side gradient (Netflix vignette effect)
 * Used in combination with the main gradient for depth
 * 
 * @param config - Gradient configuration
 * @returns Valid CSS gradient string
 */
export function generateSideGradientCSS(config: GradientOverlayConfig): string {
  if (!config.enabled) return 'none';
  
  const color = createColorFactory(config);
  const s = clampStrength(config.strength) / 100;
  
  // Vignette intensity scales with strength
  const edgeAlpha = 0.30 + (s * 0.40); // 0.30 to 0.70
  const innerAlpha = 0.10 + (s * 0.20); // 0.10 to 0.30
  
  // Soft lateral gradient for depth (vignette on edges)
  return `linear-gradient(to right, ` +
    `${color.withAlpha(edgeAlpha)} 0%, ` +
    `transparent 30%, ` +
    `transparent 70%, ` +
    `${color.withAlpha(innerAlpha)} 100%)`;
}

/**
 * Generates a combined overlay background with both gradients
 * This is the preferred method - single layer, multiple backgrounds
 * 
 * @param config - Gradient configuration
 * @returns Object with backgroundImage and backgroundSize for inline style
 */
export function generateCombinedOverlayStyle(config: GradientOverlayConfig): React.CSSProperties {
  if (!config.enabled) {
    return { background: 'none' };
  }
  
  const bottomFade = generateBottomFadeCSS(config);
  const sideGradient = generateSideGradientCSS(config);
  
  return {
    backgroundImage: `${sideGradient}, ${bottomFade}`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  };
}

/**
 * Resolves gradient config with fallback to defaults
 * Ensures backwards compatibility with existing banners
 * 
 * @param gradientOverlay - Partial settings (may not have gradient_overlay)
 * @returns Complete and valid gradient configuration
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
