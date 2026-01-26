/**
 * ============================================================================
 * Session Management Module - Entry Point
 * ============================================================================
 * 
 * RISE Protocol V3 - Unified Sessions Architecture
 * 
 * Provides complete session management functionality:
 * - List active sessions with device info
 * - Revoke specific sessions
 * - Global logout (revoke all)
 * - Revoke others (keep current)
 * 
 * @version 2.0.0 - RISE Protocol V3 (Unified Sessions Table)
 * ============================================================================
 */

// Re-export types
export type {
  SessionInfo,
  DeviceInfo,
  SessionAction,
  SessionManagementRequest,
  SessionManagementResponse,
  ListSessionsRequest,
  RevokeSessionRequest,
  RevokeAllSessionsRequest,
  RevokeOthersRequest,
  ListSessionsResponse,
  RevokeSessionResponse,
  RevokeAllResponse,
  RevokeOthersResponse,
  ErrorResponse,
  BuyerSessionRow,
  SessionDomain,
} from "./types.ts";

// Re-export device parser
export {
  parseUserAgent,
  formatDeviceDescription,
} from "./device-parser.ts";

// Re-export unified session manager functions
export {
  listSessionsUnified,
  revokeSessionUnified,
  revokeAllSessionsUnified,
  revokeOtherSessionsUnified,
} from "./session-manager.ts";
