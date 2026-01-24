/**
 * AttachmentsList - Cakto-style list of downloadable attachments/materials
 */

import { Download, FileText, Image, Music, FileArchive, FileSpreadsheet, File } from "lucide-react";
import type { ContentAttachment } from "../types";

// Helper to get icon based on file type
function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return <Image className="h-5 w-5" />;
  if (fileType.startsWith("audio/")) return <Music className="h-5 w-5" />;
  if (fileType.includes("pdf")) return <FileText className="h-5 w-5" />;
  if (fileType.includes("zip") || fileType.includes("rar")) return <FileArchive className="h-5 w-5" />;
  if (fileType.includes("spreadsheet") || fileType.includes("excel")) return <FileSpreadsheet className="h-5 w-5" />;
  return <File className="h-5 w-5" />;
}

// Helper to format file size
function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentsListProps {
  attachments: ContentAttachment[];
}

export function AttachmentsList({ attachments }: AttachmentsListProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="space-y-1">
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.file_url}
          target="_blank"
          rel="noopener noreferrer"
          download={attachment.file_name}
          className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors group"
        >
          {/* File Icon - Cakto style with muted background */}
          <div className="flex-shrink-0 p-2.5 bg-muted rounded-lg text-muted-foreground group-hover:text-foreground transition-colors">
            {getFileIcon(attachment.file_type)}
          </div>
          
          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {attachment.file_name}
            </p>
            {attachment.file_size && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatFileSize(attachment.file_size)}
              </p>
            )}
          </div>
          
          {/* Download Icon - Shows on hover */}
          <Download className="h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      ))}
    </div>
  );
}
