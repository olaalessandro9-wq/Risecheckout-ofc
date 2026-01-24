/**
 * Validation Types - RISE V3 Modular
 * 
 * Tipos e interfaces para validação de pagamentos.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface ValidateOrderAmountInput {
  supabase: SupabaseClient;
  orderId: string;
  expectedAmountCents: number;
  gateway: string;
  clientIp?: string;
}

export interface OrderRecord {
  id: string;
  amount_cents: number;
  status: string;
  vendor_id: string;
  product_id: string;
  customer_email: string;
}

export interface ValidationResult {
  valid: boolean;
  order?: OrderRecord;
  error?: string;
  errorCode?: number;
}

export interface CustomerData {
  name: string;
  email: string;
  document?: string;
  phone?: string;
}

export interface CustomerValidationResult {
  valid: boolean;
  sanitizedData?: CustomerData;
  errors?: string[];
}

export interface SecurityViolation {
  type: "price_tampering" | "order_not_found" | "order_status_invalid" | "validation_failed";
  orderId: string;
  gateway: string;
  expectedAmount?: number;
  actualAmount?: number;
  clientIp?: string;
  details?: string;
}
