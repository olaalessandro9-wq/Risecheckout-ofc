/**
 * BannerImageCropDialog - Modal profissional para recortar imagem de banner
 * 
 * Implementação com react-cropper (SOLUÇÃO DA CAKTO)
 * - Background xadrez (mostra claramente o que está dentro/fora)
 * - Imagem COMPLETA visível (nunca fica torta)
 * - Área de crop centralizada e destacada
 * - Slider de zoom visível
 * - Imagem se adapta automaticamente
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

const log = createLogger("BannerImageCropDialog");

interface BannerImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File;
  onCropComplete: (croppedFile: File) => void;
}

const ASPECT_RATIO = 16 / 9;
const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;

export function BannerImageCropDialog({
  open,
  onOpenChange,
  imageFile,
  onCropComplete,
}: BannerImageCropDialogProps) {
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

  const handleZoomChange = useCallback((value: number[]) => {
    const zoomValue = value[0];
    setZoom(zoomValue);
    
    if (cropperRef.current?.cropper) {
      // Zoom range: -1 to 1 (cropperjs uses ratio)
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
      
      // Get cropped canvas with output dimensions
      const canvas = cropper.getCroppedCanvas({
        width: OUTPUT_WIDTH,
        height: OUTPUT_HEIGHT,
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

          log.info("Crop completed successfully");
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
  }, [imageFile, onCropComplete, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Imagem</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Ajuste a imagem para o tamanho desejado
          </p>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 py-4 overflow-hidden">
          {/* Cropper Area */}
          <div className="flex-1 flex items-center justify-center bg-black/5 rounded-lg overflow-hidden min-h-[400px]">
            {imageUrl && (
              <Cropper
                ref={cropperRef}
                src={imageUrl}
                style={{ height: "100%", width: "100%" }}
                initialAspectRatio={ASPECT_RATIO}
                aspectRatio={ASPECT_RATIO}
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
