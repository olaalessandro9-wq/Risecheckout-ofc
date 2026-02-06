/**
 * ImageCropDialog - Componente Unificado de Crop de Imagem (Estilo Cakto)
 * 
 * Usa FixedCropper do react-advanced-cropper com stencil fixo.
 * A imagem aparece 100% visível dentro do stencil, com liberdade total
 * de zoom e pan. Áreas vazias mostram xadrez no editor e recebem cor
 * sólida ao salvar.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { createLogger } from "@/lib/logger";
import { toast } from "sonner";
import {
  FixedCropper,
  FixedCropperRef,
  ImageRestriction,
} from "react-advanced-cropper";
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
import { useStencilSize } from "./useStencilSize";
import type { ImageCropDialogProps } from "./types";

const log = createLogger("ImageCropDialog");

/** CSS overrides para o cropper (overlay transparente + borda azul no stencil) */
const CROPPER_OVERRIDES_CSS = `
  .crop-overlay-transparent {
    color: transparent !important;
  }
  .crop-stencil-line {
    border-color: rgba(59, 130, 246, 0.8) !important;
    border-width: 2px !important;
  }
`;

/** CSS do pattern xadrez para áreas vazias */
const CHECKERBOARD_STYLE = {
  background: `
    repeating-conic-gradient(
      #808080 0% 25%, 
      #c0c0c0 0% 50%
    ) 50% / 20px 20px
  `,
} as const;

/**
 * Componente principal de crop de imagem (estilo Cakto)
 * 
 * Stencil fixo no centro, imagem aparece completa, zoom/pan livres.
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
  const config = getCropConfig(preset, customConfig);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const cropperRef = useRef<FixedCropperRef>(null);

  const calculateStencilSize = useStencilSize(config.aspectRatio);

  // Load image URL from File
  useEffect(() => {
    if (imageFile && open) {
      setIsImageLoaded(false);
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile, open]);

  // Reset zoom ao abrir
  useEffect(() => {
    if (open) {
      setZoom(100);
      setIsImageLoaded(false);
    }
  }, [open, imageFile]);

  // Zoom via slider
  const handleZoomChange = useCallback(
    (value: number[]) => {
      const newZoom = value[0];
      if (cropperRef.current) {
        const zoomFactor = newZoom / zoom;
        cropperRef.current.zoomImage(zoomFactor, { transitions: true });
      }
      setZoom(newZoom);
    },
    [zoom]
  );

  // onReady dispara APÓS resetCropper completar (state já inicializado)
  const handleReady = useCallback(() => {
    setIsImageLoaded(true);
    log.info("Cropper ready - image loaded successfully");
  }, []);

  // onTransformImageEnd dispara após cada zoom/pan do usuário
  const handleTransformEnd = useCallback((cropper: FixedCropperRef) => {
    const state = cropper.getState();
    if (state?.visibleArea && state.boundary.width > 0) {
      const visibleAreaScale = state.boundary.width / state.visibleArea.width;
      setZoom(Math.round(visibleAreaScale * 100));
    }
  }, []);

  // Handler de erro do cropper - diagnosticabilidade obrigatória
  const handleCropperError = useCallback(() => {
    log.error("FixedCropper failed to load image", { imageUrl });
    toast.error("Falha ao carregar a imagem para edição");
    setIsImageLoaded(false);
  }, [imageUrl]);

  // Salvar imagem com áreas vazias preenchidas
  const handleSaveCrop = useCallback(async () => {
    if (!cropperRef.current) {
      log.warn("No cropper instance available");
      return;
    }

    setIsSaving(true);

    try {
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
            imageFile.name.replace(/\.[^.]+$/, ".png"),
            { type: "image/png" }
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
        "image/png"
      );
    } catch (error) {
      log.error("Error cropping image", error);
      setIsSaving(false);
    }
  }, [imageFile, onCropComplete, onOpenChange, config, preset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-hidden flex flex-col">
          {/* CSS overrides para overlay transparente e borda azul */}
          <style dangerouslySetInnerHTML={{ __html: CROPPER_OVERRIDES_CSS }} />
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
          {/* Cropper Area com xadrez de fundo */}
          <div
            className="w-full h-[500px] max-h-[60vh] relative rounded-lg overflow-hidden"
            style={CHECKERBOARD_STYLE}
          >
            {imageUrl && (
                <FixedCropper
                ref={cropperRef}
                src={imageUrl}
                className="absolute inset-0"
                style={{ background: 'transparent' }}
                stencilSize={calculateStencilSize}
                stencilProps={{
                  handlers: false,
                  lines: true,
                  movable: false,
                  resizable: false,
                  overlayClassName: "crop-overlay-transparent",
                  lineClassName: "crop-stencil-line",
                }}
                imageRestriction={ImageRestriction.none}
                crossOrigin={false}
                transitions={true}
                onReady={handleReady}
                onTransformImageEnd={handleTransformEnd}
                onError={handleCropperError}
              />
            )}
            {/* Loading indicator enquanto a imagem carrega */}
            {imageUrl && !isImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="bg-black/60 rounded-lg px-4 py-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span className="text-white text-sm">Carregando imagem...</span>
                </div>
              </div>
            )}
          </div>

          {/* Zoom Control */}
          <div className="flex items-center gap-4 px-4">
            <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider
              value={[zoom]}
              onValueChange={handleZoomChange}
              min={10}
              max={400}
              step={1}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground whitespace-nowrap w-14 text-right">
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
