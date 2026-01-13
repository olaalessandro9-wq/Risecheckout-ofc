/**
 * Students Service
 * Communicates with students-* Edge Functions (refactored from members-area-students)
 * 
 * MIGRATED: Uses getProducerSessionToken() instead of supabase.auth.getSession()
 */

import { SUPABASE_URL } from '@/config/supabase';
import { getProducerSessionToken } from '@/hooks/useProducerAuth';
import type {
  BuyerWithGroups,
  AssignBuyerGroupsInput,
} from '../types';

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
 * Invoke students edge function with authentication
 */
async function invokeStudentsFunction<T>(
  functionName: string,
  action: string,
  payload: object
): Promise<ServiceResponse<T>> {
  try {
    const token = getProducerSessionToken();

    if (!token) {
      return { data: null, error: 'Not authenticated' };
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Producer-Session-Token': token,
      },
      body: JSON.stringify({ action, ...payload }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || `HTTP ${response.status}` };
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
  options?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    access_type?: string;
    status?: string;
    group_id?: string;
  }
): Promise<ServiceResponse<StudentListResponse>> {
  return invokeStudentsFunction<StudentListResponse>('students-list', 'list', {
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
  return invokeStudentsFunction<BuyerWithGroups>('students-list', 'get', {
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
  return invokeStudentsFunction<{ success: boolean }>('students-groups', 'assign-groups', input);
}

/**
 * Remove a student from a group
 */
export async function removeFromGroup(
  buyerId: string,
  groupId: string
): Promise<ServiceResponse<{ success: boolean }>> {
  return invokeStudentsFunction<{ success: boolean }>('students-groups', 'remove-from-group', {
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
  return invokeStudentsFunction<{ success: boolean }>('students-access', 'revoke-access', {
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
