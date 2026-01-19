/**
 * Reconcile Asaas - Type Definitions
 * 
 * @see RISE Protocol V3 - Modular type files
 */

export interface PendingOrder {
  id: string;
  vendor_id: string;
  product_id: string;
  gateway_payment_id: string;
  status: string;
  customer_email: string | null;
  customer_name: string | null;
}

export interface ReconcileResult {
  order_id: string;
  previous_status: string;
  new_status: string;
  action: 'updated' | 'skipped' | 'error';
  reason: string;
}

export interface AsaasCredentials {
  access_token: string;
  environment?: string;
}

export interface AsaasStatusResult {
  status: string;
  confirmedDate?: string;
}

export interface ReconcileRequestBody {
  orders: PendingOrder[];
}

export interface ReconcileSummary {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}
