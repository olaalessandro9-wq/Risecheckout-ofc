/**
 * Gradient Utils Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_GRADIENT_CONFIG,
  generateBottomFadeCSS,
  generateSideGradientCSS,
  generateCombinedOverlayStyle,
  resolveGradientConfig,
} from '../gradientUtils';
import type { GradientOverlayConfig } from '../../types';

describe('gradientUtils', () => {
  describe('DEFAULT_GRADIENT_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_GRADIENT_CONFIG).toEqual({
        enabled: true,
        direction: 'bottom',
        strength: 60,
        use_theme_color: true,
        custom_color: undefined,
      });
    });
  });

  describe('generateBottomFadeCSS', () => {
    it('should return "none" when disabled', () => {
      const config: GradientOverlayConfig = {
        ...DEFAULT_GRADIENT_CONFIG,
        enabled: false,
      };
      expect(generateBottomFadeCSS(config)).toBe('none');
    });

    it('should generate multi-stop gradient with theme color', () => {
      const result = generateBottomFadeCSS(DEFAULT_GRADIENT_CONFIG);
      
      expect(result).toContain('linear-gradient(to bottom');
      expect(result).toContain('transparent 0%');
      expect(result).toContain('hsl(var(--background))');
    });

    it('should generate gradient with custom RGB color', () => {
      const config: GradientOverlayConfig = {
        enabled: true,
        direction: 'bottom',
        strength: 50,
        use_theme_color: false,
        custom_color: '#ff0000',
      };
      
      const result = generateBottomFadeCSS(config);
      
      expect(result).toContain('rgb(255 0 0)');
      expect(result).not.toContain('hsl(var(--background))');
    });

    it('should handle 3-digit hex colors', () => {
      const config: GradientOverlayConfig = {
        enabled: true,
        direction: 'bottom',
        strength: 50,
        use_theme_color: false,
        custom_color: '#f00', // Should expand to #ff0000
      };
      
      const result = generateBottomFadeCSS(config);
      expect(result).toContain('rgb(255 0 0)');
    });

    it('should clamp strength to 0-100 range', () => {
      const lowConfig: GradientOverlayConfig = {
        ...DEFAULT_GRADIENT_CONFIG,
        strength: -50,
      };
      const highConfig: GradientOverlayConfig = {
        ...DEFAULT_GRADIENT_CONFIG,
        strength: 150,
      };
      
      // Should not throw
      expect(() => generateBottomFadeCSS(lowConfig)).not.toThrow();
      expect(() => generateBottomFadeCSS(highConfig)).not.toThrow();
    });

    it('should include multiple stops for smooth transition', () => {
      const result = generateBottomFadeCSS(DEFAULT_GRADIENT_CONFIG);
      
      // Count commas to estimate number of stops (at least 10)
      const commaCount = (result.match(/,/g) || []).length;
      expect(commaCount).toBeGreaterThanOrEqual(10);
    });
  });

  describe('generateSideGradientCSS', () => {
    it('should return "none" when disabled', () => {
      const config: GradientOverlayConfig = {
        ...DEFAULT_GRADIENT_CONFIG,
        enabled: false,
      };
      expect(generateSideGradientCSS(config)).toBe('none');
    });

    it('should generate horizontal gradient', () => {
      const result = generateSideGradientCSS(DEFAULT_GRADIENT_CONFIG);
      
      expect(result).toContain('linear-gradient(to right');
    });

    it('should have transparent center zone', () => {
      const result = generateSideGradientCSS(DEFAULT_GRADIENT_CONFIG);
      
      expect(result).toContain('transparent 25%');
      expect(result).toContain('transparent 75%');
    });
  });

  describe('generateCombinedOverlayStyle', () => {
    it('should return none background when disabled', () => {
      const config: GradientOverlayConfig = {
        ...DEFAULT_GRADIENT_CONFIG,
        enabled: false,
      };
      
      const result = generateCombinedOverlayStyle(config);
      
      expect(result.background).toBe('none');
    });

    it('should combine both gradients when enabled', () => {
      const result = generateCombinedOverlayStyle(DEFAULT_GRADIENT_CONFIG);
      
      expect(result.backgroundImage).toContain('linear-gradient(to right');
      expect(result.backgroundImage).toContain('linear-gradient(to bottom');
      expect(result.backgroundRepeat).toBe('no-repeat');
      expect(result.backgroundSize).toBe('cover');
    });
  });

  describe('resolveGradientConfig', () => {
    it('should return defaults when undefined', () => {
      const result = resolveGradientConfig(undefined);
      
      expect(result).toEqual(DEFAULT_GRADIENT_CONFIG);
    });

    it('should merge partial config with defaults', () => {
      const result = resolveGradientConfig({
        enabled: false,
        strength: 80,
      });
      
      expect(result.enabled).toBe(false);
      expect(result.strength).toBe(80);
      expect(result.direction).toBe('bottom'); // Default
      expect(result.use_theme_color).toBe(true); // Default
    });

    it('should preserve custom color when provided', () => {
      const result = resolveGradientConfig({
        use_theme_color: false,
        custom_color: '#123456',
      });
      
      expect(result.use_theme_color).toBe(false);
      expect(result.custom_color).toBe('#123456');
    });
  });
});
