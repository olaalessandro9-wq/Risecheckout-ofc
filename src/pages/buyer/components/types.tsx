/**
 * Buyer Product Content - Types and Constants
 */

import React from "react";
import { 
  Play, 
  FileText, 
  Link as LinkIcon, 
  Download, 
  Layers 
} from "lucide-react";

/** 
 * Buyer page uses extended content types for legacy support
 * The unified system (mixed/video/text) handles normalization upstream
 */
export type BuyerContentDisplayType = "mixed" | "video" | "text" | "pdf" | "link" | "download";

export interface ContentAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  content_type: BuyerContentDisplayType;
  content_url: string | null;
  body: string | null;
  content_data: Record<string, unknown>;
  position: number;
  attachments?: ContentAttachment[];
}

export interface Module {
  id: string;
  title: string;
  description: string | null;
  position: number;
  contents: ContentItem[];
}

export interface ProductData {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  settings: Record<string, unknown>;
}

export const contentTypeIcons: Record<string, React.ReactNode> = {
  mixed: <Layers className="h-4 w-4" />,
  video: <Play className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  link: <LinkIcon className="h-4 w-4" />,
  download: <Download className="h-4 w-4" />,
};

export const contentTypeLabels: Record<string, string> = {
  mixed: "Conteúdo",
  video: "Vídeo",
  text: "Texto",
  pdf: "PDF",
  link: "Link",
  download: "Download",
};
