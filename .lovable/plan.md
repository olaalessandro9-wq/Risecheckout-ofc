
# Fix: Gradient Not Covering Full Page Below Sections

## Root Cause Analysis

The DOM hierarchy in `CourseHome.tsx` reveals the problem:

```text
MembersAreaThemeProvider (min-h-screen bg-background dark)
  div.flex.min-h-screen
    BuyerSidebar
    main.flex-1.overflow-x-hidden        <-- NO contentStyle
      div (back button)
      div.flex.flex-col style={contentStyle}   <-- contentStyle HERE (sections only)
        FixedHeader
        Banner
        Modules
      div.h-16.lg:h-8                    <-- spacer WITHOUT contentStyle
    BuyerMobileNav
```

The `contentStyle` (which sets `backgroundColor`, `--background`, and `backgroundImage`) is applied ONLY to the inner `div.flex.flex-col` that wraps the sections. Everything outside that div -- the spacer, any remaining viewport space below the sections -- shows the default theme `bg-background` (dark theme black), NOT the custom gradient color.

This is why there's a strip at the bottom without gradient: the `main` element fills the remaining viewport via `flex-1`, but has no custom background.

In `BuilderCanvas.tsx`, this works correctly because `contentStyle` is applied to the outermost container (line 181 for desktop, line 84 for mobile), covering everything.

## Solution

### Single File: `src/modules/members-area/pages/buyer/CourseHome.tsx`

Move `style={contentStyle}` from the inner sections div (line 205) to the `main` element (line 187).

**Before:**
```text
<main className="flex-1 overflow-x-hidden ...">
  ...
  <div className="flex flex-col" style={contentStyle}>
    {sections.map(...)}
  </div>
  <div className="h-16 lg:h-8" />
</main>
```

**After:**
```text
<main className="flex-1 overflow-x-hidden ..." style={contentStyle}>
  ...
  <div className="flex flex-col">
    {sections.map(...)}
  </div>
  <div className="h-16 lg:h-8" />
</main>
```

This ensures `backgroundColor` and `--background` cover the ENTIRE `main` area, including:
- The sections themselves
- The spacer below sections
- Any remaining viewport space if sections don't fill the page

The bridge gradient (`backgroundImage`) at 0-120px from the top of `main` is harmless -- it sits behind the header section (which is 384-800px tall) and is never visible.

No other files need changes. The architecture (SSOT, gradient math, builder canvas) is already correct.
