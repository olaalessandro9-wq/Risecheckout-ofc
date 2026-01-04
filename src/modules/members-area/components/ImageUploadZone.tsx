/**
 * ImageUploadZone - Área de upload de imagem com drag & drop
 */

import { useCallback, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageUploadZoneProps {
  imagePreview: string | null;
  onImageSelect: (file: File | null) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  recommendedSize?: string;
  className?: string;
}

export function ImageUploadZone({
  imagePreview,
  onImageSelect,
  maxSizeMB = 10,
  acceptedFormats = ["image/png", "image/jpeg", "image/jpg", "image/webp"],
  recommendedSize = "320x480 px",
  className,
}: ImageUploadZoneProps) {
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
    
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      onImageSelect(file);
    }
  }, [onImageSelect, maxSizeMB, acceptedFormats]);

  const validateFile = (file: File): boolean => {
    if (!acceptedFormats.includes(file.type)) {
      alert("Formato não suportado. Use PNG, JPG ou WebP.");
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Arquivo muito grande. Máximo ${maxSizeMB}MB.`);
      return false;
    }
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onImageSelect(file);
    }
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    onImageSelect(null);
  };

  if (imagePreview) {
    return (
      <div className={cn("relative group", className)}>
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-border bg-muted">
          <img
            src={imagePreview}
            alt="Preview"
            className="h-full w-full object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 p-6",
          "border-2 border-dashed rounded-lg cursor-pointer",
          "transition-colors duration-200",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-full",
          "bg-muted text-muted-foreground"
        )}>
          <Upload className="h-5 w-5" />
        </div>
        
        <div className="text-center space-y-1">
          <p className="text-sm font-medium">
            <span className="text-primary">Selecione do computador</span>
          </p>
          <p className="text-xs text-muted-foreground">
            ou arraste aqui
          </p>
        </div>
        
        <p className="text-xs text-muted-foreground">
          PNG, JPG até {maxSizeMB}MB
        </p>
        
        <input
          type="file"
          accept={acceptedFormats.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />
      </label>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ImageIcon className="h-3 w-3" />
        <span>Tamanho recomendado: {recommendedSize}</span>
      </div>
    </div>
  );
}
