/**
 * ImageCropDialog - Stencil Arrastável e Redimensionável (Estilo Cakto)
 *
 * A imagem fica FIXA no container (dimensionamento manual com zoom).
 * O stencil azul é arrastável (corpo) e redimensionável (8 handles livres).
 * Handles movem bordas independentemente — SEM trava de aspect ratio.
 * O stencil pode se estender além da imagem (área de xadrez = transparência).
 * Zoom via scroll do mouse.
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

/** Zoom limits */
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const ZOOM_STEP = 0.1;

// ═══════════════════════════════════════════════════════════
// GEOMETRY HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Computes the base display dimensions for an image inside a container
 * using object-fit: contain logic (without zoom applied).
 */
function computeBaseImageRect(
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
 * Initializes the stencil covering the entire image.
 * Since handles are free-form (no aspect ratio lock), the stencil
 * always starts as an exact clone of the imageRect.
 */
function initStencilRect(imageRect: Rect): Rect {
  return {
    x: imageRect.x,
    y: imageRect.y,
    width: imageRect.width,
    height: imageRect.height,
  };
}

/**
 * Clamps a rect so it stays within bounds (for drag/move only).
 */
function clampRectMove(rect: Rect, bounds: Rect): Rect {
  const x = Math.max(bounds.x, Math.min(rect.x, bounds.x + bounds.width - rect.width));
  const y = Math.max(bounds.y, Math.min(rect.y, bounds.y + bounds.height - rect.height));
  return { ...rect, x, y };
}

/**
 * Returns the position style for a handle relative to the stencil.
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
// RESIZE LOGIC (FREE-FORM, NO ASPECT RATIO LOCK)
// ═══════════════════════════════════════════════════════════

/**
 * Computes the new stencil rect after dragging a resize handle.
 * Each handle moves ONLY the edges it touches — NO aspect ratio enforcement.
 * Stencil is clamped to the container bounds (not image bounds).
 */
function computeResize(
  handle: HandleType,
  deltaX: number,
  deltaY: number,
  startRect: Rect,
  containerBounds: Rect,
): Rect {
  let top = startRect.y;
  let left = startRect.x;
  let right = startRect.x + startRect.width;
  let bottom = startRect.y + startRect.height;

  // Move only the edges this handle controls
  if (handle === "nw" || handle === "n" || handle === "ne") {
    top = startRect.y + deltaY;
  }
  if (handle === "sw" || handle === "s" || handle === "se") {
    bottom = startRect.y + startRect.height + deltaY;
  }
  if (handle === "nw" || handle === "w" || handle === "sw") {
    left = startRect.x + deltaX;
  }
  if (handle === "ne" || handle === "e" || handle === "se") {
    right = startRect.x + startRect.width + deltaX;
  }

  // Clamp to container bounds
  top = Math.max(containerBounds.y, top);
  left = Math.max(containerBounds.x, left);
  right = Math.min(containerBounds.x + containerBounds.width, right);
  bottom = Math.min(containerBounds.y + containerBounds.height, bottom);

  // Enforce minimum size
  if (right - left < MIN_STENCIL_SIZE) {
    if (handle === "nw" || handle === "w" || handle === "sw") {
      left = right - MIN_STENCIL_SIZE;
    } else {
      right = left + MIN_STENCIL_SIZE;
    }
  }
  if (bottom - top < MIN_STENCIL_SIZE) {
    if (handle === "nw" || handle === "n" || handle === "ne") {
      top = bottom - MIN_STENCIL_SIZE;
    } else {
      bottom = top + MIN_STENCIL_SIZE;
    }
  }

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
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
  const [zoom, setZoom] = useState(1.0);
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
      setZoom(1.0);
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

  // === Computed: image rect with zoom applied ===
  const imageRect = useMemo(() => {
    if (!containerSize || !naturalSize) return null;
    const base = computeBaseImageRect(
      containerSize.width,
      containerSize.height,
      naturalSize.width,
      naturalSize.height,
    );
    const zoomedW = base.width * zoom;
    const zoomedH = base.height * zoom;
    return {
      x: (containerSize.width - zoomedW) / 2,
      y: (containerSize.height - zoomedH) / 2,
      width: zoomedW,
      height: zoomedH,
    };
  }, [containerSize, naturalSize, zoom]);

  // === Container bounds (for clamping stencil) ===
  const containerBounds = useMemo((): Rect | null => {
    if (!containerSize) return null;
    return { x: 0, y: 0, width: containerSize.width, height: containerSize.height };
  }, [containerSize]);

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
      setStencilRect(initStencilRect(imageRect));
    }
  }, [imageRect, stencilRect]);

  const handleImageError = useCallback(() => {
    log.error("Failed to load image");
    toast.error("Falha ao carregar a imagem para edição");
    setIsLoading(false);
  }, []);

  // === Zoom via mouse wheel (non-passive listener) ===
  useEffect(() => {
    if (!containerEl) return undefined;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
    };

    containerEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => containerEl.removeEventListener("wheel", handleWheel);
  }, [containerEl]);

  // === Mouse/Touch interaction for drag and resize ===
  useEffect(() => {
    if (!containerEl || !containerBounds) return undefined;

    const handlePointerMove = (clientX: number, clientY: number) => {
      const drag = dragRef.current;
      if (!drag || !stencilRect) return;

      const deltaX = clientX - drag.startMouseX;
      const deltaY = clientY - drag.startMouseY;

      if (drag.type === "move") {
        const newRect = clampRectMove(
          {
            ...drag.startRect,
            x: drag.startRect.x + deltaX,
            y: drag.startRect.y + deltaY,
          },
          containerBounds,
        );
        setStencilRect(newRect);
      } else if (drag.type === "resize" && drag.handle) {
        const newRect = computeResize(
          drag.handle,
          deltaX,
          deltaY,
          drag.startRect,
          containerBounds,
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
  }, [containerEl, containerBounds, stencilRect]);

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
            {/* Image: fixed, manually sized with zoom */}
            {imageUrl && imageRect && (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Imagem para edição"
                draggable={false}
                onLoad={handleImageLoad}
                onError={handleImageError}
                className="absolute pointer-events-none"
                style={{
                  left: imageRect.x,
                  top: imageRect.y,
                  width: imageRect.width,
                  height: imageRect.height,
                  opacity: naturalSize ? 1 : 0,
                }}
              />
            )}

            {/* Fallback img for initial load (before imageRect is computed) */}
            {imageUrl && !imageRect && (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Imagem para edição"
                draggable={false}
                onLoad={handleImageLoad}
                onError={handleImageError}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ objectFit: "contain", opacity: 0 }}
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
