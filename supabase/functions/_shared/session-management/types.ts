/**
 * ============================================================================
 * Session Management Types
 * ============================================================================
 * 
 * TypeScript definitions for the Session Management Module.
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

// ============================================================================
// SESSION INFO
// ============================================================================

export interface SessionInfo {
  id: string;
  createdAt: string;
  lastActivityAt: string | null;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  isCurrent: boolean;
  device: DeviceInfo;
}

export interface DeviceInfo {
  type: "mobile" | "tablet" | "desktop" | "unknown";
  browser: string;
  os: string;
}

// ============================================================================
// ACTIONS
// ============================================================================

export type SessionAction = 
  | "list"           // Listar todas as sessões ativas
  | "revoke"         // Revogar uma sessão específica
  | "revoke-all"     // Revogar TODAS as sessões (logout global)
  | "revoke-others"; // Revogar todas EXCETO a sessão atual

export interface ListSessionsRequest {
  action: "list";
}

export interface RevokeSessionRequest {
  action: "revoke";
  sessionId: string;
}

export interface RevokeAllSessionsRequest {
  action: "revoke-all";
}

export interface RevokeOthersRequest {
  action: "revoke-others";
}

export type SessionManagementRequest = 
  | ListSessionsRequest 
  | RevokeSessionRequest 
  | RevokeAllSessionsRequest 
  | RevokeOthersRequest;

// ============================================================================
// RESPONSES
// ============================================================================

export interface ListSessionsResponse {
  success: true;
  sessions: SessionInfo[];
  totalActive: number;
}

export interface RevokeSessionResponse {
  success: true;
  revokedSessionId: string;
  message: string;
}

export interface RevokeAllResponse {
  success: true;
  revokedCount: number;
  message: string;
}

export interface RevokeOthersResponse {
  success: true;
  revokedCount: number;
  currentSessionKept: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export type SessionManagementResponse = 
  | ListSessionsResponse 
  | RevokeSessionResponse 
  | RevokeAllResponse 
  | RevokeOthersResponse 
  | ErrorResponse;

// ============================================================================
// DATABASE ROW
// ============================================================================

export interface BuyerSessionRow {
  id: string;
  buyer_id: string;
  session_token: string;
  refresh_token: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  expires_at: string;
  last_activity_at: string | null;
  is_valid: boolean;
}

// ============================================================================
// DOMAIN
// ============================================================================

export type SessionDomain = "buyer" | "producer";
