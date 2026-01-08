/**
 * BannerImageCropDialog - Modal para recortar imagem de banner na proporção 16:9
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface BannerImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File;
  onCropComplete: (croppedFile: File) => void;
}

const ASPECT_RATIO = 16 / 9; // 1920x1080
const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;

export function BannerImageCropDialog({
  open,
  onOpenChange,
  imageFile,
  onCropComplete,
}: BannerImageCropDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Load image URL and reset crop area when imageFile changes
  useEffect(() => {
    if (imageFile && open) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      setCropArea({ x: 0, y: 0, width: 0, height: 0 });
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile, open]);

  // Calculate initial crop area when image loads
  const handleImageLoad = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const img = imageRef.current;
    const displayedWidth = img.clientWidth;
    const displayedHeight = img.clientHeight;

    let cropWidth: number;
    let cropHeight: number;

    if (displayedWidth / displayedHeight > ASPECT_RATIO) {
      // Image is wider - fit by height
      cropHeight = displayedHeight * 0.85;
      cropWidth = cropHeight * ASPECT_RATIO;
    } else {
      // Image is taller - fit by width
      cropWidth = displayedWidth * 0.85;
      cropHeight = cropWidth / ASPECT_RATIO;
    }

    // Ensure crop doesn't exceed image bounds
    if (cropWidth > displayedWidth) {
      cropWidth = displayedWidth;
      cropHeight = cropWidth / ASPECT_RATIO;
    }
    if (cropHeight > displayedHeight) {
      cropHeight = displayedHeight;
      cropWidth = cropHeight * ASPECT_RATIO;
    }

    const x = (displayedWidth - cropWidth) / 2;
    const y = (displayedHeight - cropHeight) / 2;

    setCropArea({ x, y, width: cropWidth, height: cropHeight });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropArea.x, y: e.clientY - cropArea.y });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !imageRef.current) return;

      const img = imageRef.current;
      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;

      newX = Math.max(0, Math.min(newX, img.clientWidth - cropArea.width));
      newY = Math.max(0, Math.min(newY, img.clientHeight - cropArea.height));

      setCropArea((prev) => ({ ...prev, x: newX, y: newY }));
    },
    [isDragging, dragStart, cropArea.width, cropArea.height]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSaveCrop = async () => {
    if (!imageRef.current || !imageUrl) return;

    setIsSaving(true);

    try {
      const img = imageRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      const scaleX = img.naturalWidth / img.clientWidth;
      const scaleY = img.naturalHeight / img.clientHeight;

      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;

      ctx.drawImage(
        img,
        cropArea.x * scaleX,
        cropArea.y * scaleY,
        cropArea.width * scaleX,
        cropArea.height * scaleY,
        0,
        0,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Failed to create blob"))),
          "image/jpeg",
          0.9
        );
      });

      const croppedFile = new File(
        [blob],
        imageFile.name.replace(/\.[^.]+$/, ".jpg"),
        { type: "image/jpeg" }
      );

      onCropComplete(croppedFile);
      onOpenChange(false);
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Recortar imagem do banner</DialogTitle>
        </DialogHeader>

        <div
          ref={containerRef}
          className="relative w-full h-[400px] bg-black/90 rounded-lg overflow-hidden flex items-center justify-center"
        >
          {imageUrl && (
            <div className="relative">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Imagem para recorte"
                className="max-w-full max-h-[380px] object-contain"
                onLoad={handleImageLoad}
                draggable={false}
              />

              {/* Overlay escuro fora da área de crop */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute left-0 right-0 top-0 bg-black/60"
                  style={{ height: cropArea.y }}
                />
                <div
                  className="absolute left-0 right-0 bg-black/60"
                  style={{
                    top: cropArea.y + cropArea.height,
                    bottom: 0,
                  }}
                />
                <div
                  className="absolute left-0 bg-black/60"
                  style={{
                    top: cropArea.y,
                    width: cropArea.x,
                    height: cropArea.height,
                  }}
                />
                <div
                  className="absolute right-0 bg-black/60"
                  style={{
                    top: cropArea.y,
                    left: cropArea.x + cropArea.width,
                    height: cropArea.height,
                  }}
                />
              </div>

              {/* Área de crop arrastável */}
              <div
                className="absolute border-2 border-white cursor-move"
                style={{
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.width,
                  height: cropArea.height,
                }}
                onMouseDown={handleMouseDown}
              >
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-sm" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-sm" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-sm" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-sm" />
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Arraste para ajustar o enquadramento (proporção 16:9)
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
