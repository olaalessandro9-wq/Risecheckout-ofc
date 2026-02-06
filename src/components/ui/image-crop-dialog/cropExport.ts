/**
 * cropExport - Export de imagem baseado em stencilRect + imageRect
 *
 * Mapeia a posição do stencil no display para coordenadas na imagem original,
 * calcula a INTERSEÇÃO entre o stencil e a imagem, e renderiza apenas
 * a parte da imagem que está sob o stencil. Áreas fora da imagem
 * permanecem transparentes (canal alpha PNG).
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
 * 1. Calcula a interseção entre stencilRect e imageRect (display coords)
 * 2. Se não há interseção → retorna PNG totalmente transparente
 * 3. Mapeia a interseção para coordenadas na imagem original (source)
 * 4. Mapeia a interseção para coordenadas no canvas de output (destination)
 * 5. Desenha apenas a parte intersectada → áreas fora ficam transparentes
 * 6. Converte para blob PNG → File
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

      // ── Interseção entre stencil e imagem (display coords) ──
      const intersectLeft = Math.max(stencilRect.x, imageRect.x);
      const intersectTop = Math.max(stencilRect.y, imageRect.y);
      const intersectRight = Math.min(
        stencilRect.x + stencilRect.width,
        imageRect.x + imageRect.width,
      );
      const intersectBottom = Math.min(
        stencilRect.y + stencilRect.height,
        imageRect.y + imageRect.height,
      );

      // Se não há interseção → PNG totalmente transparente
      if (intersectLeft >= intersectRight || intersectTop >= intersectBottom) {
        log.info("No intersection — exporting transparent PNG", {
          outputSize: `${outputWidth}x${outputHeight}`,
        });

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create PNG blob from canvas"));
              return;
            }
            resolve(new File([blob], "cropped-image.png", { type: "image/png" }));
          },
          "image/png",
        );
        return;
      }

      // ── Source: coordenadas na imagem original ──
      const scaleX = naturalWidth / imageRect.width;
      const scaleY = naturalHeight / imageRect.height;

      const sourceX = (intersectLeft - imageRect.x) * scaleX;
      const sourceY = (intersectTop - imageRect.y) * scaleY;
      const sourceW = (intersectRight - intersectLeft) * scaleX;
      const sourceH = (intersectBottom - intersectTop) * scaleY;

      // ── Destination: coordenadas no canvas de output ──
      const destScaleX = outputWidth / stencilRect.width;
      const destScaleY = outputHeight / stencilRect.height;

      const destX = (intersectLeft - stencilRect.x) * destScaleX;
      const destY = (intersectTop - stencilRect.y) * destScaleY;
      const destW = (intersectRight - intersectLeft) * destScaleX;
      const destH = (intersectBottom - intersectTop) * destScaleY;

      ctx.drawImage(
        imageElement,
        sourceX,
        sourceY,
        sourceW,
        sourceH,
        destX,
        destY,
        destW,
        destH,
      );

      log.info("Canvas rendered with intersection", {
        outputSize: `${outputWidth}x${outputHeight}`,
        source: `(${sourceX.toFixed(1)}, ${sourceY.toFixed(1)}) ${sourceW.toFixed(1)}x${sourceH.toFixed(1)}`,
        dest: `(${destX.toFixed(1)}, ${destY.toFixed(1)}) ${destW.toFixed(1)}x${destH.toFixed(1)}`,
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
