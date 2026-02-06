/**
 * cropExport - Função pura de exportação de imagem cropada para PNG
 * 
 * Recebe a imagem original, as dimensões do stencil e do output,
 * e o nível de zoom. Retorna um File PNG com a imagem centralizada
 * no canvas de output, preservando transparência nas áreas vazias.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { createLogger } from "@/lib/logger";

const log = createLogger("cropExport");

export interface CropExportParams {
  /** Elemento <img> já carregado com a imagem original */
  imageElement: HTMLImageElement;
  /** Largura do stencil no display (px) */
  stencilDisplayWidth: number;
  /** Altura do stencil no display (px) */
  stencilDisplayHeight: number;
  /** Largura da imagem no display (px, já com zoom aplicado) */
  imageDisplayWidth: number;
  /** Altura da imagem no display (px, já com zoom aplicado) */
  imageDisplayHeight: number;
  /** Largura desejada do output final (px) */
  outputWidth: number;
  /** Altura desejada do output final (px) */
  outputHeight: number;
}

/**
 * Exporta a região visível do crop como um arquivo PNG.
 * 
 * Lógica:
 * 1. Cria canvas com outputWidth × outputHeight
 * 2. Calcula a escala entre o stencil no display e o output
 * 3. Centraliza a imagem no canvas usando a mesma lógica de CSS centering
 * 4. Desenha a imagem com drawImage (source region = imagem inteira)
 * 5. Converte para blob PNG → File
 * 
 * A centralização no canvas espelha EXATAMENTE a centralização CSS:
 * drawX = (outputWidth - scaledImageWidth) / 2
 * drawY = (outputHeight - scaledImageHeight) / 2
 */
export function exportCropToPng(params: CropExportParams): Promise<File> {
  const {
    imageElement,
    stencilDisplayWidth,
    stencilDisplayHeight,
    imageDisplayWidth,
    imageDisplayHeight,
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

      // Canvas começa transparente (PNG preserva transparência)
      ctx.clearRect(0, 0, outputWidth, outputHeight);

      // Escala do display → output
      const scaleX = outputWidth / stencilDisplayWidth;
      const scaleY = outputHeight / stencilDisplayHeight;

      // Tamanho da imagem no espaço do output
      const drawWidth = imageDisplayWidth * scaleX;
      const drawHeight = imageDisplayHeight * scaleY;

      // Centralizar imagem no canvas (espelha CSS centering)
      const drawX = (outputWidth - drawWidth) / 2;
      const drawY = (outputHeight - drawHeight) / 2;

      ctx.drawImage(
        imageElement,
        0, 0, imageElement.naturalWidth, imageElement.naturalHeight,
        drawX, drawY, drawWidth, drawHeight,
      );

      log.info("Canvas rendered", {
        outputSize: `${outputWidth}x${outputHeight}`,
        drawPosition: `(${drawX.toFixed(1)}, ${drawY.toFixed(1)})`,
        drawSize: `${drawWidth.toFixed(1)}x${drawHeight.toFixed(1)}`,
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
