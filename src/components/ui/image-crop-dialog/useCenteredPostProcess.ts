/**
 * useCenteredPostProcess - Algoritmo customizado para FixedCropper
 *
 * Substitui completamente o `fixedStencilAlgorithm` da biblioteca
 * `advanced-cropper` para garantir que a imagem sempre apareça
 * centralizada no viewport.
 *
 * CAUSA RAIZ DO PROBLEMA:
 * O `fixedStencilAlgorithm` original (linha 97 do source) executa:
 *   coordinates = moveToPositionRestrictions(coordinates,
 *     mergePositionRestrictions(
 *       coordinatesToPositionRestrictions(visibleArea),
 *       getAreaPositionRestrictions(result, settings)
 *     ))
 *
 * Isso OBRIGA as coordinates a ficarem dentro da visibleArea.
 * Quando a imagem tem proporção diferente do stencil, a visibleArea
 * após o scaling fica com dimensões incompatíveis, empurrando as
 * coordinates para o topo/esquerda.
 *
 * SOLUÇÃO:
 * Reimplementar o algoritmo usando os mesmos utilitários da biblioteca,
 * mas substituindo a linha 97 por centralização explícita na imagem.
 * As coordinates são posicionadas no centro da imagem (imageSize/2),
 * e a visibleArea é centralizada sobre elas.
 *
 * O algoritmo preserva:
 * - Scaling da visibleArea proporcional ao stencil (linha 87 original)
 * - Restrições de tamanho da área (linhas 89-92 original)
 * - Centralização da visibleArea nas coordinates (linha 94 original)
 * - Restrições de posição da área (linha 96 original)
 *
 * Mas REMOVE a restrição que empurra coordinates para dentro da
 * visibleArea (linha 97 original), substituindo por centralização.
 */

import { useCallback } from "react";
import type { CropperState } from "react-advanced-cropper";
import type { FixedCropperSettings } from "react-advanced-cropper";

// Utilitários matemáticos da biblioteca (service/utils.js)
import {
  applyScale,
  fitToSizeRestrictions,
  applyMove,
  diff,
  getCenter,
  moveToPositionRestrictions,
} from "advanced-cropper/service/utils.js";

// Helpers da biblioteca (service/helpers.js)
import {
  getAreaSizeRestrictions,
  getAreaPositionRestrictions,
  isInitializedState,
} from "advanced-cropper/service/helpers.js";

// Estado imutável (state/copyState.js)
import { copyState } from "advanced-cropper/state/copyState.js";

// Extensão stencil-size (extensions/stencil-size/index.js)
import { getStencilSize } from "advanced-cropper/extensions/stencil-size";

interface PostprocessAction {
  name?: string;
  immediately?: boolean;
  transitions?: boolean;
  interaction?: boolean;
}

/**
 * Algoritmo customizado que replica fixedStencilAlgorithm
 * mas centraliza as coordinates na imagem em vez de
 * constraintá-las dentro da visibleArea.
 *
 * Fluxo:
 * 1. Copia estado (imutabilidade)
 * 2. Calcula stencilSize
 * 3. Redimensiona visibleArea (proporcional ao stencil/boundary)
 * 4. Aplica restrições de tamanho
 * 5. CENTRALIZA coordinates na imagem ← O FIX
 * 6. Centraliza visibleArea nas coordinates
 * 7. Aplica restrições de posição da área
 */
function centeredFixedStencilAlgorithm(
  state: CropperState,
  settings: FixedCropperSettings,
): CropperState {
  if (!isInitializedState(state)) {
    return state;
  }

  const result = copyState(state);

  // Passo 1: Calcular stencilSize (identico à linha 85 original)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stencil = getStencilSize(state, settings as any);

  // Passo 2: Redimensionar visibleArea (identico à linha 87 original)
  // Scale = (coordsWidth * boundaryWidth) / (visibleAreaWidth * stencilWidth)
  result.visibleArea = applyScale(
    result.visibleArea,
    (result.coordinates.width * result.boundary.width) /
      (result.visibleArea.width * stencil.width),
  );

  // Passo 3: Verificar restrições de tamanho (identico às linhas 89-92 original)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scale = fitToSizeRestrictions(
    result.visibleArea,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAreaSizeRestrictions(result, settings as any),
  );
  if (scale !== 1) {
    result.visibleArea = applyScale(result.visibleArea, scale);
    result.coordinates = applyScale(result.coordinates, scale);
  }

  // Passo 4: ★ CENTRALIZAR coordinates na imagem ★
  // ESTE É O FIX - em vez de constraintar dentro da visibleArea
  // (que é o que a linha 97 original faz e causa o bug),
  // posicionamos as coordinates no centro exato da imagem.
  result.coordinates = {
    ...result.coordinates,
    left: result.imageSize.width / 2 - result.coordinates.width / 2,
    top: result.imageSize.height / 2 - result.coordinates.height / 2,
  };

  // Passo 5: Centralizar visibleArea nas coordinates (identico à linha 94 original)
  result.visibleArea = applyMove(
    result.visibleArea,
    diff(getCenter(result.coordinates), getCenter(result.visibleArea)),
  );

  // Passo 6: Aplicar restrições de posição da área (identico à linha 96 original)
  result.visibleArea = moveToPositionRestrictions(
    result.visibleArea,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAreaPositionRestrictions(result, settings as any),
  );

  // NÃO aplicamos moveToPositionRestrictions nas coordinates
  // (que era a linha 97 original - a causa raiz do bug)
  // As coordinates ficam centradas na imagem, e a visibleArea
  // se ajusta ao redor delas.

  return result;
}

/**
 * Hook que retorna a função postProcess para o FixedCropper.
 *
 * Substitui completamente o `fixedStencil` da biblioteca.
 * Só executa para ações `immediately: true` (estados settled),
 * o mesmo guard usado pelo `fixedStencil` original.
 *
 * Uso: `<FixedCropper postProcess={centeredPostProcess} />`
 */
export function useCenteredPostProcess() {
  return useCallback(
    (
      state: CropperState,
      settings: FixedCropperSettings,
      action: PostprocessAction,
    ): CropperState => {
      // Só processar ações settled (identico ao guard do fixedStencil original)
      if (!action?.immediately) {
        return state;
      }

      return centeredFixedStencilAlgorithm(state, settings);
    },
    [],
  );
}
