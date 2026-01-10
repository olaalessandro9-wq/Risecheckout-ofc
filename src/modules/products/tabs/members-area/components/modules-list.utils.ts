/**
 * ModulesList Utilities
 * Shared constants and utility functions for the modules list components
 */

import { Video, FileText, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// =====================================================
// CONSTANTS
// =====================================================

/** Container ID for the modules sortable context */
export const MODULES_CONTAINER_ID = "modules";

/** Prefix for content container IDs (format: "contents:{moduleId}") */
export const CONTENTS_CONTAINER_PREFIX = "contents:";

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/** Get icon component for content type */
export function getContentIconComponent(type: string): LucideIcon {
  switch (type) {
    case 'video':
      return Video;
    case 'text':
      return FileText;
    case 'mixed':
    default:
      return Layers;
  }
}

/** Get label for content type */
export function getContentLabel(type: string): string {
  switch (type) {
    case 'video':
      return 'Vídeo';
    case 'text':
      return 'Texto';
    case 'mixed':
    default:
      return 'Conteúdo';
  }
}
