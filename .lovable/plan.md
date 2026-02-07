
# Fix: Consistent X-Axis Tick Distribution

## Root Cause Analysis

The function `selectEvenlySpaced` in `chartAxisUtils.ts` (line 81-94) uses a fractional step with `Math.round`, which creates **inconsistent gaps** between ticks:

```text
Example: 24 hourly items, maxTicks=13
step = 23/12 = 1.9167

Index 6: Math.round(11.5) = 12 -> 12:00
Index 7: Math.round(13.417) = 13 -> 13:00
Gap: 1 hour (all others are 2 hours) -- INCONSISTENT

Example: 30 daily items, maxTicks=13
step = 29/12 = 2.4167

Gaps alternate between 2 and 3 days -- INCONSISTENT
```

## Solution: Two-Pronged Fix

### Fix 1: Natural Hour Intervals for Hourly Data

Replace the generic `selectEvenlySpaced` approach for hourly data with **natural divisors of 24**: `[1, 2, 3, 4, 6, 8, 12]`.

Pick the smallest interval where the resulting tick count fits:

| maxTicks | Interval Chosen | Ticks Produced | Result |
|----------|----------------|----------------|--------|
| >= 24 | 1h | 24 | Every hour |
| >= 12 | 2h | 12 | 00h, 02h, 04h, ..., 22h |
| >= 8 | 3h | 8 | 00h, 03h, 06h, ..., 21h |
| >= 6 | 4h | 6 | 00h, 04h, 08h, ..., 20h |
| >= 4 | 6h | 4 | 00h, 06h, 12h, 18h |

This guarantees **perfectly uniform spacing** with no rounding artifacts.

For the user's screen (maxTicks=13 with old 80px; maxTicks=23 with new 45px):
- Before: 00h, 02h, 04h, 06h, 08h, 10h, **12h, 13h**, 15h, 17h, 19h, 21h, 23h (inconsistent)
- After: 00h, 01h, 02h, 03h, ..., 23h (every hour - all 24 fit at 45px each)

### Fix 2: Fixed Integer Step for Daily Data

Replace `selectEvenlySpaced` with a **fixed integer step** approach. Instead of a fractional step that rounds unevenly, always use `Math.ceil(length / maxTicks)` to get a consistent integer step.

```text
Example: 30 items, maxTicks=18 (at 55px per label)
step = ceil(30/18) = 2
Ticks: day 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28 = 15 ticks
ALL gaps are exactly 2 days -- CONSISTENT
```

Additionally, add a **tolerance threshold**: if `items.length <= maxTicks * 1.2`, show ALL items instead of skipping any (avoids removing just 1-2 items inconsistently).

### Fix 3: Accurate Label Width Estimates

Replace the fixed 80px with accurate estimates per format:

| Format | Example | Estimated Width (with gap) |
|--------|---------|---------------------------|
| Hour | "09h" | 45px |
| DD/MM | "15/01" | 50px |
| DD Mon | "8 Jan" | 55px |
| Mon/YY | "Jan/26" | 58px |

## Expected Results

| Period | Before | After |
|--------|--------|-------|
| Today (24h) | 00h 02h 04h...12h **13h** 15h...23h (uneven) | 00h 01h 02h...23h (all 24 hours) |
| Yesterday | Same uneven issue | Same fix -- all 24 hours |
| 7 days | Already correct | Remains correct |
| 30 days | 8 Jan 10 Jan **13 Jan** 15 Jan... (alternating 2/3 day gaps) | 8 Jan 10 Jan 12 Jan 14 Jan... (consistent 2-day gaps) |

## Technical Details

### File: `src/modules/dashboard/utils/chartAxisUtils.ts`

**1. Update `getMaxTicks`** to accept `estimatedLabelWidth` parameter:

```typescript
function getMaxTicks(chartWidth: number, estimatedLabelWidth: number = 55): number {
  if (chartWidth <= 0) return 6;
  return Math.max(4, Math.floor(chartWidth / estimatedLabelWidth));
}
```

**2. Replace `selectEvenlySpaced`** with fixed-integer-step logic + tolerance threshold:

```typescript
function selectWithConsistentStep(
  items: readonly string[],
  maxCount: number,
): string[] {
  // Tolerance: if items nearly fit (within 20%), show all
  if (items.length <= Math.ceil(maxCount * 1.2)) return [...items];

  // Use fixed integer step for consistent gaps
  const step = Math.ceil(items.length / maxCount);
  const result: string[] = [];

  for (let i = 0; i < items.length; i += step) {
    result.push(items[i]);
  }

  // Always include last item if not already included
  if (result[result.length - 1] !== items[items.length - 1]) {
    result.push(items[items.length - 1]);
  }

  return result;
}
```

**3. Replace `calculateHourlyTicks`** with natural-interval logic:

```typescript
const NATURAL_HOUR_INTERVALS = [1, 2, 3, 4, 6, 8, 12] as const;

function calculateHourlyTicks(data, chartWidth): XAxisConfig {
  const maxTicks = getMaxTicks(chartWidth, 45); // "09h" is ~45px
  const allDates = data.map(d => d.date);

  // Find smallest natural interval that fits
  let interval = 12;
  for (const candidate of NATURAL_HOUR_INTERVALS) {
    if (Math.ceil(allDates.length / candidate) <= maxTicks) {
      interval = candidate;
      break;
    }
  }

  // Generate ticks at natural intervals
  const ticks: string[] = [];
  for (let i = 0; i < allDates.length; i += interval) {
    ticks.push(allDates[i]);
  }

  return {
    ticks,
    formatter: (value) => `${value.split(":")[0]}h`,
  };
}
```

**4. Update `calculateDailyTicks`** to pass correct label width:

```typescript
function calculateDailyTicks(data, chartWidth): XAxisConfig {
  const count = data.length;
  let estimatedLabelWidth: number;
  if (count <= 14) estimatedLabelWidth = 50;       // "15/01"
  else if (count <= 62) estimatedLabelWidth = 55;   // "8 Jan"
  else estimatedLabelWidth = 58;                     // "Jan/26"

  const maxTicks = getMaxTicks(chartWidth, estimatedLabelWidth);
  const allDates = data.map(d => d.date);
  const ticks = selectWithConsistentStep(allDates, maxTicks);
  const formatter = getDailyFormatter(count);

  return { ticks, formatter };
}
```

## File Tree

```text
src/modules/dashboard/utils/
  chartAxisUtils.ts   -- EDIT (4 surgical changes, same file)
```

Single file edit. No new files.
