/**
 * Types for Members Area Access Groups
 * Controls which students can access which modules
 */

/** Access group for controlling module visibility */
export interface MemberGroup {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  position: number | null;
  created_at: string;
  updated_at: string;
}

/** Permission linking a group to a module */
export interface GroupPermission {
  id: string;
  group_id: string;
  module_id: string;
  has_access: boolean;
  created_at: string;
}

/** Group with its permissions loaded */
export interface GroupWithPermissions extends MemberGroup {
  permissions: GroupPermission[];
}

/** Buyer's membership in a group */
export interface BuyerGroup {
  id: string;
  buyer_id: string;
  group_id: string;
  is_active: boolean;
  granted_at: string;
  expires_at: string | null;
}

/** Buyer with their groups loaded */
export interface BuyerWithGroups {
  buyer_id: string;
  buyer_name: string | null;
  buyer_email: string;
  groups: BuyerGroup[];
  access_type?: string; // 'owner' | 'purchase' | 'manual' | 'affiliate'
  last_access_at?: string | null;
  progress_percent?: number;
  status?: 'active' | 'inactive';
}

/** Statistics for student list */
export interface StudentStats {
  totalStudents: number;
  averageProgress: number;
  completionRate: number;
}

/** Filters for student list */
export interface StudentFilters {
  groupId: string | null;
  accessType: 'all' | 'manual' | 'purchase' | null;
}

/** Input for creating a group */
export interface CreateGroupInput {
  product_id: string;
  name: string;
  description?: string;
  is_default?: boolean;
  position?: number;
}

/** Input for updating a group */
export interface UpdateGroupInput {
  name?: string;
  description?: string;
  is_default?: boolean;
  is_active?: boolean;
  position?: number;
}

/** Input for updating group permissions */
export interface UpdatePermissionsInput {
  group_id: string;
  permissions: {
    module_id: string;
    has_access: boolean;
  }[];
}

/** Input for assigning buyer to groups */
export interface AssignBuyerGroupsInput {
  buyer_id: string;
  group_ids: string[];
  expires_at?: string;
}
