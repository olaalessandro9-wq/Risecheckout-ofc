/**
 * Groups Service
 * Communicates with members-area-groups Edge Function
 * 
 * MIGRATED: Uses getProducerSessionToken() instead of supabase.auth.getSession()
 */

import { SUPABASE_URL } from '@/config/supabase';
import { getProducerSessionToken } from '@/hooks/useProducerAuth';
import { createLogger } from '@/lib/logger';

const log = createLogger("GroupsService");
import type {
  MemberGroup,
  GroupWithPermissions,
  CreateGroupInput,
  UpdateGroupInput,
  UpdatePermissionsInput,
} from '../types';

const FUNCTION_NAME = 'members-area-groups';

interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Invoke the groups edge function with authentication
 */
async function invokeGroupsFunction<T>(
  action: string,
  payload: object
): Promise<ServiceResponse<T>> {
  try {
    // RISE V3: Autenticação via cookies httpOnly (credentials: include)

    // RISE V3: credentials: include envia cookies httpOnly automaticamente
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
      credentials: 'include',
    });

    // Parse response robustly
    const text = await response.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      log.error(`Failed to parse response: ${text.slice(0, 300)}`);
      return { data: null, error: `HTTP ${response.status}: Invalid JSON response` };
    }

    if (!response.ok) {
      const errorMessage = (data?.error as string) || `HTTP ${response.status}`;
      log.error(`Error ${action}:`, errorMessage);
      return { data: null, error: errorMessage };
    }

    // Edge function returns { success: true, groups/group/offers } wrapper
    // Extract the actual data based on what we expect
    if (data?.groups !== undefined) {
      return { data: data.groups as T, error: null };
    }
    if (data?.group !== undefined) {
      return { data: data.group as T, error: null };
    }
    if (data?.offers !== undefined) {
      return { data: data.offers as T, error: null };
    }
    if (data?.success !== undefined) {
      return { data: data as T, error: null };
    }

    return { data: data as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error(`Exception in ${action}:`, message);
    return { data: null, error: message };
  }
}

/**
 * List all groups for a product
 */
export async function listGroups(
  productId: string
): Promise<ServiceResponse<MemberGroup[]>> {
  return invokeGroupsFunction<MemberGroup[]>('list', { product_id: productId });
}

/**
 * Get a single group with its permissions
 */
export async function getGroup(
  groupId: string
): Promise<ServiceResponse<GroupWithPermissions>> {
  return invokeGroupsFunction<GroupWithPermissions>('get', { group_id: groupId });
}

/**
 * Create a new group
 */
export async function createGroup(
  input: CreateGroupInput
): Promise<ServiceResponse<MemberGroup>> {
  // Edge function expects product_id at root level and fields inside data object
  return invokeGroupsFunction<MemberGroup>('create', {
    product_id: input.product_id,
    data: {
      name: input.name,
      description: input.description,
      is_default: input.is_default,
    },
  });
}

/**
 * Update an existing group
 */
export async function updateGroup(
  groupId: string,
  input: UpdateGroupInput
): Promise<ServiceResponse<MemberGroup>> {
  // Edge function expects group_id at root and fields inside data object
  return invokeGroupsFunction<MemberGroup>('update', {
    group_id: groupId,
    data: {
      name: input.name,
      description: input.description,
      is_default: input.is_default,
    },
  });
}

/**
 * Delete a group
 */
export async function deleteGroup(
  groupId: string
): Promise<ServiceResponse<{ success: boolean }>> {
  return invokeGroupsFunction<{ success: boolean }>('delete', { group_id: groupId });
}

/**
 * Update group permissions for modules
 */
export async function updatePermissions(
  input: UpdatePermissionsInput
): Promise<ServiceResponse<{ success: boolean }>> {
  // Edge function expects 'permissions' action with data.permissions array
  // Convert has_access to can_access for edge function compatibility
  const permissionsData = input.permissions.map(p => ({
    module_id: p.module_id,
    can_access: p.has_access,
  }));
  
  return invokeGroupsFunction<{ success: boolean }>('permissions', {
    group_id: input.group_id,
    data: { permissions: permissionsData },
  });
}

/** Offer data returned by the edge function */
export interface ProductOffer {
  id: string;
  name: string;
  price: number;
  is_default: boolean;
  member_group_id: string | null;
  status: string;
}

/**
 * List all offers for a product
 */
export async function listOffers(
  productId: string
): Promise<ServiceResponse<ProductOffer[]>> {
  return invokeGroupsFunction<ProductOffer[]>('list_offers', { product_id: productId });
}

/**
 * Link offers to a group
 */
export async function linkOffers(
  groupId: string,
  offerIds: string[]
): Promise<ServiceResponse<{ success: boolean }>> {
  return invokeGroupsFunction<{ success: boolean }>('link_offers', {
    group_id: groupId,
    data: { offer_ids: offerIds },
  });
}

export const groupsService = {
  list: listGroups,
  get: getGroup,
  create: createGroup,
  update: updateGroup,
  delete: deleteGroup,
  updatePermissions,
  listOffers,
  linkOffers,
};
