/**
 * MembersArea Constants - Unit Tests
 * 
 * RISE ARCHITECT A – V3 - 10.0/10
 * 
 * Tests for content type configuration and icon utilities.
 * 
 * @module products/tabs/members-area/__tests__/constants.test
 */

import { describe, it, expect } from 'vitest';
import { contentTypeConfig, getContentTypeIcon, contentTypeIcons } from '../constants';
import { Layers, Video, FileText } from 'lucide-react';

describe('MembersArea Constants', () => {
  describe('contentTypeConfig', () => {
    it('should have configuration for mixed type', () => {
      expect(contentTypeConfig.mixed).toBeDefined();
      expect(contentTypeConfig.mixed.icon).toBe(Layers);
      expect(contentTypeConfig.mixed.label).toBe('Conteúdo');
      expect(contentTypeConfig.mixed.color).toBe('text-primary');
    });

    it('should have configuration for video type', () => {
      expect(contentTypeConfig.video).toBeDefined();
      expect(contentTypeConfig.video.icon).toBe(Video);
      expect(contentTypeConfig.video.label).toBe('Vídeo');
      expect(contentTypeConfig.video.color).toBe('text-red-500');
    });

    it('should have configuration for text type', () => {
      expect(contentTypeConfig.text).toBeDefined();
      expect(contentTypeConfig.text.icon).toBe(FileText);
      expect(contentTypeConfig.text.label).toBe('Texto');
      expect(contentTypeConfig.text.color).toBe('text-blue-500');
    });

    it('should have all required properties for each type', () => {
      Object.values(contentTypeConfig).forEach((config) => {
        expect(config).toHaveProperty('icon');
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('color');
      });
    });
  });

  describe('getContentTypeIcon', () => {
    it('should return icon for mixed type', () => {
      const icon = getContentTypeIcon('mixed');
      expect(icon).toBeDefined();
    });

    it('should return icon for video type', () => {
      const icon = getContentTypeIcon('video');
      expect(icon).toBeDefined();
    });

    it('should return icon for text type', () => {
      const icon = getContentTypeIcon('text');
      expect(icon).toBeDefined();
    });

    it('should return fallback icon for unknown type', () => {
      const icon = getContentTypeIcon('unknown');
      expect(icon).toBeDefined();
    });

    it('should return fallback icon for empty string', () => {
      const icon = getContentTypeIcon('');
      expect(icon).toBeDefined();
    });
  });

  describe('contentTypeIcons', () => {
    it('should have icon for mixed type', () => {
      expect(contentTypeIcons.mixed).toBeDefined();
    });

    it('should have icon for video type', () => {
      expect(contentTypeIcons.video).toBeDefined();
    });

    it('should have icon for text type', () => {
      expect(contentTypeIcons.text).toBeDefined();
    });

    it('should have all types from contentTypeConfig', () => {
      const configTypes = Object.keys(contentTypeConfig);
      const iconTypes = Object.keys(contentTypeIcons);
      
      configTypes.forEach((type) => {
        expect(iconTypes).toContain(type);
      });
    });
  });
});
