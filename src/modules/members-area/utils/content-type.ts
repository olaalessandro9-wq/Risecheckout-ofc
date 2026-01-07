/**
 * Content Type Utilities
 * Centralized normalization for unified content type system
 */

import type { ContentDisplayType } from '../types/module.types';

/**
 * Normalize legacy content types to unified system
 * - "mixed" = Kiwify-style (video + body + attachments)
 * - "video" = video only
 * - "text" = text/html only
 * All other types map to "mixed" for flexibility
 */
export function normalizeContentType(type: string): ContentDisplayType {
  switch (type) {
    case 'mixed':
    case 'video':
    case 'text':
      return type;
    case 'pdf':
    case 'download':
    case 'link':
      // Legacy types become mixed for flexible display
      return 'mixed';
    default:
      return 'mixed';
  }
}
