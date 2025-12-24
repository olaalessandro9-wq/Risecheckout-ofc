/**
 * Type definitions for oauth_states table
 * This is needed because the table was created via migration but types.ts is auto-generated
 */

export interface OAuthState {
  state: string;
  vendor_id: string;
  created_at?: string;
  expires_at?: string;
  used_at?: string | null;
}

export interface OAuthStateInsert {
  state: string;
  vendor_id: string;
  created_at?: string;
  expires_at?: string;
  used_at?: string | null;
}

export interface OAuthStateUpdate {
  state?: string;
  vendor_id?: string;
  created_at?: string;
  expires_at?: string;
  used_at?: string | null;
}
