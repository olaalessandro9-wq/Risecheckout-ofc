/**
 * Constants for Members Area Tab
 */

import React from "react";
import { Play, FileText, Link as LinkIcon, Download, FileType } from "lucide-react";
import type { ContentTypeOption } from "./types";

export const contentTypeOptions: ContentTypeOption[] = [
  { value: "video", label: "Vídeo", icon: Play },
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "link", label: "Link Externo", icon: LinkIcon },
  { value: "text", label: "Texto/HTML", icon: FileType },
  { value: "download", label: "Download", icon: Download },
];

export function getContentTypeIcon(type: string): React.ReactNode {
  const iconClass = "h-4 w-4";
  switch (type) {
    case "video": return React.createElement(Play, { className: iconClass });
    case "pdf": return React.createElement(FileText, { className: iconClass });
    case "link": return React.createElement(LinkIcon, { className: iconClass });
    case "text": return React.createElement(FileType, { className: iconClass });
    case "download": return React.createElement(Download, { className: iconClass });
    default: return React.createElement(FileText, { className: iconClass });
  }
}

export const contentTypeIcons: Record<string, React.ReactNode> = {
  video: React.createElement(Play, { className: "h-4 w-4" }),
  pdf: React.createElement(FileText, { className: "h-4 w-4" }),
  link: React.createElement(LinkIcon, { className: "h-4 w-4" }),
  text: React.createElement(FileType, { className: "h-4 w-4" }),
  download: React.createElement(Download, { className: "h-4 w-4" }),
};
