/**
 * ModulesList Utilities - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for utility functions and constants used in modules list.
 * 
 * @module products/tabs/members-area/components/__tests__/modules-list.utils.test
 */

import { describe, it, expect } from 'vitest';
import {
  MODULES_CONTAINER_ID,
  CONTENTS_CONTAINER_PREFIX,
  getContentIconComponent,
  getContentLabel,
} from '../modules-list.utils';
import { Video, FileText, Layers } from 'lucide-react';

describe('ModulesList Utilities', () => {
  describe('Constants', () => {
    it('should have correct MODULES_CONTAINER_ID', () => {
      expect(MODULES_CONTAINER_ID).toBe('modules');
    });

    it('should have correct CONTENTS_CONTAINER_PREFIX', () => {
      expect(CONTENTS_CONTAINER_PREFIX).toBe('contents:');
    });
  });

  describe('getContentIconComponent', () => {
    it('should return Video icon for video type', () => {
      expect(getContentIconComponent('video')).toBe(Video);
    });

    it('should return FileText icon for text type', () => {
      expect(getContentIconComponent('text')).toBe(FileText);
    });

    it('should return Layers icon for mixed type', () => {
      expect(getContentIconComponent('mixed')).toBe(Layers);
    });

    it('should return Layers icon for unknown type', () => {
      expect(getContentIconComponent('unknown')).toBe(Layers);
    });

    it('should return Layers icon for empty string', () => {
      expect(getContentIconComponent('')).toBe(Layers);
    });
  });

  describe('getContentLabel', () => {
    it('should return correct label for video type', () => {
      expect(getContentLabel('video')).toBe('Vídeo');
    });

    it('should return correct label for text type', () => {
      expect(getContentLabel('text')).toBe('Texto');
    });

    it('should return correct label for mixed type', () => {
      expect(getContentLabel('mixed')).toBe('Conteúdo');
    });

    it('should return default label for unknown type', () => {
      expect(getContentLabel('unknown')).toBe('Conteúdo');
    });

    it('should return default label for empty string', () => {
      expect(getContentLabel('')).toBe('Conteúdo');
    });
  });

  describe('Type Coverage', () => {
    it('should handle all standard content types', () => {
      const types = ['video', 'text', 'mixed'];
      
      types.forEach((type) => {
        expect(getContentIconComponent(type)).toBeDefined();
        expect(getContentLabel(type)).toBeDefined();
      });
    });
  });
});
