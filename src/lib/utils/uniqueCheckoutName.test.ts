/**
 * ensureUniqueCheckoutName Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the unique checkout name utility that calls admin-data edge function.
 * 
 * @module lib/utils
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ensureUniqueCheckoutName } from './uniqueCheckoutName';

// Mock the api module
vi.mock('@/lib/api', () => ({
  api: {
    call: vi.fn(),
  },
}));

import { api } from '@/lib/api';

describe('ensureUniqueCheckoutName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return unique checkout name from API', async () => {
    vi.mocked(api.call).mockResolvedValue({
      data: {
        success: true,
        uniqueName: 'My Checkout (2)',
      },
      error: null,
    });

    const result = await ensureUniqueCheckoutName(
      null, // supabase param ignored
      'product-123',
      'My Checkout'
    );

    expect(result).toBe('My Checkout (2)');
    expect(api.call).toHaveBeenCalledWith('admin-data', {
      action: 'check-unique-checkout-name',
      productId: 'product-123',
      baseName: 'My Checkout',
    });
  });

  it('should return original name when already unique', async () => {
    vi.mocked(api.call).mockResolvedValue({
      data: {
        success: true,
        uniqueName: 'New Checkout',
      },
      error: null,
    });

    const result = await ensureUniqueCheckoutName(
      null,
      'product-456',
      'New Checkout'
    );

    expect(result).toBe('New Checkout');
  });

  it('should throw on API error', async () => {
    vi.mocked(api.call).mockResolvedValue({
      data: null,
      error: { message: 'Network error', code: 'NETWORK_ERROR' },
    });

    await expect(
      ensureUniqueCheckoutName(null, 'product-123', 'Test')
    ).rejects.toThrow('Network error');
  });

  it('should throw on unsuccessful response', async () => {
    vi.mocked(api.call).mockResolvedValue({
      data: {
        success: false,
        error: 'Product not found',
      },
      error: null,
    });

    await expect(
      ensureUniqueCheckoutName(null, 'invalid-product', 'Test')
    ).rejects.toThrow('Product not found');
  });

  it('should throw generic error when no error message', async () => {
    vi.mocked(api.call).mockResolvedValue({
      data: {
        success: false,
      },
      error: null,
    });

    await expect(
      ensureUniqueCheckoutName(null, 'product-123', 'Test')
    ).rejects.toThrow('Erro ao verificar nome único');
  });

  it('should ignore first parameter (signature stability)', async () => {
    vi.mocked(api.call).mockResolvedValue({
      data: {
        success: true,
        uniqueName: 'Test Checkout',
      },
      error: null,
    });

    // First param can be anything - it's ignored for signature stability
    const result1 = await ensureUniqueCheckoutName(null, 'prod-1', 'Test Checkout');
    const result2 = await ensureUniqueCheckoutName({} as unknown, 'prod-1', 'Test Checkout');
    const result3 = await ensureUniqueCheckoutName('ignored' as unknown, 'prod-1', 'Test Checkout');

    expect(result1).toBe('Test Checkout');
    expect(result2).toBe('Test Checkout');
    expect(result3).toBe('Test Checkout');

    // All calls should have the same API parameters (first arg ignored)
    expect(api.call).toHaveBeenCalledTimes(3);
    const calls = vi.mocked(api.call).mock.calls;
    calls.forEach(call => {
      expect(call[0]).toBe('admin-data');
      expect(call[1]).toEqual({
        action: 'check-unique-checkout-name',
        productId: 'prod-1',
        baseName: 'Test Checkout',
      });
    });
  });

  it('should handle special characters in base name', async () => {
    vi.mocked(api.call).mockResolvedValue({
      data: {
        success: true,
        uniqueName: 'Checkout "Especial" (2)',
      },
      error: null,
    });

    const result = await ensureUniqueCheckoutName(
      null,
      'product-123',
      'Checkout "Especial"'
    );

    expect(result).toBe('Checkout "Especial" (2)');
    expect(api.call).toHaveBeenCalledWith('admin-data', {
      action: 'check-unique-checkout-name',
      productId: 'product-123',
      baseName: 'Checkout "Especial"',
    });
  });

  it('should handle empty base name', async () => {
    vi.mocked(api.call).mockResolvedValue({
      data: {
        success: true,
        uniqueName: 'Untitled Checkout',
      },
      error: null,
    });

    const result = await ensureUniqueCheckoutName(null, 'product-123', '');

    expect(result).toBe('Untitled Checkout');
    expect(api.call).toHaveBeenCalledWith('admin-data', {
      action: 'check-unique-checkout-name',
      productId: 'product-123',
      baseName: '',
    });
  });

  it('should handle high increment numbers', async () => {
    vi.mocked(api.call).mockResolvedValue({
      data: {
        success: true,
        uniqueName: 'Popular Checkout (99)',
      },
      error: null,
    });

    const result = await ensureUniqueCheckoutName(
      null,
      'product-123',
      'Popular Checkout'
    );

    expect(result).toBe('Popular Checkout (99)');
  });
});
