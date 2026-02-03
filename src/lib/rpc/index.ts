/**
 * RPC Module - Centralized RPC utilities
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * This is the main entry point for the RPC layer.
 * Import from here for error handling and RPC invocation:
 * 
 * ```typescript
 * import { invokeRpc, getRpcErrorMessage, isRpcAuthError } from "@/lib/rpc";
 * ```
 */

// Error handling
export { 
  RpcError, 
  createRpcError, 
  isRpcError, 
  isRpcAuthError, 
  getRpcErrorMessage 
} from "./errors";

// RPC Proxy and typed helpers
export * from "./rpcProxy";
