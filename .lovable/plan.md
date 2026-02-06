
# Fix: White Overlay on Legal Pages (CSS Root Cause)

## Root Cause Analysis

The white overlay covering text on individual legal pages is caused by a **CSS compositing issue** between `backdrop-blur` and the body background color.

### How the bug happens:

1. `body` has `bg-background` which in **light mode** resolves to `hsl(220 14% 96%)` (light gray)
2. The legal page wrapper uses `bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950` -- this sets CSS `background-image` but the element's `background-color` remains **transparent**
3. The content cards have `backdrop-blur-sm` which tells the browser to blur everything **behind** the element
4. Since the wrapper has transparent `background-color`, the `backdrop-filter` composites the body's light gray background through the gradient, creating a washed-out whitish overlay on every card

### Why the Legal Hub page works fine:

The Hub page (`/legal`) does NOT use `backdrop-blur` on its cards -- it only uses `bg-white/[0.03]` without blur, so the body background never bleeds through.

### Why the dev preview looks fine:

The dev preview runs in **dark mode** (body bg = `rgb(10, 10, 10)`), so even when backdrop-blur composites the body background, it's already dark. The published site runs in light mode where the body is light gray.

## Fix

**File:** `src/pages/legal/LegalPageLayout.tsx`

**Line 77** -- Add `bg-slate-950` to the page wrapper to set a solid, opaque `background-color`. This ensures the body's light background cannot bleed through the backdrop-filter:

```
// BEFORE
<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

// AFTER
<div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
```

`bg-slate-950` sets `background-color` (opaque dark). `bg-gradient-to-br` sets `background-image` (gradient on top). Both CSS properties coexist -- no conflict.

The `backdrop-blur-sm` on cards will continue working correctly because it will now only blur the dark gradient, not the light body background underneath.

**Line 79** -- Same fix for the sticky header which uses `bg-slate-950/80 backdrop-blur-xl`. Change to `bg-slate-950 backdrop-blur-xl` to ensure full opacity:

```
// BEFORE
<header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30">

// AFTER
<header className="border-b border-white/5 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-30">
```

The header uses 80% opacity + blur for a glassmorphic effect. Bumping to 90% maintains the visual effect while preventing light body bleed-through.

## Summary

| Action | File | Change |
|--------|------|--------|
| EDIT | `src/pages/legal/LegalPageLayout.tsx` (line 77) | Add `bg-slate-950` to page wrapper |
| EDIT | `src/pages/legal/LegalPageLayout.tsx` (line 79) | Bump header opacity from 80% to 90% |

This is a 2-line fix that addresses the architectural root cause (transparent background-color + backdrop-filter compositing against a light body).
