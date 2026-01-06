/**
 * Groups Service
 * Communicates with members-area-groups Edge Function
 */

import { supabase } from '@/integrations/supabase/client';
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
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      return { data: null, error: 'Not authenticated' };
    }

    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body: { action, ...payload },
    });

    if (error) {
      return { data: null, error: error.message };
    }

    // Edge function returns { success: true, groups/group } wrapper
    // Extract the actual data based on what we expect
    if (data?.groups !== undefined) {
      return { data: data.groups as T, error: null };
    }
    if (data?.group !== undefined) {
      return { data: data.group as T, error: null };
    }
    if (data?.success !== undefined) {
      return { data: data as T, error: null };
    }

    return { data: data as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
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
  return invokeGroupsFunction<MemberGroup>('create', input);
}

/**
 * Update an existing group
 */
export async function updateGroup(
  groupId: string,
  input: UpdateGroupInput
): Promise<ServiceResponse<MemberGroup>> {
  return invokeGroupsFunction<MemberGroup>('update', { group_id: groupId, ...input });
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

export const groupsService = {
  list: listGroups,
  get: getGroup,
  create: createGroup,
  update: updateGroup,
  delete: deleteGroup,
  updatePermissions,
};
