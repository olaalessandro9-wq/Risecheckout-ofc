/**
 * Shared Types & Mock Data for members-area-drip Tests
 * 
 * @module members-area-drip/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
// ============================================================================

export type ReleaseType = "immediate" | "days_after_purchase" | "fixed_date" | "after_content";
export type DripAction = "get-settings" | "update-settings" | "check-access" | "unlock-content";

export interface DripSettings {
  release_type: ReleaseType;
  days_after_purchase?: number;
  fixed_date?: string;
  after_content_id?: string;
}

export interface DripRequest {
  action: DripAction;
  content_id?: string;
  product_id?: string;
  buyer_id?: string;
  settings?: DripSettings;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface AccessCheckResult {
  has_access: boolean;
  reason?: string;
  release_date?: string;
}

export interface DripSettingsUpsert {
  content_id: string;
  release_type: ReleaseType;
  days_after_purchase: number | null;
  fixed_date: string | null;
  after_content_id: string | null;
}

export interface DripAccessContext {
  settings: DripSettings | null;
  contentAccess: { is_active: boolean; expires_at: string | null } | null;
  purchaseDate: string | null;
  prerequisiteCompleted: string | null;
  now: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isValidReleaseType(type: string): type is ReleaseType {
  return ["immediate", "days_after_purchase", "fixed_date", "after_content"].includes(type);
}

export function validateDripRequest(body: DripRequest): ValidationResult {
  const { action, content_id, buyer_id, settings } = body;
  
  switch (action) {
    case "get-settings":
      if (!content_id) {
        return { valid: false, error: "content_id required" };
      }
      break;
    case "update-settings":
      if (!content_id || !settings) {
        return { valid: false, error: "content_id and settings required" };
      }
      break;
    case "check-access":
    case "unlock-content":
      if (!content_id || !buyer_id) {
        return { valid: false, error: "content_id and buyer_id required" };
      }
      break;
  }
  
  return { valid: true };
}

export function checkDaysAfterPurchase(
  purchaseDate: Date,
  daysAfter: number,
  now: Date
): AccessCheckResult {
  const releaseDate = new Date(purchaseDate);
  releaseDate.setDate(releaseDate.getDate() + daysAfter);
  
  if (now >= releaseDate) {
    return { has_access: true };
  }
  
  return {
    has_access: false,
    reason: "not_yet_released",
    release_date: releaseDate.toISOString(),
  };
}

export function checkFixedDate(fixedDate: Date, now: Date): AccessCheckResult {
  if (now >= fixedDate) {
    return { has_access: true };
  }
  
  return {
    has_access: false,
    reason: "not_yet_released",
    release_date: fixedDate.toISOString(),
  };
}

export function checkAfterContent(prerequisiteCompletedAt: string | null): AccessCheckResult {
  if (prerequisiteCompletedAt) {
    return { has_access: true };
  }
  
  return {
    has_access: false,
    reason: "prerequisite_not_completed",
  };
}

export function prepareDripUpsert(contentId: string, settings: DripSettings): DripSettingsUpsert {
  return {
    content_id: contentId,
    release_type: settings.release_type,
    days_after_purchase: settings.release_type === "days_after_purchase" 
      ? (settings.days_after_purchase || null) 
      : null,
    fixed_date: settings.release_type === "fixed_date" 
      ? (settings.fixed_date || null) 
      : null,
    after_content_id: settings.release_type === "after_content" 
      ? (settings.after_content_id || null) 
      : null,
  };
}

export function shouldDeleteSettings(releaseType: ReleaseType): boolean {
  return releaseType === "immediate";
}

export function checkContentAccess(ctx: DripAccessContext): AccessCheckResult {
  if (!ctx.settings || ctx.settings.release_type === "immediate") {
    return { has_access: true };
  }
  
  if (ctx.contentAccess?.is_active) {
    if (!ctx.contentAccess.expires_at || new Date(ctx.contentAccess.expires_at) > ctx.now) {
      return { has_access: true };
    }
  }
  
  if (!ctx.purchaseDate) {
    return { has_access: false, reason: "no_product_access" };
  }
  
  const purchaseDate = new Date(ctx.purchaseDate);
  
  switch (ctx.settings.release_type) {
    case "days_after_purchase":
      return checkDaysAfterPurchase(purchaseDate, ctx.settings.days_after_purchase || 0, ctx.now);
    case "fixed_date":
      return checkFixedDate(new Date(ctx.settings.fixed_date!), ctx.now);
    case "after_content":
      return checkAfterContent(ctx.prerequisiteCompleted);
    default:
      return { has_access: false };
  }
}

export function requiresProducerAuth(action: DripAction): boolean {
  return action === "get-settings" || action === "update-settings";
}

export function requiresNoAuth(action: DripAction): boolean {
  return action === "check-access" || action === "unlock-content";
}
