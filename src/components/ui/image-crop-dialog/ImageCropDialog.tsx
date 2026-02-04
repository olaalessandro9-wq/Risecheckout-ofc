/**
 * ImageCropDialog - Componente Unificado de Crop de Imagem
 * 
 * Implementação com react-cropper que suporta múltiplos presets:
 * - module: 2:3 (320x480) - Thumbnails de módulos
 * - banner: 16:9 (1920x1080) - Banners widescreen
 * - product: 4:3 (800x600) - Imagens de produto
 * - square: 1:1 (400x400) - Avatares
 * - story: 9:16 (1080x1920) - Stories verticais
 * - videoThumbnail: 16:9 (1280x720) - Previews de vídeo
 * - card: 3:2 (600x400) - Cards
 * 
 * Features:
 * - Background xadrez para transparência
 * - Imagem completa visível
 * - Área de crop centralizada
 * - Slider de zoom
 * - Zoom com scroll do mouse
 * - Crop box movível e redimensionável
 * 
 * @example
 * // Usando preset
 * <ImageCropDialog preset="module" ... />
 * 
 * @example
 * // Usando configuração customizada
 * <ImageCropDialog customConfig={{ aspectRatio: 5/4, outputWidth: 500, outputHeight: 400 }} ... />
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { createLogger } from "@/lib/logger";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { getCropConfig } from "./presets";
import type { ImageCropDialogProps } from "./types";

const log = createLogger("ImageCropDialog");

export function ImageCropDialog({
  open,
  onOpenChange,
  imageFile,
  onCropComplete,
  preset,
  customConfig,
  title = "Editar Imagem",
  subtitle = "Ajuste a imagem para o tamanho desejado",
}: ImageCropDialogProps) {
  // Obtém a configuração de crop baseado no preset ou config customizada
  const config = getCropConfig(preset, customConfig);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const cropperRef = useRef<ReactCropperElement>(null);

  // Load image URL when imageFile changes
  useEffect(() => {
    if (imageFile && open) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile, open]);

  // Reset zoom quando a imagem muda
  useEffect(() => {
    if (open) {
      setZoom(0);
    }
  }, [open, imageFile]);

  const handleZoomChange = useCallback((value: number[]) => {
    const zoomValue = value[0];
    setZoom(zoomValue);

    if (cropperRef.current?.cropper) {
      const zoomRatio = zoomValue / 100;
      cropperRef.current.cropper.zoomTo(zoomRatio);
    }
  }, []);

  const handleSaveCrop = useCallback(async () => {
    if (!cropperRef.current?.cropper) {
      log.warn("No cropper instance available");
      return;
    }

    setIsSaving(true);

    try {
      const cropper = cropperRef.current.cropper;

      // Get cropped canvas with output dimensions from config
      const canvas = cropper.getCroppedCanvas({
        width: config.outputWidth,
        height: config.outputHeight,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            log.error("Failed to create blob");
            setIsSaving(false);
            return;
          }

          const croppedFile = new File(
            [blob],
            imageFile.name.replace(/\.[^.]+$/, ".jpg"),
            { type: "image/jpeg" }
          );

          log.info("Crop completed successfully", {
            preset,
            config: config.label,
            outputSize: `${config.outputWidth}x${config.outputHeight}`,
          });
          onCropComplete(croppedFile);
          onOpenChange(false);
          setIsSaving(false);
        },
        "image/jpeg",
        0.9
      );
    } catch (error) {
      log.error("Error cropping image", error);
      setIsSaving(false);
    }
  }, [imageFile, onCropComplete, onOpenChange, config, preset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 py-4 overflow-hidden">
          {/* Cropper Area */}
          <div className="flex-1 flex items-center justify-center bg-black/5 rounded-lg overflow-hidden min-h-[400px]">
            {imageUrl && (
              <Cropper
                ref={cropperRef}
                src={imageUrl}
                style={{ height: "100%", width: "100%" }}
                initialAspectRatio={config.aspectRatio}
                aspectRatio={config.aspectRatio}
                guides={true}
                viewMode={1}
                background={true}
                responsive={true}
                autoCropArea={0.8}
                checkOrientation={false}
                zoomable={true}
                zoomOnWheel={true}
                wheelZoomRatio={0.1}
                cropBoxMovable={true}
                cropBoxResizable={true}
                toggleDragModeOnDblclick={false}
              />
            )}
          </div>

          {/* Zoom Control */}
          <div className="flex items-center gap-4 px-4">
            <span className="text-sm font-medium whitespace-nowrap">Zoom:</span>
            <Slider
              value={[zoom]}
              onValueChange={handleZoomChange}
              min={0}
              max={200}
              step={1}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap w-12 text-right">
              {zoom.toFixed(0)}%
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSaveCrop} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
