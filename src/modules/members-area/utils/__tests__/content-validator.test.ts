/**
 * Content Validator Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from 'vitest';
import {
  validateVideoUrl,
  validatePdfUrl,
  validateDownloadUrl,
} from '../content-validator';

describe('validateVideoUrl', () => {
  describe('invalid inputs', () => {
    it('should reject empty string', () => {
      const result = validateVideoUrl('');
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe('unknown');
      expect(result.error).toBe('URL inválida');
    });

    it('should reject null/undefined', () => {
      const result = validateVideoUrl(null as unknown as string);
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid URLs', () => {
      const result = validateVideoUrl('not-a-url');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL inválida');
    });
  });

  describe('YouTube URLs', () => {
    it('should validate youtube.com/watch URLs', () => {
      const result = validateVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('youtube');
      expect(result.normalizedUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(result.thumbnailUrl).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
    });

    it('should validate youtu.be short URLs', () => {
      const result = validateVideoUrl('https://youtu.be/dQw4w9WgXcQ');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('youtube');
    });

    it('should validate youtube.com/embed URLs', () => {
      const result = validateVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('youtube');
    });

    it('should validate youtube.com/shorts URLs', () => {
      const result = validateVideoUrl('https://youtube.com/shorts/dQw4w9WgXcQ');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('youtube');
    });
  });

  describe('Vimeo URLs', () => {
    it('should validate vimeo.com URLs', () => {
      const result = validateVideoUrl('https://vimeo.com/123456789');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('vimeo');
      expect(result.normalizedUrl).toBe('https://vimeo.com/123456789');
      expect(result.embedUrl).toBe('https://player.vimeo.com/video/123456789');
      expect(result.thumbnailUrl).toBeNull(); // Requires API
    });

    it('should validate vimeo.com/video URLs', () => {
      const result = validateVideoUrl('https://vimeo.com/video/123456789');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('vimeo');
    });

    it('should validate player.vimeo.com URLs', () => {
      const result = validateVideoUrl('https://player.vimeo.com/video/123456789');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('vimeo');
    });
  });

  describe('Wistia URLs', () => {
    it('should validate wistia.com URLs', () => {
      const result = validateVideoUrl('https://company.wistia.com/medias/abc123');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('wistia');
    });

    it('should validate wistia.net URLs', () => {
      const result = validateVideoUrl('https://fast.wistia.net/embed/abc123');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('wistia');
    });
  });

  describe('Bunny CDN URLs', () => {
    it('should validate bunnycdn URLs', () => {
      const result = validateVideoUrl('https://video.bunnycdn.com/play/12345/video.mp4');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('bunny');
    });

    it('should validate b-cdn.net URLs', () => {
      const result = validateVideoUrl('https://myzone.b-cdn.net/video.mp4');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('bunny');
    });
  });

  describe('direct video files', () => {
    it('should validate .mp4 files', () => {
      const result = validateVideoUrl('https://example.com/video.mp4');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('direct');
    });

    it('should validate .webm files', () => {
      const result = validateVideoUrl('https://example.com/video.webm');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('direct');
    });

    it('should validate .ogg files', () => {
      const result = validateVideoUrl('https://example.com/video.ogg');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('direct');
    });

    it('should validate .mov files', () => {
      const result = validateVideoUrl('https://example.com/video.mov');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('direct');
    });
  });

  describe('unknown but valid URLs', () => {
    it('should accept valid URLs with unknown platform', () => {
      const result = validateVideoUrl('https://customplatform.com/video/123');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('unknown');
      expect(result.normalizedUrl).toBe('https://customplatform.com/video/123');
    });
  });

  describe('whitespace handling', () => {
    it('should trim URLs before validation', () => {
      const result = validateVideoUrl('  https://youtube.com/watch?v=dQw4w9WgXcQ  ');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('youtube');
    });
  });
});

describe('validatePdfUrl', () => {
  it('should reject empty string', () => {
    const result = validatePdfUrl('');
    expect(result.isValid).toBe(false);
  });

  it('should reject invalid URLs', () => {
    const result = validatePdfUrl('not-a-url');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('URL inválida');
  });

  it('should accept .pdf URLs', () => {
    const result = validatePdfUrl('https://example.com/document.pdf');
    expect(result.isValid).toBe(true);
  });

  it('should accept URLs containing "pdf"', () => {
    const result = validatePdfUrl('https://example.com/pdf/document');
    expect(result.isValid).toBe(true);
  });

  it('should accept Google Drive URLs', () => {
    const result = validatePdfUrl('https://drive.google.com/file/d/123/view');
    expect(result.isValid).toBe(true);
  });

  it('should accept Dropbox URLs', () => {
    const result = validatePdfUrl('https://www.dropbox.com/s/abc/document.pdf');
    expect(result.isValid).toBe(true);
  });

  it('should accept generic valid URLs', () => {
    const result = validatePdfUrl('https://example.com/files/document');
    expect(result.isValid).toBe(true);
  });
});

describe('validateDownloadUrl', () => {
  it('should reject empty string', () => {
    const result = validateDownloadUrl('');
    expect(result.isValid).toBe(false);
  });

  it('should reject invalid URLs', () => {
    const result = validateDownloadUrl('not-a-url');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('URL inválida');
  });

  it('should accept any valid URL', () => {
    const result = validateDownloadUrl('https://example.com/file.zip');
    expect(result.isValid).toBe(true);
  });

  it('should trim URLs before validation', () => {
    const result = validateDownloadUrl('  https://example.com/file.zip  ');
    expect(result.isValid).toBe(true);
  });
});
