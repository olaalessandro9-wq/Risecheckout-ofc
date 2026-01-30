/**
 * Progress Service Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getProgressSummary,
  getContentProgress,
  updateProgress,
  markComplete,
  unmarkComplete,
  getLastWatched,
  progressService,
} from '../progress.service';

// Mock SUPABASE_URL
vi.mock('@/config/supabase', () => ({
  SUPABASE_URL: 'https://test.supabase.co',
}));

describe('progress.service', () => {
  const originalFetch = global.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.stubGlobal('fetch', originalFetch);
  });

  describe('invokeProgressFunction', () => {
    it('should include credentials in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await getProgressSummary('buyer-123', 'product-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/members-area-progress',
        expect.objectContaining({
          credentials: 'include',
          method: 'POST',
        })
      );
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      const result = await getProgressSummary('buyer-123', 'product-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Not found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await getProgressSummary('buyer-123', 'product-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Connection refused');
    });
  });

  describe('getProgressSummary', () => {
    it('should fetch full progress summary', async () => {
      const summary = {
        total_contents: 10,
        completed_contents: 5,
        progress_percent: 50,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(summary),
      });

      const result = await getProgressSummary('buyer-123', 'product-123');

      expect(result.data).toEqual(summary);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('get_summary');
      expect(body.buyer_id).toBe('buyer-123');
      expect(body.product_id).toBe('product-123');
    });
  });

  describe('getContentProgress', () => {
    it('should fetch progress for a specific content', async () => {
      const progress = {
        content_id: 'content-1',
        progress_percent: 75,
        watch_time_seconds: 450,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(progress),
      });

      const result = await getContentProgress('buyer-123', 'content-1');

      expect(result.data).toEqual(progress);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('get_content');
      expect(body.content_id).toBe('content-1');
    });
  });

  describe('updateProgress', () => {
    it('should update content progress', async () => {
      const updated = {
        content_id: 'content-1',
        progress_percent: 80,
        last_position_seconds: 240,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updated),
      });

      const result = await updateProgress('buyer-123', {
        content_id: 'content-1',
        progress_percent: 80,
        last_position_seconds: 240,
      });

      expect(result.data).toEqual(updated);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('update');
      expect(body.buyer_id).toBe('buyer-123');
      expect(body.progress_percent).toBe(80);
    });
  });

  describe('markComplete', () => {
    it('should mark content as complete', async () => {
      const completed = {
        content_id: 'content-1',
        progress_percent: 100,
        completed_at: '2024-01-15T12:00:00Z',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(completed),
      });

      const result = await markComplete('buyer-123', { content_id: 'content-1' });

      expect(result.data).toEqual(completed);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('complete');
      expect(body.content_id).toBe('content-1');
    });
  });

  describe('unmarkComplete', () => {
    it('should unmark content as complete', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await unmarkComplete('buyer-123', 'content-1');

      expect(result.data).toEqual({ success: true });
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('uncomplete');
      expect(body.buyer_id).toBe('buyer-123');
      expect(body.content_id).toBe('content-1');
    });
  });

  describe('getLastWatched', () => {
    it('should get last watched content', async () => {
      const lastWatched = {
        content_id: 'content-5',
        last_position_seconds: 120,
        updated_at: '2024-01-15T11:30:00Z',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(lastWatched),
      });

      const result = await getLastWatched('buyer-123', 'product-123');

      expect(result.data).toEqual(lastWatched);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('get_last_watched');
    });

    it('should return null when no content watched', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null),
      });

      const result = await getLastWatched('buyer-123', 'product-123');

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('progressService object', () => {
    it('should export all methods', () => {
      expect(progressService.getSummary).toBe(getProgressSummary);
      expect(progressService.getContent).toBe(getContentProgress);
      expect(progressService.update).toBe(updateProgress);
      expect(progressService.markComplete).toBe(markComplete);
      expect(progressService.unmarkComplete).toBe(unmarkComplete);
      expect(progressService.getLastWatched).toBe(getLastWatched);
    });
  });
});
