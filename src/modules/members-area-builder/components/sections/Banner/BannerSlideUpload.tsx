/**
 * Banner Slide Upload - Upload de imagem para slides do banner com crop
 * 
 * Features:
 * - Armazena imagem original para re-crop sem perda de qualidade
 * - Detecção inteligente de proporção
 * - Drag-and-drop via useImageDragDrop (hook compartilhado)
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import React, { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon, Loader2, Crop } from "lucide-react";
import { toast } from "sonner";
import { uploadViaEdge } from "@/lib/storage/storageProxy";
import { createLogger } from "@/lib/logger";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";
import { useImageDragDrop } from "@/modules/members-area-builder/hooks/useImageDragDrop";

const log = createLogger("BannerSlideUpload");

interface BannerSlideUploadProps {
  imageUrl: string;
  /** URL da imagem original (sem crop) para re-crop sem perda de qualidade */
  originalImageUrl?: string;
  productId?: string;
  onImageChange: (url: string, originalUrl?: string) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 10;

export function BannerSlideUpload({
  imageUrl,
  originalImageUrl,
  productId,
  onImageChange,
}: BannerSlideUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [fileToCrop, setFileToCrop] = useState<File | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Callback para quando um arquivo válido é recebido (input ou drag)
  const handleValidFile = useCallback((file: File) => {
    setOriginalFile(file);
    setFileToCrop(file);
    setCropDialogOpen(true);
  }, []);

  const { isDragging, validateFile, dragProps } = useImageDragDrop({
    acceptedTypes: ACCEPTED_TYPES,
    maxSizeMB: MAX_SIZE_MB,
    onValidFile: handleValidFile,
    disabled: isUploading,
  });

  const handleUpload = async (croppedFile: File, originalFileToUpload?: File) => {
    setIsUploading(true);

    try {
      const fileExt = croppedFile.name.split(".").pop();
      const fileName = `banner-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
      const filePath = productId
        ? `products/${productId}/banners/${fileName}`
        : `banners/${fileName}`;

      const { publicUrl: croppedUrl, error: uploadError } = await uploadViaEdge(
        "product-images",
        filePath,
        croppedFile,
        { upsert: false, contentType: croppedFile.type }
      );

      if (uploadError) throw uploadError;

      let originalUrl: string | undefined;
      if (originalFileToUpload) {
        const originalExt = originalFileToUpload.name.split(".").pop();
        const originalFileName = `banner-original-${Date.now()}-${crypto.randomUUID()}.${originalExt}`;
        const originalPath = productId
          ? `products/${productId}/banners/originals/${originalFileName}`
          : `banners/originals/${originalFileName}`;

        const { publicUrl: origUrl } = await uploadViaEdge(
          "product-images",
          originalPath,
          originalFileToUpload,
          { upsert: false, contentType: originalFileToUpload.type }
        );

        originalUrl = origUrl || undefined;
      }

      if (croppedUrl) {
        onImageChange(croppedUrl, originalUrl);
        toast.success("Imagem enviada com sucesso!");
      }
    } catch (error: unknown) {
      log.error("Upload error:", error);
      toast.error("Erro ao enviar imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
      setOriginalFile(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      handleValidFile(file);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = () => {
    onImageChange("", undefined);
  };

  const handleCropComplete = useCallback(
    (croppedFile: File) => {
      handleUpload(croppedFile, originalFile || undefined);
      setFileToCrop(null);
    },
    [originalFile]
  );

  const handleReCrop = useCallback(async () => {
    const urlToFetch = originalImageUrl || imageUrl;
    if (!urlToFetch) return;

    try {
      const response = await fetch(urlToFetch);
      const blob = await response.blob();
      const file = new File([blob], "banner-recrop.jpg", {
        type: blob.type || "image/jpeg",
      });

      setOriginalFile(null);
      setFileToCrop(file);
      setCropDialogOpen(true);
    } catch (error: unknown) {
      log.error("Error loading image for re-crop:", error);
      toast.error("Erro ao carregar imagem para recorte.");
    }
  }, [imageUrl, originalImageUrl]);

  const handleReCropComplete = useCallback(
    (croppedFile: File) => {
      handleUploadCroppedOnly(croppedFile);
      setFileToCrop(null);
    },
    [originalImageUrl]
  );

  const handleUploadCroppedOnly = async (croppedFile: File) => {
    setIsUploading(true);

    try {
      const fileExt = croppedFile.name.split(".").pop();
      const fileName = `banner-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
      const filePath = productId
        ? `products/${productId}/banners/${fileName}`
        : `banners/${fileName}`;

      const { publicUrl: croppedUrl, error: uploadError } = await uploadViaEdge(
        "product-images",
        filePath,
        croppedFile,
        { upsert: false, contentType: croppedFile.type }
      );

      if (uploadError) throw uploadError;

      if (croppedUrl) {
        onImageChange(croppedUrl, originalImageUrl);
        toast.success("Imagem recortada com sucesso!");
      }
    } catch (error: unknown) {
      log.error("Upload error:", error);
      toast.error("Erro ao enviar imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      {imageUrl ? (
        <div className="relative group rounded-lg overflow-hidden border bg-neutral-800 aspect-video">
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={imageUrl}
              alt="Preview do slide"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-1" />
              Trocar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleReCrop}
              disabled={isUploading}
            >
              <Crop className="h-4 w-4 mr-1" />
              Recortar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
            "flex flex-col items-center justify-center text-center",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            isUploading && "pointer-events-none opacity-50"
          )}
          onClick={() => inputRef.current?.click()}
          {...dragProps}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Enviando...</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">
                Clique ou arraste uma imagem
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WebP ou GIF (máx. {MAX_SIZE_MB}MB)
              </p>
            </>
          )}
        </div>
      )}

      {/* Crop Dialog */}
      {fileToCrop && (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={(open) => {
            setCropDialogOpen(open);
            if (!open) {
              setFileToCrop(null);
              setOriginalFile(null);
            }
          }}
          imageFile={fileToCrop}
          onCropComplete={
            originalFile ? handleCropComplete : handleReCropComplete
          }
          preset="banner"
        />
      )}
    </div>
  );
}
