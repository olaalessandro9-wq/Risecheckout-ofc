/**
 * Types for students-invite Edge Function
 * RISE V3 Compliant - Separated from router
 */

export interface JsonResponseData {
  valid?: boolean;
  reason?: string;
  redirect?: string;
  needsPasswordSetup?: boolean;
  buyer_id?: string;
  product_id?: string;
  product_name?: string;
  product_image?: string | null;
  buyer_email?: string;
  buyer_name?: string;
  success?: boolean;
  error?: string;
  sessionToken?: string;
  buyer?: { id: string; email: string; name: string | null };
  accessUrl?: string;
  is_new_buyer?: boolean;
  email_sent?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
}

export interface TokenData {
  id: string;
  buyer_id: string;
  product_id: string;
  is_used: boolean;
  expires_at: string;
}

export interface ProductData {
  id: string;
  name: string;
  image_url: string | null;
  members_area_enabled?: boolean;
  user_id?: string;
}

export interface InviteRequest {
  action: "validate-invite-token" | "use-invite-token" | "generate-purchase-access" | "invite";
  token?: string;
  password?: string;
  order_id?: string;
  customer_email?: string;
  product_id?: string;
  email?: string;
  name?: string;
  group_ids?: string[];
}
