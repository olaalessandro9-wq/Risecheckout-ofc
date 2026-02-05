/**
 * ImageUploadZoneCompact - Área de upload compacta e responsiva para módulos
 * Design profissional com textos claros
 */

import { useCallback, useRef, useState } from "react";
import { Upload, Crop, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadZoneCompactProps {
  imagePreview: string | null;
  onImageSelect: (file: File | null) => void;
  onCropClick?: () => void;
  maxSizeMB?: number;
}

export function ImageUploadZoneCompact({
  imagePreview,
  onImageSelect,
  onCropClick,
  maxSizeMB = 10,
}: ImageUploadZoneCompactProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Formato inválido. Use JPG, PNG ou WebP.");
        return false;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
        return false;
      }
      return true;
    },
    [maxSizeMB]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        onImageSelect(file);
      }
    },
    [validateFile, onImageSelect]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        onImageSelect(file);
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [validateFile, onImageSelect]
  );

  const handleRemoveImage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onImageSelect(null);
    },
    [onImageSelect]
  );

  const handleCropClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onCropClick?.();
    },
    [onCropClick]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  // With image - show preview with action buttons
  if (imagePreview) {
    return (
      <div className="w-full">
        <div
          className="relative w-full max-w-[200px] aspect-[2/3] rounded-lg overflow-hidden border border-border bg-muted cursor-pointer group"
          onClick={handleClick}
        >
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
            <img
              src={imagePreview}
              alt="Cover preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          {/* Action icons overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            {onCropClick && (
              <button
                type="button"
                onClick={handleCropClick}
                className="p-2 bg-background/90 rounded-lg hover:bg-background transition-colors"
                title="Recortar"
              >
                <Crop className="h-5 w-5 text-foreground" />
              </button>
            )}
            <button
              type="button"
              onClick={handleRemoveImage}
              className="p-2 bg-destructive/90 rounded-lg hover:bg-destructive transition-colors"
              title="Remover"
            >
              <Trash2 className="h-5 w-5 text-destructive-foreground" />
            </button>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  // Without image - compact drop zone
  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          w-full min-h-[140px] rounded-lg border-2 border-dashed 
          flex flex-col items-center justify-center gap-3 cursor-pointer
          transition-colors py-6 px-4
          ${
            isDragOver
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/30 hover:border-primary/50 bg-muted/30"
          }
        `}
      >
        <div className="p-3 rounded-full bg-muted">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Arraste ou selecione o arquivo
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Solte os arquivos aqui ou clique para buscar em seu computador
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
