/**
 * AttachmentsSection - Multiple file attachments with drag and drop
 * Kiwify-style with up to 10 files support
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Paperclip,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  FileArchive,
  FileAudio,
  File,
} from "lucide-react";
import type { ContentAttachment } from "../../types";

interface AttachmentsSectionProps {
  attachments: ContentAttachment[];
  onAttachmentsChange: (attachments: ContentAttachment[]) => void;
  isLoading?: boolean;
}

const MAX_FILES = 10;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/webp",
  "application/pdf",
  "application/zip",
  "application/x-rar-compressed",
  "application/epub+zip",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "audio/mpeg",
  "audio/mp3",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-blue-500" />;
  if (fileType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
  if (fileType.includes("zip") || fileType.includes("rar")) return <FileArchive className="h-5 w-5 text-yellow-500" />;
  if (fileType.includes("audio")) return <FileAudio className="h-5 w-5 text-purple-500" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsSection({
  attachments,
  onAttachmentsChange,
  isLoading = false,
}: AttachmentsSectionProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [attachments]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    e.target.value = ""; // Reset input
  }, [attachments]);

  const handleFiles = (files: File[]) => {
    const remainingSlots = MAX_FILES - attachments.length;
    const filesToAdd = files.slice(0, remainingSlots);

    const newAttachments: ContentAttachment[] = filesToAdd
      .filter(file => {
        if (file.size > MAX_FILE_SIZE) {
          console.warn(`File ${file.name} exceeds max size`);
          return false;
        }
        return true;
      })
      .map((file, index) => ({
        id: `temp-${Date.now()}-${index}`,
        content_id: "",
        file_name: file.name,
        file_url: URL.createObjectURL(file),
        file_type: file.type,
        file_size: file.size,
        position: attachments.length + index,
        created_at: new Date().toISOString(),
      }));

    onAttachmentsChange([...attachments, ...newAttachments]);
  };

  const handleRemove = useCallback((id: string) => {
    onAttachmentsChange(attachments.filter(a => a.id !== id));
  }, [attachments, onAttachmentsChange]);

  const canAddMore = attachments.length < MAX_FILES;

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Anexos</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {attachments.length}/{MAX_FILES} arquivos
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        Você pode anexar até {MAX_FILES} arquivos (máx. 100MB cada)
      </p>

      {/* Drop Zone */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }
          `}
        >
          <Upload className={`h-10 w-10 mx-auto ${isDragging ? "text-primary" : "text-muted-foreground/50"}`} />
          <p className="mt-3 text-sm text-muted-foreground">
            Arraste arquivos aqui ou{" "}
            <label className="text-primary hover:underline cursor-pointer">
              selecione do computador
              <input
                type="file"
                multiple
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleFileSelect}
                className="sr-only"
                disabled={isLoading}
              />
            </label>
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            jpg, gif, png, pdf, zip, doc, xlsx, mp3, etc
          </p>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group"
            >
              {getFileIcon(attachment.file_type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.file_size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(attachment.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
