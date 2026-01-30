/**
 * Content Type Utils Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from 'vitest';
import { normalizeContentType } from '../content-type';

describe('normalizeContentType', () => {
  describe('valid types', () => {
    it('should return "mixed" for mixed type', () => {
      expect(normalizeContentType('mixed')).toBe('mixed');
    });

    it('should return "video" for video type', () => {
      expect(normalizeContentType('video')).toBe('video');
    });

    it('should return "text" for text type', () => {
      expect(normalizeContentType('text')).toBe('text');
    });
  });

  describe('deprecated types', () => {
    it('should normalize "pdf" to "mixed"', () => {
      expect(normalizeContentType('pdf')).toBe('mixed');
    });

    it('should normalize "download" to "mixed"', () => {
      expect(normalizeContentType('download')).toBe('mixed');
    });

    it('should normalize "link" to "mixed"', () => {
      expect(normalizeContentType('link')).toBe('mixed');
    });
  });

  describe('unknown types', () => {
    it('should normalize empty string to "mixed"', () => {
      expect(normalizeContentType('')).toBe('mixed');
    });

    it('should normalize unknown type to "mixed"', () => {
      expect(normalizeContentType('unknown_type')).toBe('mixed');
    });

    it('should normalize arbitrary strings to "mixed"', () => {
      expect(normalizeContentType('audio')).toBe('mixed');
      expect(normalizeContentType('image')).toBe('mixed');
      expect(normalizeContentType('document')).toBe('mixed');
    });
  });

  describe('case sensitivity', () => {
    it('should be case-sensitive for valid types', () => {
      // Only lowercase is valid
      expect(normalizeContentType('Video')).toBe('mixed');
      expect(normalizeContentType('VIDEO')).toBe('mixed');
      expect(normalizeContentType('Mixed')).toBe('mixed');
      expect(normalizeContentType('TEXT')).toBe('mixed');
    });
  });
});
