/**
 * Gradient Utilities V3 - RISE ARCHITECT PROTOCOL V3 (10.0/10)
 * 
 * Motor de gradientes com SMOOTHSTEP matemático:
 * - Multi-stop (10+ stops) para transição perceptualmente suave
 * - Função smoothstep (Hermite polynomial) para easing
 * - Segue Lei de Weber-Fechner (percepção visual humana)
 * - Industry-standard: Netflix, Disney+, CGI
 * 
 * @module members-area-builder/utils
 */

import type { GradientOverlayConfig, GradientDirection } from '../types';

// ============================================================================
// MATHEMATICAL EASING (SMOOTHSTEP)
// ============================================================================

/**
 * Smoothstep easing function (Hermite interpolation)
 * Creates perceptually smooth transition following
 * human visual perception curve
 * 
 * Formula: 3t² - 2t³ (Hermite polynomial)
 * 
 * @param t - Normalized value (0 to 1)
 * @returns Eased value (0 to 1)
 */
function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

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
  const clean = hex.replace(/^#/, '');
  
  let r: number, g: number, b: number;
  
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  } else {
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
      withAlpha: (alpha: number) => `hsl(var(--background) / ${alpha.toFixed(3)})`,
    };
  }
  
  const hex = config.custom_color || '#000000';
  const { r, g, b } = parseHexToRgb(hex);
  
  return {
    solid: `rgb(${r} ${g} ${b})`,
    withAlpha: (alpha: number) => `rgb(${r} ${g} ${b} / ${alpha.toFixed(3)})`,
  };
}

// ============================================================================
// GRADIENT GENERATORS (MULTI-STOP WITH SMOOTHSTEP)
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
 * Generates the bottom fade gradient (Netflix-style) with MULTI-STOP SMOOTHSTEP
 * 
 * Uses 10+ color stops with smoothstep easing for perceptually smooth transition.
 * This eliminates visible "lines" caused by abrupt opacity jumps.
 * 
 * ARCHITECTURE:
 * - Higher strength = fade starts earlier (more aggressive)
 * - Lower strength = fade starts later (more subtle)
 * - Smoothstep ensures human eye perceives linear transition
 * 
 * @param config - Gradient configuration
 * @returns Valid CSS gradient string with 10+ stops
 */
export function generateBottomFadeCSS(config: GradientOverlayConfig): string {
  if (!config.enabled) return 'none';
  
  const color = createColorFactory(config);
  const s = clampStrength(config.strength) / 100;
  
  // Number of stops for perceptually smooth transition
  const NUM_STOPS = 10;
  
  // Start position: higher strength = fade starts earlier
  // strength 0   → startPercent = 60% (fade starts late, subtle)
  // strength 100 → startPercent = 20% (fade starts early, aggressive)
  const startPercent = 60 - (s * 40);
  const endPercent = 100;
  const range = endPercent - startPercent;
  
  // Build gradient stops with smoothstep easing
  const stops: string[] = ['transparent 0%'];
  
  // Add transparent zone before fade starts
  if (startPercent > 0) {
    stops.push(`transparent ${startPercent.toFixed(0)}%`);
  }
  
  // Generate NUM_STOPS with smoothstep easing
  for (let i = 1; i <= NUM_STOPS; i++) {
    const t = i / NUM_STOPS; // 0.1, 0.2, ..., 1.0
    const alpha = smoothstep(t); // Eased opacity (follows perception curve)
    const percent = startPercent + (range * t);
    
    if (i === NUM_STOPS) {
      // Last stop is solid color
      stops.push(`${color.solid} ${percent.toFixed(0)}%`);
    } else {
      stops.push(`${color.withAlpha(alpha)} ${percent.toFixed(0)}%`);
    }
  }
  
  return `linear-gradient(to bottom, ${stops.join(', ')})`;
}

/**
 * Generates complementary side gradient (Netflix vignette effect) with MULTI-STOP
 * 
 * Uses more stops for smoother vignette on edges
 * 
 * @param config - Gradient configuration
 * @returns Valid CSS gradient string
 */
export function generateSideGradientCSS(config: GradientOverlayConfig): string {
  if (!config.enabled) return 'none';
  
  const color = createColorFactory(config);
  const s = clampStrength(config.strength) / 100;
  
  // Maximum intensity at edges based on strength
  const maxAlpha = 0.25 + (s * 0.35); // 0.25 to 0.60
  
  // Multi-stop vignette for smoother effect
  return `linear-gradient(to right, ` +
    `${color.withAlpha(maxAlpha)} 0%, ` +
    `${color.withAlpha(maxAlpha * 0.70)} 5%, ` +
    `${color.withAlpha(maxAlpha * 0.40)} 12%, ` +
    `transparent 25%, ` +
    `transparent 75%, ` +
    `${color.withAlpha(maxAlpha * 0.30)} 88%, ` +
    `${color.withAlpha(maxAlpha * 0.60)} 95%, ` +
    `${color.withAlpha(maxAlpha * 0.85)} 100%)`;
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
