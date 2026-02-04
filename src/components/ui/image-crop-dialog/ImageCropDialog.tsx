/**
 * ImageCropDialog - Componente Unificado de Crop de Imagem
 * 
 * MIGRADO para react-advanced-cropper (RISE V3 - Solução 10.0/10)
 * 
 * Esta biblioteca é TypeScript-nativa, sem dependência de cropperjs,
 * eliminando permanentemente os problemas de build com CSS imports.
 * 
 * Presets suportados:
 * - module: 2:3 (320x480) - Thumbnails de módulos
 * - banner: 16:9 (1920x1080) - Banners widescreen
 * - product: 4:3 (800x600) - Imagens de produto
 * - square: 1:1 (400x400) - Avatares
 * - story: 9:16 (1080x1920) - Stories verticais
 * - videoThumbnail: 16:9 (1280x720) - Previews de vídeo
 * - card: 3:2 (600x400) - Cards
 * 
 * @example
 * <ImageCropDialog preset="module" ... />
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { createLogger } from "@/lib/logger";
import { Cropper, CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { getCropConfig } from "./presets";
import type { ImageCropDialogProps } from "./types";

const log = createLogger("ImageCropDialog");

/**
 * Componente principal de crop de imagem
 * Usa react-advanced-cropper - biblioteca TypeScript-nativa sem dependências problemáticas
 */
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
  const [zoom, setZoom] = useState(100);
  const [isSaving, setIsSaving] = useState(false);
  const cropperRef = useRef<CropperRef>(null);

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
      setZoom(100);
    }
  }, [open, imageFile]);

  // Handler para mudança de zoom via slider
  const handleZoomChange = useCallback((value: number[]) => {
    const zoomValue = value[0];
    setZoom(zoomValue);

    if (cropperRef.current) {
      // Calcula o fator de zoom relativo ao zoom atual
      const currentState = cropperRef.current.getState();
      if (currentState) {
        const zoomFactor = zoomValue / zoom;
        cropperRef.current.zoomImage(zoomFactor, { transitions: true });
      }
    }
  }, [zoom]);

  // Handler chamado quando o cropper atualiza (inclui zoom via scroll)
  const handleUpdate = useCallback((cropper: CropperRef) => {
    const state = cropper.getState();
    if (state && state.transforms) {
      // O zoom é relativo à escala base
      const baseScale = state.transforms.rotate ? 1 : 1;
      const visibleAreaScale = state.visibleArea 
        ? (state.boundary.width / state.visibleArea.width) 
        : 1;
      setZoom(Math.round(visibleAreaScale * 100));
    }
  }, []);

  // Salvar imagem recortada
  const handleSaveCrop = useCallback(async () => {
    if (!cropperRef.current) {
      log.warn("No cropper instance available");
      return;
    }

    setIsSaving(true);

    try {
      // Obtém o canvas com as dimensões de saída configuradas
      const canvas = cropperRef.current.getCanvas({
        width: config.outputWidth,
        height: config.outputHeight,
      });

      if (!canvas) {
        log.error("Failed to get canvas from cropper");
        setIsSaving(false);
        return;
      }

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
          <div 
            className="flex-1 flex items-center justify-center rounded-lg overflow-hidden min-h-[400px]"
            style={{
              background: `
                linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%),
                linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%),
                linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            }}
          >
            {imageUrl && (
              <Cropper
                ref={cropperRef}
                src={imageUrl}
                className="h-full w-full"
                stencilProps={{
                  aspectRatio: config.aspectRatio,
                  movable: true,
                  resizable: true,
                  grid: true,
                }}
                transitions={true}
                onUpdate={handleUpdate}
              />
            )}
          </div>

          {/* Zoom Control */}
          <div className="flex items-center gap-4 px-4">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              onValueChange={handleZoomChange}
              min={50}
              max={300}
              step={1}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground whitespace-nowrap w-12 text-right">
              {zoom}%
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
