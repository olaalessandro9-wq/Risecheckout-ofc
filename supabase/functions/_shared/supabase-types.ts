/**
 * Supabase Types Centralizados
 * 
 * RISE Protocol: Tipagem rigorosa, zero `any`
 * 
 * Este arquivo centraliza todos os tipos relacionados ao Supabase Client
 * e interfaces de dados para garantir consistência em todos os handlers.
 */

// Re-export SupabaseClient para uso consistente
export { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// PRODUCER TYPES
// ============================================

export interface ProducerProfile {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  password_hash_version: number | null;
  is_active: boolean;
  last_login_at?: string | null;
  reset_token?: string | null;
  reset_token_expires_at?: string | null;
}

export interface ProducerSession {
  id: string;
  producer_id: string;
  session_token: string;
  expires_at: string;
  is_valid: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
  last_activity_at?: string | null;
}

export interface ProducerSessionWithProfile {
  id: string;
  expires_at: string;
  is_valid: boolean;
  producer: ProducerProfile | ProducerProfile[];
}

export interface UserRole {
  user_id: string;
  role: string;
}

// ============================================
// BUYER TYPES
// ============================================

export interface BuyerProfile {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  password_hash_version: number | null;
  is_active: boolean;
  phone?: string | null;
  last_login_at?: string | null;
  reset_token?: string | null;
  reset_token_expires_at?: string | null;
}

export interface BuyerSession {
  id: string;
  buyer_id: string;
  session_token: string;
  expires_at: string;
  is_valid: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
  last_activity_at?: string | null;
}

export interface BuyerSessionWithProfile {
  id: string;
  expires_at: string;
  is_valid: boolean;
  buyer: BuyerProfile | BuyerProfile[];
}

// ============================================
// PRODUCT TYPES
// ============================================

export interface Product {
  id: string;
  user_id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  price: number;
  status?: string;
  members_area_enabled?: boolean;
}

export interface ProductModule {
  id: string;
  product_id: string;
  name: string;
  description?: string | null;
  position: number;
  is_active?: boolean;
}

// ============================================
// COUPON TYPES
// ============================================

export interface Coupon {
  id: string;
  code: string;
  name?: string | null;
  description?: string | null;
  discount_type: string;
  discount_value: number;
  active?: boolean;
  start_date?: string | null;
  expires_at?: string | null;
  max_uses?: number | null;
  uses_count?: number | null;
  max_uses_per_customer?: number | null;
  apply_to_order_bumps?: boolean;
}

export interface CouponProduct {
  id: string;
  coupon_id: string;
  product_id: string;
}

// ============================================
// PIXEL TYPES
// ============================================

export interface Pixel {
  id: string;
  product_id: string;
  platform: string;
  pixel_id: string;
  enabled: boolean;
  fire_on_pix?: boolean;
  fire_on_card?: boolean;
  fire_on_boleto?: boolean;
  custom_value_pix?: number | null;
  custom_value_card?: number | null;
  custom_value_boleto?: number | null;
  domain?: string | null;
}

// ============================================
// VENDOR PROFILE TYPES
// ============================================

export interface VendorProfile {
  id: string;
  user_id: string;
  name: string;
  phone?: string | null;
  cpf_cnpj?: string | null;
}

// ============================================
// RATE LIMIT TYPES
// ============================================

export interface RateLimitRecord {
  id: string;
  identifier: string;
  action: string;
  attempts: number;
  first_attempt_at: string;
  last_attempt_at: string;
  blocked_until?: string | null;
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export interface ProducerAuditLog {
  id?: string;
  producer_id: string | null;
  action: string;
  success: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
  details?: Record<string, unknown>;
  created_at?: string;
}

export interface BuyerAuditLog {
  id?: string;
  buyer_id: string | null;
  action: string;
  success?: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
  details?: Record<string, unknown>;
  failure_reason?: string | null;
  created_at?: string;
}
