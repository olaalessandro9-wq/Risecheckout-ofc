/**
 * Crop Utilities - Cálculos inteligentes para recorte de imagem
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * @module members-area-builder/utils
 */

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropCalculation extends CropArea {
  /** True se imagem já está na proporção correta (dentro da tolerância) */
  isExactRatio: boolean;
  /** Mensagem descritiva sobre o status da proporção */
  ratioMessage: string;
}

/**
 * Calcula área de crop otimizada para uma imagem.
 * 
 * Comportamento:
 * - Se imagem já está na proporção correta → crop ocupa 100% (sem zoom desnecessário)
 * - Se não → maximiza área de crop mantendo a proporção desejada
 * 
 * @param imageWidth - Largura da imagem exibida (clientWidth)
 * @param imageHeight - Altura da imagem exibida (clientHeight)
 * @param targetRatio - Proporção desejada (ex: 16/9 = 1.777...)
 * @param tolerance - Tolerância percentual para considerar "proporção correta" (default: 2%)
 * @returns Cálculo completo do crop com posição, dimensões e status
 */
export function calculateOptimalCrop(
  imageWidth: number,
  imageHeight: number,
  targetRatio: number,
  tolerance: number = 0.02
): CropCalculation {
  // Evitar divisão por zero
  if (imageWidth <= 0 || imageHeight <= 0) {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      isExactRatio: false,
      ratioMessage: 'Dimensões inválidas',
    };
  }

  const currentRatio = imageWidth / imageHeight;
  const ratioDiff = Math.abs(currentRatio - targetRatio) / targetRatio;

  // Se já está na proporção correta (dentro da tolerância)
  if (ratioDiff <= tolerance) {
    return {
      x: 0,
      y: 0,
      width: imageWidth,
      height: imageHeight,
      isExactRatio: true,
      ratioMessage: 'Imagem já está na proporção correta!',
    };
  }

  // Calcular crop máximo mantendo proporção
  let cropWidth: number;
  let cropHeight: number;

  if (currentRatio > targetRatio) {
    // Imagem mais larga que o target - usar altura máxima
    cropHeight = imageHeight;
    cropWidth = cropHeight * targetRatio;
  } else {
    // Imagem mais alta que o target - usar largura máxima
    cropWidth = imageWidth;
    cropHeight = cropWidth / targetRatio;
  }

  // Garantir que não excede os limites da imagem
  if (cropWidth > imageWidth) {
    cropWidth = imageWidth;
    cropHeight = cropWidth / targetRatio;
  }
  if (cropHeight > imageHeight) {
    cropHeight = imageHeight;
    cropWidth = cropHeight * targetRatio;
  }

  // Centralizar a área de crop
  const x = (imageWidth - cropWidth) / 2;
  const y = (imageHeight - cropHeight) / 2;

  return {
    x,
    y,
    width: cropWidth,
    height: cropHeight,
    isExactRatio: false,
    ratioMessage: 'Ajuste a área de recorte conforme desejado',
  };
}

/**
 * Formata a proporção para exibição amigável
 * 
 * @param ratio - Valor numérico da proporção (ex: 1.777...)
 * @returns String formatada (ex: "16:9")
 */
export function formatRatioLabel(ratio: number): string {
  // Proporções conhecidas
  const knownRatios: Record<string, string> = {
    '1.778': '16:9',
    '1.777': '16:9',
    '0.667': '2:3',
    '0.666': '2:3',
    '1.333': '4:3',
    '1.000': '1:1',
    '2.400': '12:5',
    '2.333': '21:9',
  };

  const key = ratio.toFixed(3);
  return knownRatios[key] || `${ratio.toFixed(2)}:1`;
}

/**
 * Constantes de proporções comuns usadas no sistema
 */
export const ASPECT_RATIOS = {
  /** Banner / Header Hero - 16:9 */
  BANNER: 16 / 9,
  /** Thumbnail de módulo - 2:3 */
  MODULE_THUMBNAIL: 2 / 3,
  /** Hero largo - 12:5 */
  HERO_WIDE: 12 / 5,
  /** Quadrado - 1:1 */
  SQUARE: 1,
} as const;
