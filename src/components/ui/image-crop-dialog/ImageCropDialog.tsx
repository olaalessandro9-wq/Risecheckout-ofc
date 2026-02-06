/**
 * ImageCropDialog - Componente Unificado de Crop de Imagem (Estilo Cakto)
 * 
 * Usa FixedCropper do react-advanced-cropper com stencil fixo.
 * A imagem aparece centralizada e FIXA (sem arraste). O zoom é feito
 * exclusivamente via scroll do mouse / pinch (gesto nativo).
 * Áreas vazias mostram xadrez no editor e transparência real no PNG final.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { createLogger } from "@/lib/logger";
import { toast } from "sonner";
import {
  FixedCropper,
  FixedCropperRef,
  ImageRestriction,
} from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
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
import { useStencilSize } from "./useStencilSize";
import type { ImageCropDialogProps } from "./types";

const log = createLogger("ImageCropDialog");

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
 * Props para desabilitar o arraste da imagem (Cakto-style: imagem fixa).
 * 
 * moveImage: false → desabilita drag via mouse/touch
 * scaleImage permanece true (default) → zoom via scroll/pinch funciona
 * 
 * Confirmado no source: CropperBackgroundWrapper passa moveImage
 * como mouseMove e touchMove ao TransformableImage interno.
 */
const FIXED_IMAGE_PROPS = { moveImage: false } as const;

/**
 * Componente principal de crop de imagem (estilo Cakto)
 * 
 * Stencil fixo no centro, imagem centralizada e fixa (sem arraste),
 * zoom exclusivo via scroll do mouse.
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

  // Reset state ao abrir
  useEffect(() => {
    if (open) {
      setIsImageLoaded(false);
    }
  }, [open, imageFile]);

  /**
   * onReady: centraliza a imagem usando setState (sem postProcess).
   * 
   * ROOT CAUSE FIX: moveImage() dispara transformImageAlgorithm que
   * aplica fixedStencilAlgorithm como postProcess, desfazendo a correção.
   * setState() com postprocess=false (default) preserva o state exato
   * que passamos, sem recálculos.
   * 
   * @see AbstractCropperInstance.js linhas 257-276
   */
  const handleReady = useCallback((cropper: FixedCropperRef) => {
    setIsImageLoaded(true);

    const state = cropper.getState();
    if (!state?.coordinates || !state.visibleArea) return;

    const { coordinates, visibleArea } = state;

    // Centro das coordinates (crop area)
    const coordsCenterX = coordinates.left + coordinates.width / 2;
    const coordsCenterY = coordinates.top + coordinates.height / 2;

    // Centro da visibleArea (viewport)
    const viewCenterX = visibleArea.left + visibleArea.width / 2;
    const viewCenterY = visibleArea.top + visibleArea.height / 2;

    // Diferença: quanto a visibleArea precisa mover para centralizar nas coordinates
    const diffX = coordsCenterX - viewCenterX;
    const diffY = coordsCenterY - viewCenterY;

    const TOLERANCE = 1; // px

    if (Math.abs(diffX) > TOLERANCE || Math.abs(diffY) > TOLERANCE) {
      cropper.setState(
        (currentState) => {
          if (!currentState) return currentState;
          return {
            ...currentState,
            visibleArea: {
              ...currentState.visibleArea,
              left: currentState.visibleArea.left + diffX,
              top: currentState.visibleArea.top + diffY,
            },
          };
        },
        { transitions: false }
      );
      log.info("Centering corrected via setState (no postProcess)", {
        diffX: Math.round(diffX),
        diffY: Math.round(diffY),
      });
    }
  }, []);

  // Handler de erro do cropper - diagnosticabilidade obrigatória
  const handleCropperError = useCallback(() => {
    log.error("FixedCropper failed to load image", { imageUrl });
    toast.error("Falha ao carregar a imagem para edição");
    setIsImageLoaded(false);
  }, [imageUrl]);

  // Salvar imagem como PNG com transparência real
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
                className="rise-cropper absolute inset-0"
                style={{ background: "transparent" }}
                stencilSize={calculateStencilSize}
                stencilProps={{
                  handlers: false,
                  lines: true,
                  movable: false,
                  resizable: false,
                }}
                imageRestriction={ImageRestriction.none}
                backgroundWrapperProps={FIXED_IMAGE_PROPS}
                crossOrigin={false}
                transitions={true}
                onReady={handleReady}
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
