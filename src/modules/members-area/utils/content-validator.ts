/**
 * Content URL Validator
 * Validates and normalizes content URLs for different platforms
 */

/** Supported video platforms */
export type VideoPlatform = 'youtube' | 'vimeo' | 'wistia' | 'bunny' | 'direct' | 'unknown';

interface ValidationResult {
  isValid: boolean;
  platform: VideoPlatform;
  normalizedUrl: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  error?: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extract Vimeo video ID from URL
 */
function extractVimeoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/video\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Validate and normalize a video URL
 */
export function validateVideoUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      platform: 'unknown',
      normalizedUrl: null,
      embedUrl: null,
      thumbnailUrl: null,
      error: 'URL inválida',
    };
  }

  const trimmedUrl = url.trim();

  // YouTube
  const youtubeId = extractYouTubeId(trimmedUrl);
  if (youtubeId) {
    return {
      isValid: true,
      platform: 'youtube',
      normalizedUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
    };
  }

  // Vimeo
  const vimeoId = extractVimeoId(trimmedUrl);
  if (vimeoId) {
    return {
      isValid: true,
      platform: 'vimeo',
      normalizedUrl: `https://vimeo.com/${vimeoId}`,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      thumbnailUrl: null, // Vimeo requires API call for thumbnail
    };
  }

  // Wistia
  if (trimmedUrl.includes('wistia.com') || trimmedUrl.includes('wistia.net')) {
    return {
      isValid: true,
      platform: 'wistia',
      normalizedUrl: trimmedUrl,
      embedUrl: trimmedUrl,
      thumbnailUrl: null,
    };
  }

  // Bunny CDN
  if (trimmedUrl.includes('bunnycdn') || trimmedUrl.includes('b-cdn.net')) {
    return {
      isValid: true,
      platform: 'bunny',
      normalizedUrl: trimmedUrl,
      embedUrl: trimmedUrl,
      thumbnailUrl: null,
    };
  }

  // Direct video files
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  const hasVideoExtension = videoExtensions.some(ext => 
    trimmedUrl.toLowerCase().endsWith(ext)
  );

  if (hasVideoExtension) {
    return {
      isValid: true,
      platform: 'direct',
      normalizedUrl: trimmedUrl,
      embedUrl: trimmedUrl,
      thumbnailUrl: null,
    };
  }

  // Unknown but might be valid
  try {
    new URL(trimmedUrl);
    return {
      isValid: true,
      platform: 'unknown',
      normalizedUrl: trimmedUrl,
      embedUrl: trimmedUrl,
      thumbnailUrl: null,
    };
  } catch {
    return {
      isValid: false,
      platform: 'unknown',
      normalizedUrl: null,
      embedUrl: null,
      thumbnailUrl: null,
      error: 'URL inválida',
    };
  }
}

/**
 * Validate a PDF URL
 */
export function validatePdfUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL inválida' };
  }

  const trimmedUrl = url.trim();

  try {
    new URL(trimmedUrl);
    
    // Check for PDF extension or common PDF hosts
    const isPdf = trimmedUrl.toLowerCase().endsWith('.pdf') ||
      trimmedUrl.includes('pdf') ||
      trimmedUrl.includes('drive.google.com') ||
      trimmedUrl.includes('dropbox.com');

    if (!isPdf) {
      return { isValid: true }; // Allow but warn
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: 'URL inválida' };
  }
}

/**
 * Validate a download URL
 */
export function validateDownloadUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL inválida' };
  }

  try {
    new URL(url.trim());
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'URL inválida' };
  }
}
