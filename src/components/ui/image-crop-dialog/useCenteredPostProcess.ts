/**
 * useCenteredPostProcess - Custom postProcess for FixedCropper
 * 
 * Wraps the library's `fixedStencil` postProcess to ensure the image
 * is always centered in the viewport (visibleArea center = image center).
 * 
 * WHY THIS EXISTS:
 * The default `fixedStencilAlgorithm` places coordinates at the top of the
 * image and centers visibleArea on those coordinates (line 94 of the lib).
 * Additionally, `autoReconcileState` re-runs fixedStencilAlgorithm on every
 * render with `immediately: true`, undoing any centering applied via onReady
 * or setState. By integrating centering INTO the postProcess pipeline, we
 * guarantee centering survives all reconciliation cycles.
 * 
 * HOW IT WORKS:
 * 1. Delegates to `fixedStencil` for all standard FixedCropper logic
 * 2. After fixedStencil produces its result, calculates the delta between
 *    the image center and the visibleArea center
 * 3. Shifts BOTH visibleArea and coordinates by this delta, keeping the
 *    stencil centered in the viewport while centering the image
 * 
 * This only runs for `immediately: true` actions (settled states), matching
 * the same guard used by `fixedStencil` itself.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useCallback } from "react";
import type { CropperState } from "react-advanced-cropper";
import type { FixedCropperSettings } from "react-advanced-cropper";
import { fixedStencil } from "advanced-cropper/extensions/stencil-size";

/** Tolerance in pixels below which centering is considered correct */
const CENTERING_TOLERANCE = 1;

interface PostprocessAction {
  name?: string;
  immediately?: boolean;
  transitions?: boolean;
  interaction?: boolean;
}

/**
 * Returns a stable postProcess function that wraps fixedStencil
 * and ensures the image is centered in the viewport.
 * 
 * Usage: `<FixedCropper postProcess={centeredPostProcess} />`
 */
export function useCenteredPostProcess() {
  return useCallback(
    (
      state: CropperState,
      settings: FixedCropperSettings,
      action: PostprocessAction,
    ): CropperState => {
      // 1. Delegate to the standard fixedStencil for all FixedCropper logic
      //    Cast settings to satisfy the library's internal type which extends CoreSettings
      //    FixedCropperSettings is a superset at runtime but TypeScript can't verify it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = fixedStencil(state, settings as any, action as any);

      // 2. Only center for immediate (settled) actions
      //    Non-immediate actions are intermediate animation states
      if (!action?.immediately) return result;

      // 3. Guard: skip if state is not fully initialized
      if (!result.coordinates || !result.visibleArea || !result.imageSize) {
        return result;
      }

      // 4. Calculate delta to center image in viewport
      const imageCenterX = result.imageSize.width / 2;
      const imageCenterY = result.imageSize.height / 2;
      const coordsCenterX =
        result.coordinates.left + result.coordinates.width / 2;
      const coordsCenterY =
        result.coordinates.top + result.coordinates.height / 2;

      const deltaX = imageCenterX - coordsCenterX;
      const deltaY = imageCenterY - coordsCenterY;

      // 5. Skip if already centered (avoid unnecessary state churn)
      if (
        Math.abs(deltaX) < CENTERING_TOLERANCE &&
        Math.abs(deltaY) < CENTERING_TOLERANCE
      ) {
        return result;
      }

      // 6. Shift BOTH visibleArea and coordinates by the same delta
      //    This keeps coordinates centered in visibleArea (stencil position)
      //    while centering the image in the viewport
      return {
        ...result,
        coordinates: {
          ...result.coordinates,
          left: result.coordinates.left + deltaX,
          top: result.coordinates.top + deltaY,
        },
        visibleArea: {
          ...result.visibleArea,
          left: result.visibleArea.left + deltaX,
          top: result.visibleArea.top + deltaY,
        },
      };
    },
    [],
  );
}
