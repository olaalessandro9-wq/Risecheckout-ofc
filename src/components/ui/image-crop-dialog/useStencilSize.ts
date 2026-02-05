/**
 * useStencilSize - Hook para cálculo responsivo do stencil fixo
 * 
 * Calcula o tamanho do stencil que cabe na boundary do cropper
 * mantendo a proporção (aspect ratio) do output desejado.
 * 
 * O stencil usa 90% da boundary como margem de segurança
 * para não "colar" nas bordas do dialog.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useCallback } from "react";
import type { CropperState } from "react-advanced-cropper";
import type { FixedCropperSettings } from "react-advanced-cropper";

/** Percentual da boundary que o stencil pode ocupar (margem de segurança) */
const BOUNDARY_USAGE = 0.9;

/**
 * Retorna uma função compatível com stencilSize do FixedCropper
 * que calcula o tamanho do stencil baseado no espaço disponível.
 * 
 * @param aspectRatio - Proporção desejada (largura / altura)
 * @returns Função (state, settings) => { width, height }
 */
export function useStencilSize(aspectRatio: number) {
  return useCallback(
    (state: CropperState, _settings: FixedCropperSettings) => {
      const { boundary } = state;

      // Espaço disponível com margem de segurança
      const availableWidth = boundary.width * BOUNDARY_USAGE;
      const availableHeight = boundary.height * BOUNDARY_USAGE;

      // Calcular stencil que cabe na boundary mantendo aspect ratio
      const scaleByWidth = availableWidth / aspectRatio;
      const scaleByHeight = availableHeight;

      let width: number;
      let height: number;

      if (scaleByWidth <= scaleByHeight) {
        // Limitado pela largura
        width = availableWidth;
        height = availableWidth / aspectRatio;
      } else {
        // Limitado pela altura
        height = availableHeight;
        width = availableHeight * aspectRatio;
      }

      return {
        width: Math.round(width),
        height: Math.round(height),
      };
    },
    [aspectRatio]
  );
}
