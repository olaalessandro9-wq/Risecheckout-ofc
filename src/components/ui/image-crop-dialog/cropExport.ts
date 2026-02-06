/**
 * cropExport - Export de imagem baseado em stencilRect + imageRect
 *
 * Mapeia a posição do stencil no display para coordenadas na imagem original,
 * extrai a região correspondente e renderiza no canvas de output.
 *
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { createLogger } from "@/lib/logger";

const log = createLogger("cropExport");

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropExportParams {
  /** Elemento <img> já carregado com a imagem original */
  imageElement: HTMLImageElement;
  /** Retângulo do stencil no espaço do container (display coords) */
  stencilRect: Rect;
  /** Retângulo real que a imagem ocupa no container (display coords) */
  imageRect: Rect;
  /** Largura natural da imagem original */
  naturalWidth: number;
  /** Altura natural da imagem original */
  naturalHeight: number;
  /** Largura desejada do output final (px) */
  outputWidth: number;
  /** Altura desejada do output final (px) */
  outputHeight: number;
}

/**
 * Exporta a região do stencil como um arquivo PNG.
 *
 * Lógica:
 * 1. Calcula escala display → natural (naturalWidth / imageRect.width)
 * 2. Mapeia stencilRect para coordenadas na imagem original
 * 3. Desenha a região fonte no canvas de output (outputWidth × outputHeight)
 * 4. Converte para blob PNG → File
 */
export function exportCropToPng(params: CropExportParams): Promise<File> {
  const {
    imageElement,
    stencilRect,
    imageRect,
    naturalWidth,
    naturalHeight,
    outputWidth,
    outputHeight,
  } = params;

  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get 2d context from canvas"));
        return;
      }

      // Canvas começa transparente
      ctx.clearRect(0, 0, outputWidth, outputHeight);

      // Escala do display para coordenadas naturais da imagem
      const scaleX = naturalWidth / imageRect.width;
      const scaleY = naturalHeight / imageRect.height;

      // Posição do stencil relativa à imagem (não ao container)
      const sourceX = (stencilRect.x - imageRect.x) * scaleX;
      const sourceY = (stencilRect.y - imageRect.y) * scaleY;
      const sourceW = stencilRect.width * scaleX;
      const sourceH = stencilRect.height * scaleY;

      // Clamp para não ultrapassar os limites da imagem
      const clampedSourceX = Math.max(0, Math.min(sourceX, naturalWidth));
      const clampedSourceY = Math.max(0, Math.min(sourceY, naturalHeight));
      const clampedSourceW = Math.min(sourceW, naturalWidth - clampedSourceX);
      const clampedSourceH = Math.min(sourceH, naturalHeight - clampedSourceY);

      ctx.drawImage(
        imageElement,
        clampedSourceX,
        clampedSourceY,
        clampedSourceW,
        clampedSourceH,
        0,
        0,
        outputWidth,
        outputHeight,
      );

      log.info("Canvas rendered", {
        outputSize: `${outputWidth}x${outputHeight}`,
        source: `(${clampedSourceX.toFixed(1)}, ${clampedSourceY.toFixed(1)}) ${clampedSourceW.toFixed(1)}x${clampedSourceH.toFixed(1)}`,
      });

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create PNG blob from canvas"));
            return;
          }

          const file = new File(
            [blob],
            "cropped-image.png",
            { type: "image/png" },
          );

          resolve(file);
        },
        "image/png",
      );
    } catch (error) {
      log.error("Export failed", error);
      reject(error);
    }
  });
}
