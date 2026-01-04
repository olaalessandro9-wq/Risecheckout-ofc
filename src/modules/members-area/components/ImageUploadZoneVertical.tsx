/**
 * ImageUploadZoneVertical - Área de upload vertical (2:3) para covers de módulo
 * Formato idêntico ao card final
 */

import { useCallback, useRef, useState } from "react";
import { Upload, Crop, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadZoneVerticalProps {
  imagePreview: string | null;
  onImageSelect: (file: File | null) => void;
  onCropClick?: () => void;
  maxSizeMB?: number;
}

export function ImageUploadZoneVertical({
  imagePreview,
  onImageSelect,
  onCropClick,
  maxSizeMB = 10,
}: ImageUploadZoneVerticalProps) {
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

  // With image - show vertical preview with action icons
  if (imagePreview) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div
          className="relative w-[200px] aspect-[2/3] rounded-lg overflow-hidden border border-border bg-muted cursor-pointer group"
          onClick={handleClick}
        >
          <img
            src={imagePreview}
            alt="Cover preview"
            className="w-full h-full object-cover"
          />
          
          {/* Action icons overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            {onCropClick && (
              <button
                type="button"
                onClick={handleCropClick}
                className="p-3 bg-background/90 rounded-lg hover:bg-background transition-colors"
                title="Recortar"
              >
                <Crop className="h-6 w-6 text-foreground" />
              </button>
            )}
            <button
              type="button"
              onClick={handleRemoveImage}
              className="p-3 bg-destructive/90 rounded-lg hover:bg-destructive transition-colors"
              title="Remover"
            >
              <Trash2 className="h-6 w-6 text-destructive-foreground" />
            </button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Formatos aceitos: JPG ou PNG. Tamanho máximo: {maxSizeMB}MB
        </p>

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

  // Without image - vertical drop zone
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          w-[200px] aspect-[2/3] rounded-lg border-2 border-dashed 
          flex flex-col items-center justify-center gap-4 cursor-pointer
          transition-colors
          ${
            isDragOver
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/30 hover:border-primary/50 bg-muted/50"
          }
        `}
      >
        <div className="p-4 rounded-full bg-muted">
          <Upload className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center px-4">
          <p className="text-base font-medium text-foreground">
            Arraste ou clique
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            JPG ou PNG
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Tamanho recomendado: 320×480 pixels
      </p>

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
