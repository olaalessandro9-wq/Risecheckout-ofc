/**
 * ============================================================================
 * Session Management Module - Entry Point
 * ============================================================================
 * 
 * Provides complete session management functionality:
 * - List active sessions with device info
 * - Revoke specific sessions
 * - Global logout (revoke all)
 * - Revoke others (keep current)
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
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

// Re-export session manager
export {
  listSessions,
  revokeSession,
  revokeAllSessions,
  revokeOtherSessions,
} from "./session-manager.ts";
