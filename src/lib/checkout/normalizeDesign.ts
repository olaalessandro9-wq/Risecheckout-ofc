/**
 * Normalize Design
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * SSOT: The `design.colors` JSON is the SINGLE SOURCE OF TRUTH.
 * NO fallback to individual columns (they are deprecated).
 * 
 * @module lib/checkout/normalizeDesign
 */

import { THEME_PRESETS, ThemePreset } from './themePresets';
import type { CheckoutColors } from '@/types/checkoutColors';

/**
 * Input accepted by normalizeDesign
 * SSOT: Only reads from `design` JSON, never from individual columns
 */
type DesignInputObject = {
  theme?: string;
  design?: {
    theme?: string;
    font?: string;
    colors?: Partial<CheckoutColors>;
    backgroundImage?: unknown;
  } | null;
};

/**
 * Normalizes checkout design by merging:
 * 1. Theme preset (light/dark) as base
 * 2. JSON saved in checkout.design.colors
 * 
 * RISE V3: ZERO fallback to individual columns.
 * All color data comes from design.colors JSON only.
 */
export function normalizeDesign(checkout: DesignInputObject): ThemePreset {
  // 1. Determine theme from design.theme or fallback to 'light'
  const designObj = checkout.design;
  const theme = designObj?.theme || checkout.theme || 'light';
  const resolvedTheme = (theme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  
  // 2. Get base preset
  const basePreset = THEME_PRESETS[resolvedTheme];
  
  // 3. Deep clone to avoid mutation
  const normalized: ThemePreset = JSON.parse(JSON.stringify(basePreset));
  
  // 4. Merge with design.colors if it exists
  const designColors = designObj?.colors;
  if (designColors && Object.keys(designColors).length > 0) {
    deepMerge(normalized.colors as unknown as Record<string, unknown>, designColors as Record<string, unknown>);
  }
  
  // 5. Ensure all derived properties exist (for checkouts without full color config)
  ensureDerivedProperties(normalized, resolvedTheme);
  
  return normalized;
}

/**
 * Ensures all derived color properties exist.
 * Uses base colors to derive missing nested objects.
 */
function ensureDerivedProperties(preset: ThemePreset, theme: 'light' | 'dark'): void {
  const colors = preset.colors;
  
  // Border
  if (!colors.border) {
    colors.border = theme === 'dark' ? '#374151' : '#E5E7EB';
  }
  
  // Placeholder
  if (!colors.placeholder) {
    colors.placeholder = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  }
  
  // Input Background
  if (!colors.inputBackground) {
    colors.inputBackground = colors.formBackground;
  }
  
  // Info Box
  if (!colors.infoBox) {
    colors.infoBox = {
      background: theme === 'dark' ? 'rgba(16,185,129,0.1)' : '#ECFDF5',
      border: theme === 'dark' ? 'rgba(16,185,129,0.3)' : '#A7F3D0',
      text: theme === 'dark' ? '#D1FAE5' : '#047857',
    };
  }
  
  // Order Bump
  if (!colors.orderBump) {
    colors.orderBump = {
      headerBackground: 'rgba(0,0,0,0.15)',
      headerText: colors.active,
      footerBackground: 'rgba(0,0,0,0.15)',
      footerText: theme === 'dark' ? '#FFFFFF' : '#000000',
      contentBackground: colors.formBackground,
      titleText: colors.primaryText,
      descriptionText: colors.secondaryText,
      priceText: colors.active,
      selectedHeaderBackground: colors.active,
      selectedHeaderText: '#FFFFFF',
      selectedFooterBackground: colors.active,
      selectedFooterText: '#FFFFFF',
    };
  }
  
  // Credit Card Fields
  if (!colors.creditCardFields) {
    colors.creditCardFields = {
      textColor: colors.primaryText,
      placeholderColor: colors.secondaryText,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground || colors.formBackground,
      focusBorderColor: colors.active,
      focusTextColor: colors.primaryText,
    };
  }
  
  // Order Summary
  if (!colors.orderSummary) {
    colors.orderSummary = {
      background: colors.formBackground,
      titleText: colors.primaryText,
      productName: colors.primaryText,
      priceText: colors.primaryText,
      labelText: colors.secondaryText,
      borderColor: colors.border,
    };
  }
  
  // Footer
  if (!colors.footer) {
    colors.footer = {
      background: colors.formBackground,
      primaryText: colors.primaryText,
      secondaryText: colors.secondaryText,
      border: colors.border,
    };
  }
  
  // Secure Purchase
  if (!colors.securePurchase) {
    colors.securePurchase = {
      headerBackground: colors.active,
      headerText: '#FFFFFF',
      cardBackground: colors.formBackground,
      primaryText: colors.primaryText,
      secondaryText: colors.secondaryText,
      linkText: '#3B82F6',
    };
  }
  
  // Personal Data Fields
  if (!colors.personalDataFields) {
    colors.personalDataFields = {
      textColor: colors.primaryText,
      placeholderColor: colors.secondaryText,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground || colors.formBackground,
      focusBorderColor: colors.active,
      focusTextColor: colors.primaryText,
    };
  }
  
  // Product Price
  if (!colors.productPrice) {
    colors.productPrice = colors.active;
  }
}

/**
 * Deep merge objects
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>): T {
  for (const key in source) {
    const sourceValue = source[key];
    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      if (!target[key]) (target as Record<string, unknown>)[key] = {};
      deepMerge(target[key] as Record<string, unknown>, sourceValue as Record<string, unknown>);
    } else if (sourceValue !== undefined) {
      (target as Record<string, unknown>)[key] = sourceValue;
    }
  }
  return target;
}
