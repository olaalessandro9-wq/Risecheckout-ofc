/**
 * Shared Types & Mock Data for products-crud, product-entities, members-area-groups Tests
 * Combined _shared files to save time - each function imports what it needs
 * @version 2.0.0 - RISE Protocol V3 Compliant
 */

// products-crud types
export type CrudAction = "list" | "get" | "get-settings" | "get-offers" | "get-checkouts";
export function isValidCrudAction(action: string): action is CrudAction {
  return ["list", "get", "get-settings", "get-offers", "get-checkouts"].includes(action);
}

// product-entities types  
export type EntityAction = "offers" | "order-bumps" | "coupons" | "checkouts" | "payment-links" | "all";
export function isValidEntityAction(action: string): action is EntityAction {
  return ["offers", "order-bumps", "coupons", "checkouts", "payment-links", "all"].includes(action);
}

// get-users-with-emails pagination
export function calculatePagination(total: number, page: number, limit: number) {
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);
  return { offset, totalPages };
}

export function validatePaginationParams(page?: number, limit?: number) {
  const validPage = page && page > 0 ? page : 1;
  const validLimit = limit && limit > 0 && limit <= 100 ? limit : 20;
  if (limit !== undefined && limit > 100) {
    return { page: validPage, limit: 100, error: "Limite máximo é 100" };
  }
  return { page: validPage, limit: validLimit };
}

// members-area-groups validation
export const VALID_GROUP_ACTIONS = ["list", "get", "create", "update", "delete", "permissions", "list_offers", "link_offers"];
export function isValidGroupAction(action: string): boolean {
  return VALID_GROUP_ACTIONS.includes(action);
}
