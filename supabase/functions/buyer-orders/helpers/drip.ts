/**
 * Drip/Release Calculation Helper
 * 
 * Calculates content lock status based on release settings.
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliance
 */

import type { ReleaseSettings, LockInfo } from "../types.ts";

/**
 * Calculate if content is locked based on release settings and purchase date.
 * 
 * @param contentId - ID of the content to check
 * @param releaseSettings - Map of content IDs to their release settings
 * @param purchaseDate - Date when buyer purchased the product (null for owners)
 * @param completedContentIds - Set of content IDs the buyer has completed
 * @returns Lock info with is_locked, unlock_date, and lock_reason
 */
export function calculateContentLock(
  contentId: string,
  releaseSettings: Map<string, ReleaseSettings>,
  purchaseDate: string | null,
  completedContentIds: Set<string>
): LockInfo {
  const settings = releaseSettings.get(contentId);

  // No settings or immediate = unlocked
  if (!settings || settings.release_type === "immediate") {
    return { is_locked: false, unlock_date: null, lock_reason: null };
  }

  const now = new Date();

  // Days after purchase
  if (settings.release_type === "days_after_purchase" && settings.days_after_purchase) {
    if (!purchaseDate) {
      // Owner/producer - always unlocked
      return { is_locked: false, unlock_date: null, lock_reason: null };
    }
    const purchase = new Date(purchaseDate);
    const unlockDate = new Date(purchase);
    unlockDate.setDate(unlockDate.getDate() + settings.days_after_purchase);

    if (now < unlockDate) {
      return {
        is_locked: true,
        unlock_date: unlockDate.toISOString(),
        lock_reason: "drip_days",
      };
    }
  }

  // Fixed date
  if (settings.release_type === "fixed_date" && settings.fixed_date) {
    const unlockDate = new Date(settings.fixed_date);
    if (now < unlockDate) {
      return {
        is_locked: true,
        unlock_date: unlockDate.toISOString(),
        lock_reason: "drip_date",
      };
    }
  }

  // After content completion
  if (settings.release_type === "after_content" && settings.after_content_id) {
    if (!completedContentIds.has(settings.after_content_id)) {
      return {
        is_locked: true,
        unlock_date: null,
        lock_reason: "drip_content",
      };
    }
  }

  return { is_locked: false, unlock_date: null, lock_reason: null };
}
