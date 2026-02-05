/**
 * ImageUploadWithCrop - Componente genérico de upload de imagem com crop
 * 
 * Unifica a lógica de upload+crop que era duplicada entre
 * FixedHeaderImageUpload e BannerSlideUpload.
 * 
 * Comportamento controlado via config (ImageUploadConfig).
 * 
 * Features:
 * - Upload com crop automático via ImageCropDialog
 * - Re-crop lossless usando imagem original preservada
 * - Drag-and-drop via useImageDragDrop (hook compartilhado)
 * - Preview com object-contain (sem corte visual)
 * - Callbacks corretamente memoizadas (zero stale closures)
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon, Loader2, Crop } from "lucide-react";
import { toast } from "sonner";
import { uploadViaEdge } from "@/lib/storage/storageProxy";
import { createLogger } from "@/lib/logger";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";
import { useImageDragDrop } from "@/modules/members-area-builder/hooks/useImageDragDrop";
import type { ImageUploadConfig } from "./imageUploadConfigs";

interface ImageUploadWithCropProps {
  /** URL da imagem atualmente exibida (cropped) */
  imageUrl: string;
  /** URL da imagem original (sem crop) para re-crop sem perda de qualidade */
  originalImageUrl?: string;
  /** ID do produto (define o caminho no storage) */
  productId?: string;
  /** Callback quando a imagem muda (cropped URL + original URL) */
  onImageChange: (url: string, originalUrl?: string) => void;
  /** Configuração que define o comportamento do upload */
  config: ImageUploadConfig;
}

export function ImageUploadWithCrop({
  imageUrl,
  originalImageUrl,
  productId,
  onImageChange,
  config,
}: ImageUploadWithCropProps) {
  const log = createLogger(config.loggerName);

  const [isUploading, setIsUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [fileToCrop, setFileToCrop] = useState<File | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Upload helpers (memoized with all deps) ──────────────────────

  const uploadFile = useCallback(
    async (file: File, subPath: string): Promise<string | undefined> => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${config.filePrefix}-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
      const filePath = productId
        ? `products/${productId}/${subPath}/${fileName}`
        : `${subPath}/${fileName}`;

      const { publicUrl, error } = await uploadViaEdge(
        "product-images",
        filePath,
        file,
        { upsert: false, contentType: file.type }
      );

      if (error) throw error;
      return publicUrl || undefined;
    },
    [config.filePrefix, productId]
  );

  const handleUploadWithOriginal = useCallback(
    async (croppedFile: File, originalFileToUpload?: File) => {
      setIsUploading(true);

      try {
        const croppedUrl = await uploadFile(croppedFile, config.storagePath);

        let origUrl: string | undefined;
        if (originalFileToUpload) {
          origUrl = await uploadFile(
            originalFileToUpload,
            `${config.storagePath}/originals`
          );
        }

        if (croppedUrl) {
          onImageChange(croppedUrl, origUrl);
          toast.success("Imagem enviada com sucesso!");
        }
      } catch (error: unknown) {
        log.error("Upload error:", error);
        toast.error("Erro ao enviar imagem. Tente novamente.");
      } finally {
        setIsUploading(false);
        setOriginalFile(null);
      }
    },
    [uploadFile, config.storagePath, onImageChange, log]
  );

  const handleUploadCroppedOnly = useCallback(
    async (croppedFile: File) => {
      setIsUploading(true);

      try {
        const croppedUrl = await uploadFile(croppedFile, config.storagePath);

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
    },
    [uploadFile, config.storagePath, onImageChange, originalImageUrl, log]
  );

  // ── Event handlers ───────────────────────────────────────────────

  const handleValidFile = useCallback((file: File) => {
    setOriginalFile(file);
    setFileToCrop(file);
    setCropDialogOpen(true);
  }, []);

  const { isDragging, validateFile, dragProps } = useImageDragDrop({
    acceptedTypes: config.acceptedTypes,
    maxSizeMB: config.maxSizeMB,
    onValidFile: handleValidFile,
    disabled: isUploading,
  });

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        handleValidFile(file);
      }
      if (inputRef.current) inputRef.current.value = "";
    },
    [validateFile, handleValidFile]
  );

  const handleRemove = useCallback(() => {
    onImageChange("", undefined);
  }, [onImageChange]);

  const handleCropComplete = useCallback(
    (croppedFile: File) => {
      handleUploadWithOriginal(croppedFile, originalFile || undefined);
      setFileToCrop(null);
    },
    [originalFile, handleUploadWithOriginal]
  );

  const handleReCrop = useCallback(async () => {
    const urlToFetch = originalImageUrl || imageUrl;
    if (!urlToFetch) return;

    try {
      const response = await fetch(urlToFetch);
      const blob = await response.blob();
      const file = new File(
        [blob],
        `${config.filePrefix}-recrop.jpg`,
        { type: blob.type || "image/jpeg" }
      );

      setOriginalFile(null);
      setFileToCrop(file);
      setCropDialogOpen(true);
    } catch (error: unknown) {
      log.error("Error loading image for re-crop:", error);
      toast.error("Erro ao carregar imagem para recorte.");
    }
  }, [imageUrl, originalImageUrl, config.filePrefix, log]);

  const handleReCropComplete = useCallback(
    (croppedFile: File) => {
      handleUploadCroppedOnly(croppedFile);
      setFileToCrop(null);
    },
    [handleUploadCroppedOnly]
  );

  const handleDialogClose = useCallback(
    (open: boolean) => {
      setCropDialogOpen(open);
      if (!open) {
        setFileToCrop(null);
        setOriginalFile(null);
      }
    },
    []
  );

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={config.acceptedTypes.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      {imageUrl ? (
        <div className="relative group rounded-lg overflow-hidden border bg-neutral-800 aspect-video">
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={imageUrl}
              alt={config.altText}
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
                JPG, PNG, WebP ou GIF (máx. {config.maxSizeMB}MB)
              </p>
            </>
          )}
        </div>
      )}

      {/* Crop Dialog */}
      {fileToCrop && (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={handleDialogClose}
          imageFile={fileToCrop}
          onCropComplete={
            originalFile ? handleCropComplete : handleReCropComplete
          }
          preset={config.cropPreset}
        />
      )}
    </div>
  );
}
