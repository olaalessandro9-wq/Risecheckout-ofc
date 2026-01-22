/**
 * MembersAreaThemeProvider
 * Injects custom CSS variables for the members area primary color
 * Allows all child components to use the customized primary color
 */

import React from 'react';
import type { MembersAreaBuilderSettings } from '@/modules/members-area-builder/types/builder.types';

interface MembersAreaThemeProviderProps {
  settings: MembersAreaBuilderSettings;
  children: React.ReactNode;
}

/**
 * Converts a hex color to HSL values for CSS variables
 */
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

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

/**
 * Determines if a color is light or dark for contrast calculation
 */
function isLightColor(hex: string): boolean {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function MembersAreaThemeProvider({ 
  settings, 
  children 
}: MembersAreaThemeProviderProps) {
  const primaryColor = settings.primary_color || '#6366f1';
  const primaryHSL = hexToHSL(primaryColor);
  const foregroundHSL = isLightColor(primaryColor) ? '240 10% 3.9%' : '0 0% 98%';

  const cssVars = {
    '--members-primary': primaryHSL,
    '--members-primary-hex': primaryColor,
    '--members-primary-foreground': foregroundHSL,
  } as React.CSSProperties;

  return (
    <div style={cssVars} className="members-area-root contents">
      {children}
    </div>
  );
}
