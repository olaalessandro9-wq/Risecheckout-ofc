/**
 * ImageUploadZone - Área de upload com drag & drop e ícones de ação
 */

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Upload, Crop, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadZoneProps {
  imagePreview: string | null;
  onImageSelect: (file: File | null) => void;
  onCropClick?: () => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  recommendedSize?: string;
  className?: string;
}

export function ImageUploadZone({
  imagePreview,
  onImageSelect,
  onCropClick,
  maxSizeMB = 10,
  acceptedFormats = ["image/png", "image/jpeg", "image/jpg"],
  recommendedSize = "320x480 px",
  className,
}: ImageUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      if (!acceptedFormats.includes(file.type)) {
        alert("Formato não suportado. Use PNG ou JPG.");
        return false;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`Arquivo muito grande. Máximo ${maxSizeMB}MB.`);
        return false;
      }
      return true;
    },
    [acceptedFormats, maxSizeMB]
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
    [onImageSelect, validateFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        onImageSelect(file);
      }
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [onImageSelect, validateFile]
  );

  const handleRemoveImage = useCallback(() => {
    onImageSelect(null);
  }, [onImageSelect]);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  // Hidden file input
  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={acceptedFormats.join(",")}
      onChange={handleFileSelect}
      className="hidden"
    />
  );

  // With image - show preview with action icons
  if (imagePreview) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="relative group rounded-lg overflow-hidden border border-border bg-muted/30">
          <div className="flex items-center justify-center p-4">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-40 max-w-full object-contain rounded"
            />
          </div>
          
          {/* Action buttons overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            {onCropClick && (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full"
                onClick={onCropClick}
              >
                <Crop className="h-5 w-5" />
              </Button>
            )}
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-10 w-10 rounded-full"
              onClick={handleRemoveImage}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          Passe o mouse para editar
        </p>
        
        {fileInput}
      </div>
    );
  }

  // Without image - show upload zone
  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
        
        <div className="text-center">
          <p className="text-sm font-medium">
            Selecione do computador
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ou arraste aqui
          </p>
        </div>
        
        <p className="text-xs text-muted-foreground">
          PNG, JPG até {maxSizeMB} MB
        </p>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ImageIcon className="h-3 w-3" />
        <span>Tamanho recomendado: {recommendedSize}</span>
      </div>
      
      {fileInput}
    </div>
  );
}
