/**
 * Constants for Members Area Tab
 * Unified content type system
 */

import React from "react";
import { Layers, Video, FileText } from "lucide-react";
import type { ContentDisplayType } from "@/hooks/useMembersArea";

/** Content type configuration - unified system */
export const contentTypeConfig: Record<ContentDisplayType, {
  icon: React.ElementType;
  label: string;
  color: string;
}> = {
  mixed: { icon: Layers, label: 'Conteúdo', color: 'text-primary' },
  video: { icon: Video, label: 'Vídeo', color: 'text-red-500' },
  text: { icon: FileText, label: 'Texto', color: 'text-blue-500' },
};

export function getContentTypeIcon(type: string): React.ReactNode {
  const iconClass = "h-4 w-4";
  const config = contentTypeConfig[type as ContentDisplayType];
  
  if (config) {
    return React.createElement(config.icon, { className: iconClass });
  }
  
  // Fallback for unknown types
  return React.createElement(Layers, { className: iconClass });
}

export const contentTypeIcons: Record<string, React.ReactNode> = {
  mixed: React.createElement(Layers, { className: "h-4 w-4" }),
  video: React.createElement(Video, { className: "h-4 w-4" }),
  text: React.createElement(FileText, { className: "h-4 w-4" }),
};
