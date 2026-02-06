/**
 * ImageCropDialog - Stencil Arrastável e Redimensionável (Estilo Cakto)
 *
 * A imagem fica FIXA no container (object-fit: contain).
 * O stencil azul é arrastável (corpo) e redimensionável (8 handles).
 * O aspect ratio é SEMPRE mantido durante o redimensionamento.
 * O stencil nunca sai dos limites da imagem.
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

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type HandleType = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragState {
  type: "move" | "resize";
  handle?: HandleType;
  startMouseX: number;
  startMouseY: number;
  startRect: Rect;
}

const HANDLES: HandleType[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

const HANDLE_CURSORS: Record<HandleType, string> = {
  nw: "nw-resize",
  n: "n-resize",
  ne: "ne-resize",
  e: "e-resize",
  se: "se-resize",
  s: "s-resize",
  sw: "sw-resize",
  w: "w-resize",
};

/** Minimum stencil dimension in pixels */
const MIN_STENCIL_SIZE = 30;

// ═══════════════════════════════════════════════════════════
// GEOMETRY HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Computes the actual rendered rect of an image inside a container
 * when using object-fit: contain.
 */
function computeImageRect(
  containerW: number,
  containerH: number,
  naturalW: number,
  naturalH: number,
): Rect {
  const imgAspect = naturalW / naturalH;
  const containerAspect = containerW / containerH;

  let displayW: number;
  let displayH: number;

  if (imgAspect > containerAspect) {
    displayW = containerW;
    displayH = containerW / imgAspect;
  } else {
    displayH = containerH;
    displayW = containerH * imgAspect;
  }

  return {
    x: (containerW - displayW) / 2,
    y: (containerH - displayH) / 2,
    width: displayW,
    height: displayH,
  };
}

/**
 * Initializes the stencil centered on the image with maximum size
 * that fits inside the image while maintaining aspect ratio.
 */
function initStencilRect(imageRect: Rect, aspectRatio: number): Rect {
  const imgAspect = imageRect.width / imageRect.height;

  let w: number;
  let h: number;

  if (aspectRatio > imgAspect) {
    w = imageRect.width;
    h = w / aspectRatio;
  } else {
    h = imageRect.height;
    w = h * aspectRatio;
  }

  return {
    x: imageRect.x + (imageRect.width - w) / 2,
    y: imageRect.y + (imageRect.height - h) / 2,
    width: w,
    height: h,
  };
}

/**
 * Clamps the stencil rect so it stays within image bounds.
 */
function clampRect(rect: Rect, bounds: Rect): Rect {
  const x = Math.max(bounds.x, Math.min(rect.x, bounds.x + bounds.width - rect.width));
  const y = Math.max(bounds.y, Math.min(rect.y, bounds.y + bounds.height - rect.height));
  return { ...rect, x, y };
}

/**
 * Returns the position style for a handle.
 */
function getHandlePosition(handle: HandleType, rect: Rect) {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;

  switch (handle) {
    case "nw": return { left: rect.x, top: rect.y };
    case "n":  return { left: cx, top: rect.y };
    case "ne": return { left: rect.x + rect.width, top: rect.y };
    case "e":  return { left: rect.x + rect.width, top: cy };
    case "se": return { left: rect.x + rect.width, top: rect.y + rect.height };
    case "s":  return { left: cx, top: rect.y + rect.height };
    case "sw": return { left: rect.x, top: rect.y + rect.height };
    case "w":  return { left: rect.x, top: cy };
  }
}

// ═══════════════════════════════════════════════════════════
// RESIZE LOGIC
// ═══════════════════════════════════════════════════════════

/**
 * Computes the new stencil rect after dragging a resize handle.
 * Maintains aspect ratio and stays within image bounds.
 */
function computeResize(
  handle: HandleType,
  deltaX: number,
  deltaY: number,
  startRect: Rect,
  aspectRatio: number,
  bounds: Rect,
): Rect {
  let { x, y, width, height } = startRect;

  // Determine which edges move
  const movesLeft   = handle === "nw" || handle === "w" || handle === "sw";
  const movesRight  = handle === "ne" || handle === "e" || handle === "se";
  const movesTop    = handle === "nw" || handle === "n" || handle === "ne";
  const movesBottom = handle === "sw" || handle === "s" || handle === "se";

  // Calculate new dimensions based on primary axis
  if (movesRight) {
    width = Math.max(MIN_STENCIL_SIZE, startRect.width + deltaX);
  } else if (movesLeft) {
    width = Math.max(MIN_STENCIL_SIZE, startRect.width - deltaX);
  }

  if (movesBottom) {
    height = Math.max(MIN_STENCIL_SIZE, startRect.height + deltaY);
  } else if (movesTop) {
    height = Math.max(MIN_STENCIL_SIZE, startRect.height - deltaY);
  }

  // Enforce aspect ratio: use the dominant dimension
  if (handle === "n" || handle === "s") {
    // Vertical-only handles: height drives width
    width = height * aspectRatio;
  } else if (handle === "e" || handle === "w") {
    // Horizontal-only handles: width drives height
    height = width / aspectRatio;
  } else {
    // Corner handles: use the larger delta
    const candidateH = width / aspectRatio;
    const candidateW = height * aspectRatio;
    if (candidateH <= height) {
      height = candidateH;
    } else {
      width = candidateW;
    }
  }

  // Minimum size enforcement
  if (width < MIN_STENCIL_SIZE) {
    width = MIN_STENCIL_SIZE;
    height = width / aspectRatio;
  }
  if (height < MIN_STENCIL_SIZE) {
    height = MIN_STENCIL_SIZE;
    width = height * aspectRatio;
  }

  // Calculate new position based on anchor (opposite corner/edge stays fixed)
  if (movesLeft) {
    x = startRect.x + startRect.width - width;
  }
  if (movesTop) {
    y = startRect.y + startRect.height - height;
  }

  // Constrain to image bounds
  if (x < bounds.x) {
    x = bounds.x;
    width = movesLeft ? (startRect.x + startRect.width - bounds.x) : width;
    height = width / aspectRatio;
  }
  if (y < bounds.y) {
    y = bounds.y;
    height = movesTop ? (startRect.y + startRect.height - bounds.y) : height;
    width = height * aspectRatio;
  }
  if (x + width > bounds.x + bounds.width) {
    width = bounds.x + bounds.width - x;
    height = width / aspectRatio;
  }
  if (y + height > bounds.y + bounds.height) {
    height = bounds.y + bounds.height - y;
    width = height * aspectRatio;
  }

  return { x, y, width, height };
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

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
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [stencilRect, setStencilRect] = useState<Rect | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // === Refs ===
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainerEl(node);
  }, []);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<DragState | null>(null);

  // === Load image URL from File ===
  useEffect(() => {
    if (imageFile && open) {
      setIsLoading(true);
      setNaturalSize(null);
      setStencilRect(null);
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [imageFile, open]);

  // === Observe container size ===
  useEffect(() => {
    if (!containerEl) return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerEl);
    return () => observer.disconnect();
  }, [containerEl]);

  // === Computed: image rect (where the image actually renders in the container) ===
  const imageRect = useMemo(() => {
    if (!containerSize || !naturalSize) return null;
    return computeImageRect(
      containerSize.width,
      containerSize.height,
      naturalSize.width,
      naturalSize.height,
    );
  }, [containerSize, naturalSize]);

  // === Image load handler: initializes stencil ===
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const ns = { width: img.naturalWidth, height: img.naturalHeight };
    setNaturalSize(ns);
    setIsLoading(false);
    log.info("Image loaded", { naturalSize: `${ns.width}x${ns.height}` });
  }, []);

  // === Initialize stencil when imageRect becomes available ===
  useEffect(() => {
    if (imageRect && !stencilRect) {
      setStencilRect(initStencilRect(imageRect, config.aspectRatio));
    }
  }, [imageRect, stencilRect, config.aspectRatio]);

  // === Re-initialize stencil when container resizes (proportional) ===
  useEffect(() => {
    if (!imageRect || !stencilRect) return;

    // Ensure stencil stays within image bounds after resize
    const clamped = clampRect(stencilRect, imageRect);

    // Also ensure stencil doesn't exceed image dimensions
    let { width, height } = clamped;
    if (width > imageRect.width) {
      width = imageRect.width;
      height = width / config.aspectRatio;
    }
    if (height > imageRect.height) {
      height = imageRect.height;
      width = height * config.aspectRatio;
    }

    const finalRect = clampRect({ ...clamped, width, height }, imageRect);

    if (
      finalRect.x !== stencilRect.x ||
      finalRect.y !== stencilRect.y ||
      finalRect.width !== stencilRect.width ||
      finalRect.height !== stencilRect.height
    ) {
      setStencilRect(finalRect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageRect]);

  const handleImageError = useCallback(() => {
    log.error("Failed to load image");
    toast.error("Falha ao carregar a imagem para edição");
    setIsLoading(false);
  }, []);

  // === Mouse/Touch interaction for drag and resize ===
  useEffect(() => {
    if (!containerEl || !imageRect) return undefined;

    const handlePointerMove = (clientX: number, clientY: number) => {
      const drag = dragRef.current;
      if (!drag || !stencilRect) return;

      const deltaX = clientX - drag.startMouseX;
      const deltaY = clientY - drag.startMouseY;

      if (drag.type === "move") {
        const newRect = clampRect(
          {
            ...drag.startRect,
            x: drag.startRect.x + deltaX,
            y: drag.startRect.y + deltaY,
          },
          imageRect,
        );
        setStencilRect(newRect);
      } else if (drag.type === "resize" && drag.handle) {
        const newRect = computeResize(
          drag.handle,
          deltaX,
          deltaY,
          drag.startRect,
          config.aspectRatio,
          imageRect,
        );
        setStencilRect(newRect);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handlePointerMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (dragRef.current && e.touches.length === 1) {
        e.preventDefault();
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      dragRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [containerEl, imageRect, stencilRect, config.aspectRatio]);

  // === Start drag (body) ===
  const handleStencilMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!stencilRect) return;
    dragRef.current = {
      type: "move",
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startRect: { ...stencilRect },
    };
  }, [stencilRect]);

  const handleStencilTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1 || !stencilRect) return;
    e.stopPropagation();
    dragRef.current = {
      type: "move",
      startMouseX: e.touches[0].clientX,
      startMouseY: e.touches[0].clientY,
      startRect: { ...stencilRect },
    };
  }, [stencilRect]);

  // === Start resize (handle) ===
  const handleHandleMouseDown = useCallback((handle: HandleType, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!stencilRect) return;
    dragRef.current = {
      type: "resize",
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startRect: { ...stencilRect },
    };
  }, [stencilRect]);

  const handleHandleTouchStart = useCallback((handle: HandleType, e: React.TouchEvent) => {
    if (e.touches.length !== 1 || !stencilRect) return;
    e.stopPropagation();
    dragRef.current = {
      type: "resize",
      handle,
      startMouseX: e.touches[0].clientX,
      startMouseY: e.touches[0].clientY,
      startRect: { ...stencilRect },
    };
  }, [stencilRect]);

  // === Save/Export ===
  const handleSaveCrop = useCallback(async () => {
    if (!imageRef.current || !stencilRect || !imageRect || !naturalSize) {
      log.warn("Cannot save: missing data");
      return;
    }

    setIsSaving(true);

    try {
      const croppedFile = await exportCropToPng({
        imageElement: imageRef.current,
        stencilRect,
        imageRect,
        naturalWidth: naturalSize.width,
        naturalHeight: naturalSize.height,
        outputWidth: config.outputWidth,
        outputHeight: config.outputHeight,
      });

      const renamedFile = new File(
        [croppedFile],
        imageFile.name.replace(/\.[^.]+$/, ".png"),
        { type: "image/png" },
      );

      log.info("Crop completed", {
        preset,
        config: config.label,
        outputSize: `${config.outputWidth}x${config.outputHeight}`,
      });

      onCropComplete(renamedFile);
      onOpenChange(false);
    } catch (error) {
      log.error("Error exporting crop", error);
      toast.error("Erro ao salvar a imagem");
    } finally {
      setIsSaving(false);
    }
  }, [imageFile, onCropComplete, onOpenChange, config, preset, stencilRect, imageRect, naturalSize]);

  // === Overlay clip path (darkens area outside stencil) ===
  const overlayClipPath = useMemo(() => {
    if (!stencilRect || !containerSize) return undefined;
    const { x, y, width, height } = stencilRect;
    const cw = containerSize.width;
    const ch = containerSize.height;
    // Inset polygon: outer rect → inner rect (stencil hole)
    return `polygon(
      0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
      ${x}px ${y}px,
      ${x}px ${y + height}px,
      ${x + width}px ${y + height}px,
      ${x + width}px ${y}px,
      ${x}px ${y}px
    )`;
  }, [stencilRect, containerSize]);

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
          <div
            ref={containerRef}
            className="crop-container w-full h-[500px] max-h-[60vh] relative rounded-lg overflow-hidden select-none"
          >
            {/* Image: fixed, fills container with object-fit contain */}
            {imageUrl && (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Imagem para edição"
                draggable={false}
                onLoad={handleImageLoad}
                onError={handleImageError}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  objectFit: "contain",
                  opacity: naturalSize ? 1 : 0,
                }}
              />
            )}

            {/* Dark overlay outside stencil */}
            {stencilRect && containerSize && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  clipPath: overlayClipPath,
                }}
              />
            )}

            {/* Stencil body (draggable) */}
            {stencilRect && (
              <div
                className="crop-stencil absolute"
                style={{
                  left: stencilRect.x,
                  top: stencilRect.y,
                  width: stencilRect.width,
                  height: stencilRect.height,
                  cursor: dragRef.current?.type === "move" ? "grabbing" : "move",
                }}
                onMouseDown={handleStencilMouseDown}
                onTouchStart={handleStencilTouchStart}
              >
                {/* Resize handles */}
                {HANDLES.map((handle) => {
                  const pos = getHandlePosition(handle, {
                    x: 0,
                    y: 0,
                    width: stencilRect.width,
                    height: stencilRect.height,
                  });
                  return (
                    <div
                      key={handle}
                      className="crop-handle"
                      style={{
                        left: pos.left,
                        top: pos.top,
                        cursor: HANDLE_CURSORS[handle],
                      }}
                      onMouseDown={(e) => handleHandleMouseDown(handle, e)}
                      onTouchStart={(e) => handleHandleTouchStart(handle, e)}
                    />
                  );
                })}
              </div>
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
