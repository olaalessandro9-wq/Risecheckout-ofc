/**
 * ImageCropDialogProduct - Modal profissional para recortar imagem de produto
 * 
 * Implementação com react-easy-crop (padrão de mercado)
 * - Suporte a zoom, drag e rotate
 * - Mobile friendly
 * - UX profissional (Kiwify, Hotmart, Cakto)
 * - Proporção 4:3 para imagens de produto
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useState, useEffect, useCallback } from "react";
import { createLogger } from "@/lib/logger";
import Cropper from "react-easy-crop";
import { Area, Point } from "react-easy-crop/types";
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

const log = createLogger("ImageCropDialogProduct");

interface ImageCropDialogProductProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File;
  onCropComplete: (croppedFile: File) => void;
}

const ASPECT_RATIO = 4 / 3; // 800x600
const OUTPUT_WIDTH = 800;
const OUTPUT_HEIGHT = 600;

/**
 * Cria imagem cropada a partir das coordenadas
 */
async function createCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  // Resize to output dimensions
  const outputCanvas = document.createElement("canvas");
  const outputCtx = outputCanvas.getContext("2d");
  
  if (!outputCtx) {
    throw new Error("Could not get output canvas context");
  }

  outputCanvas.width = OUTPUT_WIDTH;
  outputCanvas.height = OUTPUT_HEIGHT;

  outputCtx.drawImage(canvas, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  return new Promise((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob"));
        }
      },
      "image/jpeg",
      0.9
    );
  });
}

/**
 * Carrega imagem a partir de URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

export function ImageCropDialogProduct({
  open,
  onOpenChange,
  imageFile,
  onCropComplete,
}: ImageCropDialogProductProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load image URL when imageFile changes
  useEffect(() => {
    if (imageFile && open) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      // Reset state
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile, open]);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSaveCrop = async () => {
    if (!imageUrl || !croppedAreaPixels) return;

    setIsSaving(true);

    try {
      const croppedBlob = await createCroppedImage(
        imageUrl,
        croppedAreaPixels,
        rotation
      );

      const croppedFile = new File(
        [croppedBlob],
        imageFile.name.replace(/\.[^.]+$/, ".jpg"),
        { type: "image/jpeg" }
      );

      onCropComplete(croppedFile);
      onOpenChange(false);
    } catch (error: unknown) {
      log.error("Error cropping image:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Recortar imagem do produto</DialogTitle>
        </DialogHeader>

        {/* Cropper Area */}
        <div className="relative w-full h-[400px] bg-black/95 rounded-lg overflow-hidden">
          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={ASPECT_RATIO}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteCallback}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              showGrid={true}
              objectFit="contain"
            />
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4 px-2">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <ZoomOut className="h-4 w-4" />
                Zoom
              </label>
              <span className="text-sm text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Rotação</label>
              <span className="text-sm text-muted-foreground">
                {rotation}°
              </span>
            </div>
            <Slider
              value={[rotation]}
              onValueChange={(value) => setRotation(value[0])}
              min={0}
              max={360}
              step={1}
              className="flex-1"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Arraste para posicionar • Use o scroll para zoom • Proporção 4:3
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveCrop} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar corte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
