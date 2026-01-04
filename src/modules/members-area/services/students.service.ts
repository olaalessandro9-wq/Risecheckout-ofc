/**
 * Students Service
 * Communicates with members-area-students Edge Function
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  BuyerWithGroups,
  AssignBuyerGroupsInput,
} from '../types';

const FUNCTION_NAME = 'members-area-students';

interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

interface StudentListResponse {
  students: BuyerWithGroups[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Invoke the students edge function with authentication
 */
async function invokeStudentsFunction<T>(
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

    return { data: data as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * List students with access to a product
 */
export async function listStudents(
  productId: string,
  options?: { page?: number; limit?: number; search?: string }
): Promise<ServiceResponse<StudentListResponse>> {
  return invokeStudentsFunction<StudentListResponse>('list', {
    product_id: productId,
    ...options,
  });
}

/**
 * Get a single student with their groups
 */
export async function getStudent(
  buyerId: string,
  productId: string
): Promise<ServiceResponse<BuyerWithGroups>> {
  return invokeStudentsFunction<BuyerWithGroups>('get', {
    buyer_id: buyerId,
    product_id: productId,
  });
}

/**
 * Assign groups to a student
 */
export async function assignGroups(
  input: AssignBuyerGroupsInput
): Promise<ServiceResponse<{ success: boolean }>> {
  return invokeStudentsFunction<{ success: boolean }>('assign_groups', input);
}

/**
 * Remove a student from a group
 */
export async function removeFromGroup(
  buyerId: string,
  groupId: string
): Promise<ServiceResponse<{ success: boolean }>> {
  return invokeStudentsFunction<{ success: boolean }>('remove_from_group', {
    buyer_id: buyerId,
    group_id: groupId,
  });
}

/**
 * Revoke all access for a student
 */
export async function revokeAccess(
  buyerId: string,
  productId: string
): Promise<ServiceResponse<{ success: boolean }>> {
  return invokeStudentsFunction<{ success: boolean }>('revoke_access', {
    buyer_id: buyerId,
    product_id: productId,
  });
}

export const studentsService = {
  list: listStudents,
  get: getStudent,
  assignGroups,
  removeFromGroup,
  revokeAccess,
};
