/**
 * AttachmentsList - List of downloadable attachments/materials
 */

import { Download, FileText, Image, Music, FileArchive, FileSpreadsheet, Paperclip } from "lucide-react";
import type { ContentAttachment } from "../types";

// Helper to get icon based on file type
function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return <Image className="h-4 w-4" />;
  if (fileType.startsWith("audio/")) return <Music className="h-4 w-4" />;
  if (fileType.includes("pdf")) return <FileText className="h-4 w-4" />;
  if (fileType.includes("zip") || fileType.includes("rar")) return <FileArchive className="h-4 w-4" />;
  if (fileType.includes("spreadsheet") || fileType.includes("excel")) return <FileSpreadsheet className="h-4 w-4" />;
  return <Paperclip className="h-4 w-4" />;
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
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.file_url}
          target="_blank"
          rel="noopener noreferrer"
          download={attachment.file_name}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
        >
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            {getFileIcon(attachment.file_type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
              {attachment.file_name}
            </p>
            {attachment.file_size && (
              <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.file_size)}
              </p>
            )}
          </div>
          <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </a>
      ))}
    </div>
  );
}
