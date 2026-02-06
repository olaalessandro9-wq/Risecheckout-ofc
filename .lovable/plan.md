

# Fix: Image Centering via Custom PostProcess (Root Cause Resolution)

## Root Cause (Definitive)

The `fixedStencilAlgorithm` (line 97 of `advanced-cropper/extensions/stencil-size/index.js`) applies this constraint on EVERY state update:

```text
coordinates = moveToPositionRestrictions(coordinates, 
  coordinatesToPositionRestrictions(visibleArea))
```

This forces `coordinates.top >= visibleArea.top`. After scaling, `visibleArea.top = 0`. So `coordinates.top >= 0` always.

When the image is shorter than the stencil (e.g., image 1920x600 in a 16:9 stencil needing 1080px height), centering requires `coordinates.top = 600/2 - 1080/2 = -240`. But the constraint snaps it to `coordinates.top = 0`, placing the image at the TOP of the stencil.

Additionally, `autoReconcileState` runs on EVERY render via a `useLayoutEffect` with no dependency array. It calls `reconcileState()` which triggers `fixedStencilAlgorithm` with `immediately: true`. This means ANY `setState` fix in `onReady` gets immediately UNDONE on the next render.

**This is why ALL previous attempts failed** -- no matter what we do in `onReady`, the auto-reconcile reverts it on the very next render cycle.

## Solution: Custom PostProcess Function

Instead of fighting the library AFTER initialization, we integrate centering INTO the library's own pipeline by providing a custom `postProcess` prop that wraps the standard `fixedStencil` and adds image centering.

This approach works because:
1. `postProcess` runs on EVERY state change (initialization, zoom, reconcile)
2. Centering is maintained automatically -- no timing issues, no race conditions
3. FixedCropper allows overriding `postProcess` via props (confirmed in source code)

## Analysis of Solutions (RISE V3 Section 4.4)

### Solution A: Custom postProcess wrapping fixedStencil + centering
- Maintainability: 10/10 - Uses library's own extension point (postProcess prop)
- Zero DT: 10/10 - Centering is part of the rendering pipeline, not a hack
- Architecture: 10/10 - Composes with fixedStencil instead of replacing it
- Scalability: 10/10 - Works with any image ratio, any preset, any zoom level
- Security: 10/10
- **FINAL SCORE: 10.0/10**

### Solution B: autoReconcileState={false} + setState in onReady
- Maintainability: 6/10 - Disabling reconcile may cause edge case bugs
- Zero DT: 7/10 - Zoom interactions might break centering after zoom ends
- Architecture: 5/10 - Disabling a core library feature is risky
- Scalability: 6/10 - Window resize would not be handled correctly
- Security: 10/10
- **FINAL SCORE: 6.6/10**

### Solution C: Custom defaultPosition + defaultCoordinates props
- Maintainability: 7/10 - Only affects initialization, not ongoing interactions
- Zero DT: 6/10 - Zoom would undo centering (fixedStencilAlgorithm runs after zoom)
- Architecture: 7/10 - Correct entry point but doesn't persist through reconciliation
- Scalability: 7/10 - Zoom + reconcile = back to top
- Security: 10/10
- **FINAL SCORE: 7.2/10**

### DECISION: Solution A (Score 10.0)
Solutions B and C are inferior because they don't survive reconciliation cycles. Solution A integrates directly into the state pipeline, ensuring centering persists through ALL state changes (init, zoom, resize, reconcile).

## Planned Changes

### File: `src/components/ui/image-crop-dialog/ImageCropDialog.tsx`

**Change 1: Add imports for library postProcess utilities**

Add imports for `fixedStencil` and `getTransformedImageSize` from the library.

**Change 2: Create custom postProcess function**

A `useMemo`/`useCallback` hook that wraps `fixedStencil`:

```text
1. Run standard fixedStencil(state, settings, action)
2. If action is not immediate, return result unchanged
3. Calculate image center vs visibleArea center
4. Shift BOTH visibleArea and coordinates by the delta
5. This keeps the stencil centered in the viewport AND the image centered in the stencil
```

This runs automatically on every state change, so centering is always maintained -- during initialization, after zoom, after reconciliation.

**Change 3: Pass postProcess prop to FixedCropper**

Add `postProcess={centeredPostProcess}` to the FixedCropper component. Since FixedCropper spreads user props AFTER its default `postProcess: fixedStencil`, our prop overrides it.

**Change 4: Remove onReady centering hack**

The entire `handleReady` logic for centering becomes unnecessary. Simplify it to just `setIsImageLoaded(true)`.

**Change 5: Clean up unused imports**

Remove any imports that were only used by the old centering logic.

## File Tree

```text
src/components/ui/image-crop-dialog/
  ImageCropDialog.tsx      <- EDIT (replace onReady hack with postProcess)
  ImageCropDialog.css      <- NO CHANGE
  useStencilSize.ts        <- NO CHANGE
  presets.ts               <- NO CHANGE
  types.ts                 <- NO CHANGE
  index.ts                 <- NO CHANGE
```

## Quality Checkpoint (Section 7.2)

| Question | Answer |
|----------|--------|
| Is this the BEST solution possible? | Yes, it integrates into the library's own pipeline |
| Is there a higher-scoring solution? | No |
| Does this create technical debt? | Zero |
| Will we need to "improve later"? | No |
| Does the code survive 10 years without refactoring? | Yes |
| Am I choosing this because it's faster? | No, because it's CORRECT |

## Validation Criteria

1. Open crop dialog with banner 16:9 -- image CENTERED vertically
2. Open with square image in 16:9 stencil -- image centered both axes
3. Open with image that exactly matches stencil ratio -- no offset (delta=0)
4. Zoom in via scroll -- image stays centered
5. Zoom out via scroll -- image stays centered
6. Image drag -- still disabled (fixed)
7. Save PNG -- produces correct output
8. File stays under 300 lines

