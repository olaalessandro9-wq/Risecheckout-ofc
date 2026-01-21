/**
 * Context Index - Export context, hook, fetchers, and handlers
 * 
 * @version 2.0.0
 */

export { AdminProvider, useAdmin } from "./AdminContext";
export type { AdminContextValue } from "./AdminContext";

// Modular exports for testing/reuse
export { fetchUsers, fetchProducts, fetchOrders, fetchSecurity } from "./adminFetchers";
export { 
  handleConfirmRoleChange, 
  handleConfirmProductAction, 
  handleAcknowledgeAlert,
  handleConfirmBlockIP,
  handleConfirmUnblockIP,
} from "./adminHandlers";
