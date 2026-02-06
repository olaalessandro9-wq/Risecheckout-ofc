

# Fix: Center COORDINATES on Image (True Root Cause)

## Root Cause (Definitive - Verified in Library Source)

The current `useCenteredPostProcess` calculates:
```text
deltaY = imageCenterY - viewCenterY
```

After `fixedStencilAlgorithm` line 94, `visibleArea` is always re-centered on `coordinates`:
```text
visibleArea = applyMove(visibleArea, diff(center(coordinates), center(visibleArea)))
```

This means `center(visibleArea) = center(coordinates)`. If `coordinates` are already near the image center (which `defaultPosition` tries to do), then `deltaY` is near 0 and our centering has no effect.

However, `fixedStencilAlgorithm` line 97 then constrains coordinates within visibleArea bounds:
```text
coordinates = moveToPositionRestrictions(coordinates, 
  coordinatesToPositionRestrictions(visibleArea))
```

This can push `coordinates.top` toward 0 depending on visibleArea dimensions after scaling (line 87). The result: coordinates end up with `top = 0` or close to it, placing the image at the TOP of the stencil.

Our current code then checks `imageCenterY - viewCenterY`, but since line 94 already centered visibleArea on coordinates, this delta is ~0 and no correction happens.

## The Correct Formula

Instead of centering visibleArea on imageSize, we must center **coordinates** on imageSize:

```text
BEFORE (WRONG):
  deltaY = imageCenterY - viewCenterY    // always ~0 after fixedStencil

AFTER (CORRECT):
  coordsCenterY = coordinates.top + coordinates.height / 2
  deltaY = imageCenterY - coordsCenterY  // detects actual displacement
```

Then shift BOTH coordinates and visibleArea by this delta. This keeps them synchronized (stencil stays centered in viewport) while centering the image within the crop area.

## Analysis of Solutions (RISE V3 Section 4.4)

### Solution A: Center coordinates on imageSize in postProcess
- Maintainability: 10/10 - Pure math, single formula change
- Zero DT: 10/10 - Fixes the actual formula error at the root
- Architecture: 10/10 - Uses the correct reference (coordinates vs image, not visibleArea vs image)
- Scalability: 10/10 - Works for any image/stencil ratio combination
- Security: 10/10
- **FINAL SCORE: 10.0/10**

### Solution B: Skip fixedStencil entirely and write custom algorithm from scratch
- Maintainability: 6/10 - Must replicate all fixedStencil logic (scaling, constraints)
- Zero DT: 8/10 - Could miss edge cases that fixedStencil handles
- Architecture: 5/10 - Reinvents the wheel, fragile to library updates
- Scalability: 7/10 - May miss edge cases for unusual aspect ratios
- Security: 10/10
- **FINAL SCORE: 7.0/10**

### DECISION: Solution A (Score 10.0)
Solution B is inferior because it duplicates library logic that already works correctly. Solution A fixes the single mathematical error in the centering delta calculation.

## Planned Change

### File: `src/components/ui/image-crop-dialog/useCenteredPostProcess.ts`

**Single change: Fix the centering formula (lines 71-80)**

Before (compares image center vs VISIBLE AREA center -- always ~0):
```text
const imageCenterX = result.imageSize.width / 2;
const imageCenterY = result.imageSize.height / 2;
const viewCenterX = result.visibleArea.left + result.visibleArea.width / 2;
const viewCenterY = result.visibleArea.top + result.visibleArea.height / 2;

const deltaX = imageCenterX - viewCenterX;
const deltaY = imageCenterY - viewCenterY;
```

After (compares image center vs COORDINATES center -- detects actual displacement):
```text
const imageCenterX = result.imageSize.width / 2;
const imageCenterY = result.imageSize.height / 2;
const coordsCenterX = result.coordinates.left + result.coordinates.width / 2;
const coordsCenterY = result.coordinates.top + result.coordinates.height / 2;

const deltaX = imageCenterX - coordsCenterX;
const deltaY = imageCenterY - coordsCenterY;
```

No other changes needed. The rest of the function (shifting both coordinates and visibleArea by the delta) is correct.

## File Tree

```text
src/components/ui/image-crop-dialog/
  useCenteredPostProcess.ts  <- EDIT (change 4 lines in centering formula)
  ImageCropDialog.tsx        <- NO CHANGE
  ImageCropDialog.css        <- NO CHANGE
  useStencilSize.ts          <- NO CHANGE
  presets.ts                 <- NO CHANGE
  types.ts                   <- NO CHANGE
  index.ts                   <- NO CHANGE
```

## Why This Works (Concrete Example)

Image: 1920x800, Stencil: 16:9 (coordinates height = 1080)

After `fixedStencilAlgorithm` pushes coordinates to top:
- coordinates = { top: 0, height: 1080 }
- coordsCenterY = 0 + 1080/2 = 540
- imageCenterY = 800/2 = 400
- deltaY = 400 - 540 = -140

After applying delta:
- coordinates.top = 0 + (-140) = -140
- Image occupies 0 to 800 within coordinates range -140 to 940
- Space above image: 0 - (-140) = 140px
- Space below image: 940 - 800 = 140px
- CENTERED

## Quality Checkpoint (Section 7.2)

| Question | Answer |
|----------|--------|
| Is this the BEST solution possible? | Yes, fixes the single formula error |
| Is there a higher-scoring solution? | No |
| Does this create technical debt? | Zero |
| Will we need to "improve later"? | No |
| Does the code survive 10 years without refactoring? | Yes |
| Am I choosing this because it's faster? | No, because it's CORRECT |

