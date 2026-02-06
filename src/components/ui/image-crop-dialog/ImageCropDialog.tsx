/**
 * ImageCropDialog - Componente Customizado de Crop (Zero Dependência de Biblioteca)
 * 
 * Implementação 100% própria. A centralização é feita por CSS puro
 * (position: absolute + top: 50% + left: 50% + transform: translate(-50%, -50%)),
 * sendo IMPOSSÍVEL de quebrar. Não depende de nenhum pipeline opaco de biblioteca.
 * 
 * Comportamento (estilo Cakto):
 * - Stencil fixo no centro (borda azul tracejada)
 * - Imagem centralizada e fixa (sem arraste/panning)
 * - Zoom exclusivo via scroll do mouse / pinch gesture
 * - Áreas vazias mostram xadrez no editor e transparência no PNG final
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { createLogger } from "@/lib/logger";
import { toast } from "sonner";
import "./ImageCropDialog.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getCropConfig } from "./presets";
import { exportCropToPng } from "./cropExport";
import type { ImageCropDialogProps } from "./types";

const log = createLogger("ImageCropDialog");

/** Limites de zoom */
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 5.0;
const ZOOM_STEP = 0.1;

/** Percentual do container que o stencil pode ocupar */
const STENCIL_PADDING = 0.9;

interface NaturalSize {
  width: number;
  height: number;
}

/**
 * Calcula o tamanho do stencil que cabe no container mantendo o aspect ratio.
 * O stencil usa 90% do container como margem de segurança.
 */
function computeStencilSize(
  containerWidth: number,
  containerHeight: number,
  aspectRatio: number,
): { width: number; height: number } {
  const maxW = containerWidth * STENCIL_PADDING;
  const maxH = containerHeight * STENCIL_PADDING;

  let w = maxW;
  let h = maxW / aspectRatio;

  if (h > maxH) {
    h = maxH;
    w = maxH * aspectRatio;
  }

  return { width: Math.round(w), height: Math.round(h) };
}

/**
 * Calcula o tamanho da imagem fazendo fit-contain dentro do stencil.
 * A imagem cabe inteira dentro do stencil sem distorcer.
 */
function computeImageSize(
  naturalWidth: number,
  naturalHeight: number,
  stencilWidth: number,
  stencilHeight: number,
  zoom: number,
): { width: number; height: number } {
  const scaleW = stencilWidth / naturalWidth;
  const scaleH = stencilHeight / naturalHeight;
  const baseScale = Math.min(scaleW, scaleH);

  return {
    width: Math.round(naturalWidth * baseScale * zoom),
    height: Math.round(naturalHeight * baseScale * zoom),
  };
}

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
  const config = getCropConfig(preset, customConfig);

  // === State ===
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // === Refs ===
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // === Load image URL from File ===
  useEffect(() => {
    if (imageFile && open) {
      setIsLoading(true);
      setNaturalSize(null);
      setZoom(MIN_ZOOM);
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [imageFile, open]);

  // === Observe container size via ResizeObserver ===
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // === Image load handler ===
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    setIsLoading(false);
    log.info("Image loaded", {
      naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
    });
  }, []);

  const handleImageError = useCallback(() => {
    log.error("Failed to load image");
    toast.error("Falha ao carregar a imagem para edição");
    setIsLoading(false);
  }, []);

  // === Computed sizes ===
  const stencilSize = useMemo(() => {
    if (!containerSize) return null;
    return computeStencilSize(containerSize.width, containerSize.height, config.aspectRatio);
  }, [containerSize, config.aspectRatio]);

  const imageDisplaySize = useMemo(() => {
    if (!naturalSize || !stencilSize) return null;
    return computeImageSize(
      naturalSize.width,
      naturalSize.height,
      stencilSize.width,
      stencilSize.height,
      zoom,
    );
  }, [naturalSize, stencilSize, zoom]);

  // === Zoom via wheel ===
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
    });
  }, []);

  // === Touch pinch zoom ===
  const lastPinchDistance = useRef<number | null>(null);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 2) {
      lastPinchDistance.current = null;
      return;
    }

    e.preventDefault();

    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (lastPinchDistance.current !== null) {
      const delta = (distance - lastPinchDistance.current) * 0.005;
      setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
    }

    lastPinchDistance.current = distance;
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistance.current = null;
  }, []);

  // === Save/Export ===
  const handleSaveCrop = useCallback(async () => {
    if (!imageRef.current || !stencilSize || !imageDisplaySize) {
      log.warn("Cannot save: missing refs or computed sizes");
      return;
    }

    setIsSaving(true);

    try {
      const croppedFile = await exportCropToPng({
        imageElement: imageRef.current,
        stencilDisplayWidth: stencilSize.width,
        stencilDisplayHeight: stencilSize.height,
        imageDisplayWidth: imageDisplaySize.width,
        imageDisplayHeight: imageDisplaySize.height,
        outputWidth: config.outputWidth,
        outputHeight: config.outputHeight,
      });

      // Rename to match original file name with .png extension
      const renamedFile = new File(
        [croppedFile],
        imageFile.name.replace(/\.[^.]+$/, ".png"),
        { type: "image/png" },
      );

      log.info("Crop completed", {
        preset,
        config: config.label,
        outputSize: `${config.outputWidth}x${config.outputHeight}`,
        zoom: zoom.toFixed(2),
      });

      onCropComplete(renamedFile);
      onOpenChange(false);
    } catch (error) {
      log.error("Error exporting crop", error);
      toast.error("Erro ao salvar a imagem");
    } finally {
      setIsSaving(false);
    }
  }, [imageFile, onCropComplete, onOpenChange, config, preset, stencilSize, imageDisplaySize, zoom]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {subtitle}
            {config.label && (
              <span className="ml-2 text-xs opacity-70">
                ({config.label} — {config.outputWidth}×{config.outputHeight}px)
              </span>
            )}
          </p>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 py-4 overflow-hidden">
          {/* Crop area com checkerboard background */}
          <div
            ref={containerRef}
            className="crop-container w-full h-[500px] max-h-[60vh] relative rounded-lg overflow-hidden select-none"
            onWheel={handleWheel}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Stencil overlay (centralizado via CSS) */}
            {stencilSize && (
              <div
                className="crop-stencil absolute pointer-events-none"
                style={{
                  width: stencilSize.width,
                  height: stencilSize.height,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}

            {/* Imagem (centralizada via CSS — IMPOSSÍVEL de quebrar) */}
            {imageUrl && (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Imagem para edição"
                draggable={false}
                onLoad={handleImageLoad}
                onError={handleImageError}
                className="absolute pointer-events-none"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  ...(imageDisplaySize
                    ? {
                        width: imageDisplaySize.width,
                        height: imageDisplaySize.height,
                      }
                    : {
                        // Antes do load, esconde a imagem (sem dimensões)
                        opacity: 0,
                      }),
                }}
              />
            )}

            {/* Loading overlay */}
            {isLoading && imageUrl && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="bg-black/60 rounded-lg px-4 py-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span className="text-white text-sm">Carregando imagem...</span>
                </div>
              </div>
            )}
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
          <Button onClick={handleSaveCrop} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
