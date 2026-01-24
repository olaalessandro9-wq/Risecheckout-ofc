/**
 * buyer-orders Types
 * 
 * Shared interfaces for the buyer-orders Edge Function.
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliance
 */

// ============================================
// BUYER DATA INTERFACES
// ============================================

export interface BuyerData {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
}

export interface BuyerSession {
  id: string;
  expires_at: string;
  is_valid: boolean;
  buyer: BuyerData | BuyerData[];
}

// ============================================
// CONTENT INTERFACES
// ============================================

export interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
  body: string | null;
  content_data: Record<string, unknown> | null;
  position: number;
  is_active: boolean;
}

export interface ModuleWithContents {
  id: string;
  title: string;
  description: string | null;
  position: number;
  is_active: boolean;
  cover_image_url: string | null;
  contents: ContentItem[];
}

export interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
}

export interface AttachmentRecord {
  id: string;
  content_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  position: number | null;
}

// ============================================
// DRIP/RELEASE INTERFACES (RISE V3)
// ============================================

export interface ReleaseSettings {
  content_id: string;
  release_type: "immediate" | "days_after_purchase" | "fixed_date" | "after_content";
  days_after_purchase: number | null;
  fixed_date: string | null;
  after_content_id: string | null;
}

export interface ContentWithLock extends ContentItem {
  is_locked: boolean;
  unlock_date: string | null;
  lock_reason: "drip_days" | "drip_date" | "drip_content" | null;
}

export type LockInfo = {
  is_locked: boolean;
  unlock_date: string | null;
  lock_reason: ContentWithLock["lock_reason"];
};

// ============================================
// PRODUCT INTERFACES
// ============================================

export interface ProductData {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  members_area_enabled: boolean;
  members_area_settings: Record<string, unknown> | null;
}

export interface OwnProductRow {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  members_area_enabled: boolean;
  user_id: string;
}

export interface AccessItem {
  id: string;
  product_id: string;
  granted_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  access_type: string;
  product: OwnProductRow;
}
