/**
 * Students Groups Tests - Shared Types and Utilities
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module students-groups/tests/_shared
 */

// ============================================================================
// TYPES
// ============================================================================

export type GroupAction = "add-to-group" | "remove-from-group" | "assign-groups" | "list-groups";

export interface GroupRequest {
  action: GroupAction;
  buyer_id?: string;
  group_id?: string;
  group_ids?: string[];
  product_id?: string;
}

export interface GroupResponse {
  success?: boolean;
  error?: string;
  groups_count?: number;
  groups?: ProductMemberGroup[];
}

export interface ProductMemberGroup {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  position: number;
}

export interface MockProduct {
  id: string;
  user_id: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_PRODUCER_ID = "producer-001";

export const MOCK_PRODUCT: MockProduct = {
  id: "product-001",
  user_id: MOCK_PRODUCER_ID
};

export const MOCK_GROUPS: ProductMemberGroup[] = [
  {
    id: "group-001",
    product_id: "product-001",
    name: "Grupo Básico",
    description: "Acesso básico",
    is_default: true,
    position: 0
  },
  {
    id: "group-002",
    product_id: "product-001",
    name: "Grupo Premium",
    description: "Acesso premium",
    is_default: false,
    position: 1
  },
  {
    id: "group-003",
    product_id: "product-001",
    name: "Grupo VIP",
    description: null,
    is_default: false,
    position: 2
  }
];

export const MOCK_BUYER_ID = "buyer-001";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates group request based on action
 */
export function validateGroupRequest(request: Partial<GroupRequest>): string | null {
  if (!request.action) return "action required";
  
  const validActions = ["add-to-group", "remove-from-group", "assign-groups", "list-groups"];
  if (!validActions.includes(request.action)) return "Invalid action";
  
  if (request.action === "add-to-group" || request.action === "remove-from-group") {
    if (!request.buyer_id || !request.group_id) {
      return "buyer_id and group_id required";
    }
  }
  
  if (request.action === "assign-groups") {
    if (!request.buyer_id || !request.group_ids) {
      return "buyer_id and group_ids required";
    }
  }
  
  if (request.action === "list-groups") {
    if (!request.product_id) {
      return "product_id required";
    }
  }
  
  return null;
}

/**
 * Simulates adding buyer to group
 */
export function simulateAddToGroup(buyerId: string, groupId: string): object {
  return {
    buyer_id: buyerId,
    group_id: groupId,
    is_active: true,
    granted_at: new Date().toISOString()
  };
}

/**
 * Simulates removing buyer from group
 */
export function simulateRemoveFromGroup(): { is_active: boolean } {
  return { is_active: false };
}

/**
 * Simulates assigning multiple groups
 */
export function simulateAssignGroups(buyerId: string, groupIds: string[]): object[] {
  return groupIds.map(gid => ({
    buyer_id: buyerId,
    group_id: gid,
    is_active: true,
    granted_at: new Date().toISOString()
  }));
}

/**
 * Filters groups by product_id
 */
export function filterGroupsByProduct(groups: ProductMemberGroup[], productId: string): ProductMemberGroup[] {
  return groups.filter(g => g.product_id === productId);
}
