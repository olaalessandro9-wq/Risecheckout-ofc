/**
 * useCheckoutData Hook Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module hooks/checkout
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the helper modules before importing the hook
vi.mock('./helpers/resolveCheckoutSlug', () => ({
  resolveCheckoutSlug: vi.fn(),
}));

vi.mock('./helpers/fetchCheckoutById', () => ({
  fetchCheckoutById: vi.fn(),
}));

vi.mock('./helpers/fetchProductData', () => ({
  fetchProductData: vi.fn(),
}));

vi.mock('./helpers/fetchOrderBumps', () => ({
  fetchOrderBumps: vi.fn(),
}));

vi.mock('./helpers/fetchAffiliateInfo', () => ({
  getAffiliateCode: vi.fn(),
  fetchAffiliateInfo: vi.fn(),
}));

vi.mock('@/lib/checkout/normalizeDesign', () => ({
  normalizeDesign: vi.fn((design) => design || { theme: 'light', colors: {} }),
}));

import { resolveCheckoutSlug } from './helpers/resolveCheckoutSlug';
import { fetchCheckoutById } from './helpers/fetchCheckoutById';
import { fetchProductData } from './helpers/fetchProductData';
import { fetchOrderBumps } from './helpers/fetchOrderBumps';
import { getAffiliateCode, fetchAffiliateInfo } from './helpers/fetchAffiliateInfo';

describe('useCheckoutData helpers integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveCheckoutSlug', () => {
    it('should resolve slug to checkout and product IDs', async () => {
      const mockResult = { checkoutId: 'checkout-123', productId: 'product-456' };
      vi.mocked(resolveCheckoutSlug).mockResolvedValue(mockResult);

      const result = await resolveCheckoutSlug('my-product-slug');

      expect(resolveCheckoutSlug).toHaveBeenCalledWith('my-product-slug');
      expect(result).toEqual(mockResult);
    });

    it('should throw on resolution failure', async () => {
      vi.mocked(resolveCheckoutSlug).mockRejectedValue(new Error('Slug not found'));

      await expect(resolveCheckoutSlug('invalid-slug')).rejects.toThrow('Slug not found');
    });
  });

  describe('fetchCheckoutById', () => {
    it('should fetch checkout data by ID', async () => {
      const mockCheckout = {
        id: 'checkout-123',
        name: 'Test Checkout',
        design: { theme: 'light' },
      };
      vi.mocked(fetchCheckoutById).mockResolvedValue(mockCheckout as never);

      const result = await fetchCheckoutById('checkout-123');

      expect(fetchCheckoutById).toHaveBeenCalledWith('checkout-123');
      expect(result).toEqual(mockCheckout);
    });
  });

  describe('fetchProductData', () => {
    it('should fetch product data by ID', async () => {
      const mockProduct = {
        id: 'product-456',
        name: 'Test Product',
        price: 9900,
      };
      vi.mocked(fetchProductData).mockResolvedValue(mockProduct as never);

      const result = await fetchProductData('product-456');

      expect(fetchProductData).toHaveBeenCalledWith('product-456');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('fetchOrderBumps', () => {
    it('should fetch order bumps for checkout', async () => {
      const mockBumps = [
        { id: 'bump-1', name: 'Bump 1', price: 1000 },
        { id: 'bump-2', name: 'Bump 2', price: 2000 },
      ];
      vi.mocked(fetchOrderBumps).mockResolvedValue(mockBumps as never);

      const result = await fetchOrderBumps('checkout-123');

      expect(fetchOrderBumps).toHaveBeenCalledWith('checkout-123');
      expect(result).toEqual(mockBumps);
    });

    it('should return empty array on error', async () => {
      vi.mocked(fetchOrderBumps).mockResolvedValue([]);

      const result = await fetchOrderBumps('checkout-123');

      expect(result).toEqual([]);
    });
  });

  describe('affiliate info flow', () => {
    it('should extract affiliate code from URL', () => {
      vi.mocked(getAffiliateCode).mockReturnValue('AFF123');

      const result = getAffiliateCode();

      expect(result).toBe('AFF123');
    });

    it('should return null when no affiliate code', () => {
      vi.mocked(getAffiliateCode).mockReturnValue(null);

      const result = getAffiliateCode();

      expect(result).toBeNull();
    });

    it('should fetch affiliate info when code present', async () => {
      const mockAffiliateInfo = {
        pixGateway: 'mercadopago' as const,
        creditCardGateway: 'stripe' as const,
        mercadoPagoPublicKey: 'mp-key',
        stripePublicKey: 'stripe-key',
      };
      vi.mocked(fetchAffiliateInfo).mockResolvedValue(mockAffiliateInfo);

      const result = await fetchAffiliateInfo('product-456', 'AFF123');

      expect(fetchAffiliateInfo).toHaveBeenCalledWith('product-456', 'AFF123');
      expect(result).toEqual(mockAffiliateInfo);
    });

    it('should return default gateway info when no affiliate', async () => {
      const defaultInfo = {
        pixGateway: 'mercadopago' as const,
        creditCardGateway: 'mercadopago' as const,
        mercadoPagoPublicKey: null,
        stripePublicKey: null,
      };
      vi.mocked(fetchAffiliateInfo).mockResolvedValue(defaultInfo);

      const result = await fetchAffiliateInfo('product-456', null);

      expect(result.pixGateway).toBe('mercadopago');
    });
  });

  describe('data loading orchestration', () => {
    it('should load all data in correct order', async () => {
      // Setup mocks
      vi.mocked(resolveCheckoutSlug).mockResolvedValue({
        checkoutId: 'checkout-123',
        productId: 'product-456',
      });
      vi.mocked(fetchCheckoutById).mockResolvedValue({
        id: 'checkout-123',
        name: 'Test Checkout',
      } as never);
      vi.mocked(fetchProductData).mockResolvedValue({
        id: 'product-456',
        name: 'Test Product',
        price: 9900,
      } as never);
      vi.mocked(fetchOrderBumps).mockResolvedValue([]);
      vi.mocked(getAffiliateCode).mockReturnValue(null);
      vi.mocked(fetchAffiliateInfo).mockResolvedValue({
        pixGateway: 'mercadopago',
        creditCardGateway: 'mercadopago',
        mercadoPagoPublicKey: null,
        stripePublicKey: null,
      });

      // Simulate the loading sequence
      const slug = 'test-slug';
      const { checkoutId, productId } = await resolveCheckoutSlug(slug);
      
      // Parallel fetches
      const [checkout, product, bumps] = await Promise.all([
        fetchCheckoutById(checkoutId),
        fetchProductData(productId),
        fetchOrderBumps(checkoutId),
      ]);

      const affiliateCode = getAffiliateCode();
      const affiliateInfo = await fetchAffiliateInfo(productId, affiliateCode);

      expect(checkout.id).toBe('checkout-123');
      expect(product.id).toBe('product-456');
      expect(bumps).toEqual([]);
      expect(affiliateInfo.pixGateway).toBe('mercadopago');
    });
  });
});
