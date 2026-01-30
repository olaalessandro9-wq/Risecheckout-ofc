/**
 * Students Service Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  listStudents,
  getStudent,
  assignGroups,
  removeFromGroup,
  revokeAccess,
  studentsService,
} from '../students.service';

// Mock SUPABASE_URL
vi.mock('@/config/supabase', () => ({
  SUPABASE_URL: 'https://test.supabase.co',
}));

describe('students.service', () => {
  const originalFetch = global.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.stubGlobal('fetch', originalFetch);
  });

  describe('invokeStudentsFunction', () => {
    it('should include credentials in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ students: [], total: 0 }),
      });

      await listStudents('product-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/students-list'),
        expect.objectContaining({
          credentials: 'include',
          method: 'POST',
        })
      );
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      const result = await listStudents('product-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Unauthorized');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('DNS resolution failed'));

      const result = await listStudents('product-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('DNS resolution failed');
    });
  });

  describe('listStudents', () => {
    it('should fetch students for a product with pagination', async () => {
      const response = {
        students: [
          { id: 'buyer-1', email: 'student1@test.com' },
          { id: 'buyer-2', email: 'student2@test.com' },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(response),
      });

      const result = await listStudents('product-123');

      expect(result.data).toEqual(response);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('list');
      expect(body.product_id).toBe('product-123');
    });

    it('should pass filter options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ students: [], total: 0, page: 2, limit: 20 }),
      });

      await listStudents('product-123', {
        page: 2,
        limit: 20,
        search: 'john',
        access_type: 'active',
        status: 'completed',
        group_id: 'group-1',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.page).toBe(2);
      expect(body.limit).toBe(20);
      expect(body.search).toBe('john');
      expect(body.access_type).toBe('active');
      expect(body.status).toBe('completed');
      expect(body.group_id).toBe('group-1');
    });
  });

  describe('getStudent', () => {
    it('should fetch a single student with groups', async () => {
      const student = {
        id: 'buyer-1',
        email: 'student@test.com',
        groups: [{ id: 'g1', name: 'Premium' }],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(student),
      });

      const result = await getStudent('buyer-1', 'product-123');

      expect(result.data).toEqual(student);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('get');
      expect(body.buyer_id).toBe('buyer-1');
      expect(body.product_id).toBe('product-123');
    });
  });

  describe('assignGroups', () => {
    it('should assign groups to a student', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await assignGroups({
        buyer_id: 'buyer-1',
        group_ids: ['g1', 'g2'],
      });

      expect(result.data).toEqual({ success: true });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/students-groups'),
        expect.any(Object)
      );
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('assign-groups');
      expect(body.buyer_id).toBe('buyer-1');
      expect(body.group_ids).toEqual(['g1', 'g2']);
    });
  });

  describe('removeFromGroup', () => {
    it('should remove a student from a group', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await removeFromGroup('buyer-1', 'group-1');

      expect(result.data).toEqual({ success: true });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/students-groups'),
        expect.any(Object)
      );
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('remove-from-group');
      expect(body.buyer_id).toBe('buyer-1');
      expect(body.group_id).toBe('group-1');
    });
  });

  describe('revokeAccess', () => {
    it('should revoke all access for a student', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await revokeAccess('buyer-1', 'product-123');

      expect(result.data).toEqual({ success: true });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/students-access'),
        expect.any(Object)
      );
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('revoke-access');
      expect(body.buyer_id).toBe('buyer-1');
      expect(body.product_id).toBe('product-123');
    });
  });

  describe('studentsService object', () => {
    it('should export all methods', () => {
      expect(studentsService.list).toBe(listStudents);
      expect(studentsService.get).toBe(getStudent);
      expect(studentsService.assignGroups).toBe(assignGroups);
      expect(studentsService.removeFromGroup).toBe(removeFromGroup);
      expect(studentsService.revokeAccess).toBe(revokeAccess);
    });
  });
});
