/**
 * Groups Service Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  listGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  updatePermissions,
  listOffers,
  linkOffers,
  groupsService,
} from '../groups.service';

// Mock dependencies
vi.mock('@/config/supabase', () => ({
  SUPABASE_URL: 'https://test.supabase.co',
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('groups.service', () => {
  const originalFetch = global.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.stubGlobal('fetch', originalFetch);
  });

  describe('invokeGroupsFunction', () => {
    it('should include credentials in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ groups: [] })),
      });

      await listGroups('product-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/members-area-groups',
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should handle invalid JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Not JSON'),
      });

      const result = await listGroups('product-123');

      expect(result.data).toBeNull();
      expect(result.error).toContain('HTTP 500');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failed'));

      const result = await listGroups('product-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Network failed');
    });

    it('should extract groups from wrapper response', async () => {
      const groups = [{ id: 'g1', name: 'Group 1' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ success: true, groups })),
      });

      const result = await listGroups('product-123');

      expect(result.data).toEqual(groups);
    });

    it('should extract group from wrapper response', async () => {
      const group = { id: 'g1', name: 'Group 1', permissions: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ success: true, group })),
      });

      const result = await getGroup('g1');

      expect(result.data).toEqual(group);
    });

    it('should extract offers from wrapper response', async () => {
      const offers = [{ id: 'o1', name: 'Offer 1' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ success: true, offers })),
      });

      const result = await listOffers('product-123');

      expect(result.data).toEqual(offers);
    });
  });

  describe('listGroups', () => {
    it('should fetch groups for a product', async () => {
      const groups = [{ id: 'g1' }, { id: 'g2' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ groups })),
      });

      const result = await listGroups('product-123');

      expect(result.data).toEqual(groups);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('list');
      expect(body.product_id).toBe('product-123');
    });
  });

  describe('getGroup', () => {
    it('should fetch a single group with permissions', async () => {
      const group = { id: 'g1', permissions: [{ module_id: 'm1' }] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ group })),
      });

      const result = await getGroup('g1');

      expect(result.data).toEqual(group);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('get');
      expect(body.group_id).toBe('g1');
    });
  });

  describe('createGroup', () => {
    it('should create a new group with nested data object', async () => {
      const newGroup = { id: 'g-new', name: 'New Group' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ group: newGroup })),
      });

      const result = await createGroup({
        product_id: 'product-123',
        name: 'New Group',
        description: 'Test description',
        is_default: false,
      });

      expect(result.data).toEqual(newGroup);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('create');
      expect(body.product_id).toBe('product-123');
      expect(body.data.name).toBe('New Group');
      expect(body.data.description).toBe('Test description');
    });
  });

  describe('updateGroup', () => {
    it('should update an existing group', async () => {
      const updated = { id: 'g1', name: 'Updated' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ group: updated })),
      });

      const result = await updateGroup('g1', { name: 'Updated' });

      expect(result.data).toEqual(updated);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('update');
      expect(body.group_id).toBe('g1');
      expect(body.data.name).toBe('Updated');
    });
  });

  describe('deleteGroup', () => {
    it('should delete a group', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
      });

      const result = await deleteGroup('g1');

      expect(result.data).toEqual({ success: true });
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('delete');
      expect(body.group_id).toBe('g1');
    });
  });

  describe('updatePermissions', () => {
    it('should convert has_access to can_access', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
      });

      await updatePermissions({
        group_id: 'g1',
        permissions: [
          { module_id: 'm1', has_access: true },
          { module_id: 'm2', has_access: false },
        ],
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('permissions');
      expect(body.data.permissions).toEqual([
        { module_id: 'm1', can_access: true },
        { module_id: 'm2', can_access: false },
      ]);
    });
  });

  describe('listOffers', () => {
    it('should fetch offers for a product', async () => {
      const offers = [{ id: 'o1', name: 'Offer 1' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ offers })),
      });

      const result = await listOffers('product-123');

      expect(result.data).toEqual(offers);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('list_offers');
    });
  });

  describe('linkOffers', () => {
    it('should link offers to a group', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
      });

      const result = await linkOffers('g1', ['o1', 'o2']);

      expect(result.data).toEqual({ success: true });
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('link_offers');
      expect(body.group_id).toBe('g1');
      expect(body.data.offer_ids).toEqual(['o1', 'o2']);
    });
  });

  describe('groupsService object', () => {
    it('should export all methods', () => {
      expect(groupsService.list).toBe(listGroups);
      expect(groupsService.get).toBe(getGroup);
      expect(groupsService.create).toBe(createGroup);
      expect(groupsService.update).toBe(updateGroup);
      expect(groupsService.delete).toBe(deleteGroup);
      expect(groupsService.updatePermissions).toBe(updatePermissions);
      expect(groupsService.listOffers).toBe(listOffers);
      expect(groupsService.linkOffers).toBe(linkOffers);
    });
  });
});
