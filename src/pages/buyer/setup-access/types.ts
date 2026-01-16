/**
 * SetupAccess Types
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

export type TokenStatus = 
  | "loading" 
  | "valid" 
  | "invalid" 
  | "used" 
  | "expired"
  | "already-logged-correct"
  | "already-logged-wrong"
  | "needs-login";

export interface TokenInfo {
  needsPasswordSetup: boolean;
  buyer_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  buyer_email: string;
  buyer_name: string;
}

export interface LoggedBuyer {
  id: string;
  email: string;
  name: string | null;
}
