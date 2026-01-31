/**
 * Shared for members-area-groups
 */
export const VALID_ACTIONS = ["list", "get", "create", "update", "delete", "permissions", "list_offers", "link_offers"];
export function isValidAction(action: string): boolean { return VALID_ACTIONS.includes(action); }
