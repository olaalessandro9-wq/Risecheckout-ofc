/**
 * Gradient Utilities V4 - RISE ARCHITECT PROTOCOL V3 (10.0/10)
 * 
 * Netflix Architecture: Seamless Header-to-Content Transition
 * 
 * KEY PRINCIPLES:
 * 1. Header bottom is ALWAYS 100% opaque — photo never bleeds through
 * 2. Strength controls WHERE the fade STARTS, not the final opacity
 * 3. Content uses a BRIDGE GRADIENT (120px smoothstep) that blends
 *    from fully opaque (matching header bottom) to contentAlpha
 * 4. CSS compositing: backgroundImage paints OVER backgroundColor
 *    Result = gradientAlpha + bgAlpha × (1 - gradientAlpha)
 * 
 * VISUAL RESULT: Zero cut at ANY intensity level.
 * 
 * @module members-area-builder/utils
 */

import type React from 'react';
import type { GradientOverlayConfig } from '../types';
import { createColorFactory, parseHexToRgb, hexToHSL } from './colorUtils';

// ============================================================================
// MATHEMATICAL EASING (SMOOTHSTEP)
// ============================================================================

/**
 * Smoothstep easing function (Hermite interpolation)
 * Formula: 3t² - 2t³ (Hermite polynomial)
 */
function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

/** Clamps strength value to 0-100 range */
function clampStrength(strength: number): number {
  return Math.max(0, Math.min(100, strength));
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default gradient configuration for backwards compatibility */
export const DEFAULT_GRADIENT_CONFIG: GradientOverlayConfig = {
  enabled: true,
  direction: 'bottom',
  strength: 60,
  use_theme_color: true,
  custom_color: undefined,
};

/** Height (px) of the bridge transition zone between header and content */
const BRIDGE_HEIGHT_PX = 120;

/** Number of color stops in the bridge gradient */
const BRIDGE_NUM_STOPS = 8;

// ============================================================================
// HEADER GRADIENT (MULTI-STOP WITH SMOOTHSTEP)
// ============================================================================

/**
 * Generates the bottom fade gradient (Netflix-style) with MULTI-STOP SMOOTHSTEP.
 * 
 * ARCHITECTURE (Netflix Model):
 * - maxAlpha is ALWAYS 1.0 — the header bottom is fully opaque
 * - The photo is NEVER visible at the bottom edge
 * - Strength controls startPercent (where the fade begins):
 *   - strength 0:   fade starts at 70%
 *   - strength 100: fade starts at 20%
 * - The bridge gradient in buildGradientContentStyle handles the
 *   transition from opaque to contentAlpha in the content area
 */
export function generateBottomFadeCSS(config: GradientOverlayConfig): string {
  if (!config.enabled) return 'none';

  const color = createColorFactory(config);
  const s = clampStrength(config.strength) / 100;
  const NUM_STOPS = 10;

  const startPercent = 70 - (s * 50);
  const endPercent = 100;
  const range = endPercent - startPercent;

  // NETFLIX: Bottom edge is ALWAYS fully opaque. Zero visual cut.
  const maxAlpha = 1.0;

  const stops: string[] = ['transparent 0%'];

  if (startPercent > 0) {
    stops.push(`transparent ${startPercent.toFixed(0)}%`);
  }

  for (let i = 1; i <= NUM_STOPS; i++) {
    const t = i / NUM_STOPS;
    const alpha = smoothstep(t) * maxAlpha;
    const percent = startPercent + (range * t);
    stops.push(`${color.withAlpha(alpha)} ${percent.toFixed(0)}%`);
  }

  return `linear-gradient(to bottom, ${stops.join(', ')})`;
}

/**
 * Generates complementary side gradient (Netflix vignette effect).
 */
export function generateSideGradientCSS(config: GradientOverlayConfig): string {
  if (!config.enabled) return 'none';

  const color = createColorFactory(config);
  const s = clampStrength(config.strength) / 100;
  const maxAlpha = 0.25 + (s * 0.35);

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
 * Generates a combined overlay with both bottom fade and vignette.
 */
export function generateCombinedOverlayStyle(config: GradientOverlayConfig): React.CSSProperties {
  if (!config.enabled) {
    return { background: 'none' };
  }

  return {
    backgroundImage: `${generateSideGradientCSS(config)}, ${generateBottomFadeCSS(config)}`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  };
}

// ============================================================================
// CONFIG RESOLVER
// ============================================================================

/**
 * Resolves gradient config with fallback to defaults.
 * Ensures backwards compatibility with existing data.
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

// ============================================================================
// BRIDGE GRADIENT (Seamless Header-to-Content Transition)
// ============================================================================

/**
 * Builds a smoothstep bridge gradient: fully opaque → transparent
 * over BRIDGE_HEIGHT_PX (120px).
 * 
 * CSS COMPOSITING:
 * backgroundImage paints OVER backgroundColor (same hue, different alpha).
 *   result = bridgeAlpha + contentAlpha × (1 - bridgeAlpha)
 * 
 * - At 0px:   bridgeAlpha=1.0 → result = 1.0 (matches header bottom)
 * - At 60px:  bridgeAlpha≈0.5 → blended transition
 * - At 120px: bridgeAlpha=0.0 → result = contentAlpha (ambient)
 */
function buildSmoothBridgeStops(
  withAlpha: (alpha: number) => string
): string {
  const stops: string[] = [];

  for (let i = 0; i <= BRIDGE_NUM_STOPS; i++) {
    const t = i / BRIDGE_NUM_STOPS;
    const eased = smoothstep(t);
    const alpha = 1.0 - eased;
    const px = Math.round(BRIDGE_HEIGHT_PX * t);
    stops.push(`${withAlpha(alpha)} ${px}px`);
  }

  return `linear-gradient(to bottom, ${stops.join(', ')})`;
}

// ============================================================================
// CONTENT STYLE (Custom Color + Bridge)
// ============================================================================

/**
 * Builds React.CSSProperties for content containers (custom color only).
 * 
 * NETFLIX ARCHITECTURE — THREE layers:
 * 1. `--background`: HSL values for child components using bg-background
 * 2. `backgroundColor`: Ambient content opacity (contentAlpha)
 * 3. `backgroundImage`: Bridge gradient (120px smoothstep) that blends
 *    from fully-opaque header bottom into ambient contentAlpha
 * 
 * Returns undefined when gradient is disabled or using theme color
 * (theme color needs no override — bg-background already matches).
 */
export function buildGradientContentStyle(
  config: GradientOverlayConfig
): React.CSSProperties | undefined {
  if (!config.enabled || config.use_theme_color) return undefined;

  const hex = config.custom_color || '#000000';
  const hsl = hexToHSL(hex);
  const s = clampStrength(config.strength) / 100;
  const contentAlpha = 0.1 + (s * 0.9);

  const { r, g, b } = parseHexToRgb(hex);
  const withAlpha = (alpha: number) => `rgb(${r} ${g} ${b} / ${alpha.toFixed(3)})`;

  return {
    '--background': hsl,
    backgroundColor: `hsl(${hsl} / ${contentAlpha})`,
    backgroundImage: buildSmoothBridgeStops(withAlpha),
    backgroundRepeat: 'no-repeat',
  } as React.CSSProperties;
}
