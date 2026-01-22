/**
 * webhook-crud Types
 * 
 * @version 3.1.0 - RISE Protocol V3 Compliant (Modularized)
 * @module webhook-crud/types
 */

// ============================================
// DATABASE ENTITIES
// ============================================

export interface WebhookRecord {
  id: string;
  vendor_id: string;
  name: string;
  url: string;
  events: string[];
  product_id: string | null;
  secret: string;
  active: boolean;
}

export interface WebhookWithProduct {
  id: string;
  name: string;
  url: string;
  events: string[];
  product_id: string | null;
  created_at: string;
  product?: { name: string } | null;
}

export interface WebhookLogEntry {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: unknown;
  response_status: number | null;
  response_body: string | null;
  success: boolean;
  created_at: string;
}

export interface WebhookOwnership {
  id: string;
  vendor_id: string;
}

// ============================================
// REQUEST/RESPONSE
// ============================================

export interface WebhookData {
  name: string;
  url: string;
  events: string[];
  product_ids?: string[];
}

export interface RequestBody {
  action: string;
  webhookId?: string;
  data?: WebhookData;
}

export interface JsonResponseData {
  success?: boolean;
  error?: string;
  webhook?: WebhookRecord;
  webhooks?: WebhookWithProduct[];
  products?: { id: string; name: string }[];
  productIds?: string[];
  deletedId?: string;
  logs?: WebhookLogEntry[];
}

// ============================================
// UPDATES
// ============================================

export interface WebhookUpdates {
  updated_at: string;
  name?: string;
  url?: string;
  events?: string[];
  product_id?: string | null;
}

// ============================================
// HANDLER CONTEXT
// ============================================

export interface HandlerContext {
  vendorId: string;
  corsHeaders: Record<string, string>;
}
