/**
 * BannerImageCropDialog - Modal profissional para recortar imagem de banner
 * 
 * Implementação com react-image-crop (PADRÃO DE MERCADO REAL)
 * - Handles visuais nos cantos e laterais (UX intuitiva)
 * - Área de crop redimensionável visualmente
 * - Background escurecido ao redor da área de crop
 * - UX profissional igual Kiwify, Hotmart, Cakto
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { createLogger } from "@/lib/logger";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 80,
    height: 45,
    x: 10,
    y: 27.5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Load image URL when imageFile changes
  useEffect(() => {
    if (imageFile && open) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile, open]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    log.debug("Image loaded", { width, height });
    
    // Define crop inicial centralizado (16:9)
    const aspectRatio = 16 / 9;
    let cropWidth = 80;
    let cropHeight = (cropWidth * height) / width / aspectRatio;
    
    if (cropHeight > 80) {
      cropHeight = 80;
      cropWidth = (cropHeight * width * aspectRatio) / height;
    }
    
    setCrop({
      unit: "%",
      width: cropWidth,
      height: cropHeight,
      x: (100 - cropWidth) / 2,
      y: (100 - cropHeight) / 2,
    });
  }, []);

  const handleSaveCrop = useCallback(async () => {
    if (!completedCrop || !imgRef.current) {
      log.warn("No crop or image ref available");
      return;
    }

    setIsSaving(true);

    try {
      const image = imgRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("No 2d context");
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Set canvas to output size
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;

      // Draw cropped image scaled to output size
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT
      );

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
  }, [completedCrop, imageFile, onCropComplete, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Recortar imagem do banner</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-4 max-h-[70vh] overflow-auto bg-black/5 rounded-lg">
          {imageUrl && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={ASPECT_RATIO}
              className="max-w-full"
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-w-full max-h-[60vh] object-contain"
                style={{ display: "block" }}
              />
            </ReactCrop>
          )}
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Arraste as alças nos cantos e laterais para ajustar a área de recorte (proporção 16:9)
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveCrop}
            disabled={isSaving || !completedCrop}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar corte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
