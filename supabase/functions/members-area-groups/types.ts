/**
 * Types for members-area-groups Edge Function
 * RISE V3 Compliant - Separated from router
 */

export interface PermissionInput {
  module_id: string;
  can_access: boolean;
}

export interface GroupData {
  name?: string;
  description?: string;
  is_default?: boolean;
  permissions?: PermissionInput[];
  offer_ids?: string[];
}

export interface GroupRequest {
  action: "list" | "get" | "create" | "update" | "delete" | "permissions" | "list_offers" | "link_offers";
  product_id?: string;
  group_id?: string;
  data?: GroupData;
}

export interface ProductRecord {
  id: string;
  user_id: string;
}

export interface GroupRecord {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
}

export interface GroupWithPermissions extends GroupRecord {
  permissions: Array<{
    module_id: string;
    has_access: boolean;
  }>;
}

export interface OfferRecord {
  id: string;
  name: string;
  price: number;
  is_default: boolean | null;
  member_group_id: string | null;
  status: string;
}

export interface PermissionToInsert {
  group_id: string;
  module_id: string;
  has_access: boolean;
}
