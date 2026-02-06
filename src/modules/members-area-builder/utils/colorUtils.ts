/**
 * Color Utilities - RISE ARCHITECT PROTOCOL V3 (10.0/10)
 * 
 * Pure color conversion and factory functions extracted from
 * the gradient engine. Zero side effects, zero dependencies.
 * 
 * @module members-area-builder/utils
 */

import type { GradientOverlayConfig } from '../types';

// ============================================================================
// HEX → RGB CONVERSION
// ============================================================================

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Parses hex color to RGB components.
 * Supports #RGB and #RRGGBB formats.
 * Returns black (0,0,0) for invalid input.
 */
export function parseHexToRgb(hex: string): RgbColor {
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

// ============================================================================
// HEX → HSL CONVERSION
// ============================================================================

/**
 * Converts hex color to HSL string in CSS variable format.
 * Output: "H S% L%" (e.g., "260 65% 11%")
 * 
 * Used for overriding --background CSS variable,
 * which uses space-separated HSL values without the hsl() wrapper.
 */
export function hexToHSL(hex: string): string {
  const { r: rRaw, g: gRaw, b: bRaw } = parseHexToRgb(hex);

  const r = rRaw / 255;
  const g = gRaw / 255;
  const b = bRaw / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// ============================================================================
// COLOR FACTORY (alpha-aware color string generator)
// ============================================================================

export interface ColorFactory {
  /** Fully opaque color string */
  solid: string;
  /** Color string with specified alpha */
  withAlpha: (alpha: number) => string;
}

/**
 * Creates a color factory based on gradient config.
 * Returns functions for solid color and color-with-alpha.
 * 
 * CRITICAL: Uses CSS-spec-compliant alpha syntax:
 * - Theme color: hsl(var(--background) / 0.5)
 * - Custom color: rgb(r g b / 0.5)
 */
export function createColorFactory(config: GradientOverlayConfig): ColorFactory {
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
