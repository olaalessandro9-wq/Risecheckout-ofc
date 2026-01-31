/**
 * useAffiliatesTab Hook - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for useAffiliatesTab hook including state management, validation,
 * change detection, and save operations.
 * 
 * @module products/tabs/affiliates/__tests__/useAffiliatesTab.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAffiliatesTab } from '../useAffiliatesTab';
import * as ProductContext from '../../../context/ProductContext';
import { toast } from 'sonner';
import {
  createMockUseAffiliatesTabContext,
  type UseAffiliatesTabContextMock,
} from '@/test/factories';

// Mock dependencies
vi.mock('../../../context/ProductContext');
vi.mock('sonner');
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock API
const mockApiCall = vi.fn();
vi.mock('@/lib/api', () => ({
  api: {
    call: (...args: unknown[]) => mockApiCall(...args),
  },
}));

describe('useAffiliatesTab', () => {
  let mockContext: UseAffiliatesTabContextMock;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mock for each test
    mockContext = createMockUseAffiliatesTabContext();

    // Configure mock - uses 'as unknown as T' pattern (RISE V3 justified)
    // Justification: vi.mocked requires full type match but we only need partial context
    vi.mocked(ProductContext.useProductContext).mockReturnValue(
      mockContext as unknown as ReturnType<typeof ProductContext.useProductContext>
    );

    mockApiCall.mockResolvedValue({
      data: { success: true },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default affiliate settings', () => {
      const { result } = renderHook(() => useAffiliatesTab());

      expect(result.current.localSettings).toEqual(mockContext.formState.editedData.affiliate);
      expect(result.current.serverSettings).toEqual(mockContext.formState.serverData.affiliateSettings);
    });

    it('should initialize with default gateway settings', () => {
      const { result } = renderHook(() => useAffiliatesTab());

      expect(result.current.gatewaySettings).toEqual({
        pix_allowed: ['asaas'],
        credit_card_allowed: ['mercadopago', 'stripe'],
        require_gateway_connection: true,
      });
    });

    it('should initialize with no changes', () => {
      const { result } = renderHook(() => useAffiliatesTab());

      expect(result.current.hasChanges).toBe(false);
    });
  });

  describe('Change Detection', () => {
    it('should detect affiliate settings changes', () => {
      const contextWithChanges = createMockUseAffiliatesTabContext({
        formState: {
          ...mockContext.formState,
          dirtyFlags: { affiliate: true },
        },
      });

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithChanges as unknown as ReturnType<typeof ProductContext.useProductContext>
      );

      const { result } = renderHook(() => useAffiliatesTab());

      expect(result.current.hasChanges).toBe(true);
    });

    it('should detect gateway settings changes', () => {
      const { result } = renderHook(() => useAffiliatesTab());

      act(() => {
        result.current.handleGatewaySettingsChange({
          pix_allowed: ['asaas', 'stripe'],
          credit_card_allowed: ['mercadopago'],
          require_gateway_connection: false,
        });
      });

      expect(result.current.hasChanges).toBe(true);
    });
  });

  describe('Affiliate Settings Handlers', () => {
    it('should handle affiliate setting change', () => {
      const { result } = renderHook(() => useAffiliatesTab());

      act(() => {
        result.current.handleChange('enabled', true);
      });

      expect(mockContext.dispatchForm).toHaveBeenCalledWith({
        type: 'EDIT_AFFILIATE',
        payload: { enabled: true },
      });
    });

    it('should handle defaultRate change', () => {
      const { result } = renderHook(() => useAffiliatesTab());

      act(() => {
        result.current.handleChange('defaultRate', 50);
      });

      expect(mockContext.dispatchForm).toHaveBeenCalledWith({
        type: 'EDIT_AFFILIATE',
        payload: { defaultRate: 50 },
      });
    });

    it('should handle cookieDuration change', () => {
      const { result } = renderHook(() => useAffiliatesTab());

      act(() => {
        result.current.handleChange('cookieDuration', 60);
      });

      expect(mockContext.dispatchForm).toHaveBeenCalledWith({
        type: 'EDIT_AFFILIATE',
        payload: { cookieDuration: 60 },
      });
    });
  });

  describe('Gateway Settings Handlers', () => {
    it('should handle gateway settings change', () => {
      const { result } = renderHook(() => useAffiliatesTab());

      const newSettings = {
        pix_allowed: ['asaas', 'mercadopago'],
        credit_card_allowed: ['stripe'],
        require_gateway_connection: false,
      };

      act(() => {
        result.current.handleGatewaySettingsChange(newSettings);
      });

      expect(result.current.gatewaySettings).toEqual(newSettings);
    });
  });

  describe('Validation', () => {
    it('should validate defaultRate minimum', async () => {
      const contextWithInvalidRate = createMockUseAffiliatesTabContext();
      contextWithInvalidRate.formState.editedData.affiliate.defaultRate = 0;

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithInvalidRate as unknown as ReturnType<typeof ProductContext.useProductContext>
      );

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('A comissão deve estar entre 1% e 90%');
      expect(mockContext.saveAffiliateSettings).not.toHaveBeenCalled();
    });

    it('should validate defaultRate maximum', async () => {
      const contextWithInvalidRate = createMockUseAffiliatesTabContext();
      contextWithInvalidRate.formState.editedData.affiliate.defaultRate = 95;

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithInvalidRate as unknown as ReturnType<typeof ProductContext.useProductContext>
      );

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('A comissão deve estar entre 1% e 90%');
    });

    it('should validate cookieDuration minimum', async () => {
      const contextWithInvalidCookie = createMockUseAffiliatesTabContext();
      contextWithInvalidCookie.formState.editedData.affiliate.cookieDuration = 0;

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithInvalidCookie as unknown as ReturnType<typeof ProductContext.useProductContext>
      );

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('A duração do cookie deve estar entre 1 e 365 dias');
    });

    it('should validate cookieDuration maximum', async () => {
      const contextWithInvalidCookie = createMockUseAffiliatesTabContext();
      contextWithInvalidCookie.formState.editedData.affiliate.cookieDuration = 400;

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithInvalidCookie as unknown as ReturnType<typeof ProductContext.useProductContext>
      );

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('A duração do cookie deve estar entre 1 e 365 dias');
    });

    it('should validate email format', async () => {
      const contextWithInvalidEmail = createMockUseAffiliatesTabContext();
      contextWithInvalidEmail.formState.editedData.affiliate.supportEmail = 'invalid-email';

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithInvalidEmail as unknown as ReturnType<typeof ProductContext.useProductContext>
      );

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('Por favor, insira um e-mail válido no formato: exemplo@dominio.com');
    });

    it('should validate marketplace description when showInMarketplace is true', async () => {
      const contextWithMarketplace = createMockUseAffiliatesTabContext();
      contextWithMarketplace.formState.editedData.affiliate.showInMarketplace = true;
      contextWithMarketplace.formState.editedData.affiliate.marketplaceDescription = '';

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithMarketplace as unknown as ReturnType<typeof ProductContext.useProductContext>
      );

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('Por favor, adicione uma descrição para o marketplace');
    });

    it('should validate marketplace description minimum length', async () => {
      const contextWithShortDesc = createMockUseAffiliatesTabContext();
      contextWithShortDesc.formState.editedData.affiliate.showInMarketplace = true;
      contextWithShortDesc.formState.editedData.affiliate.marketplaceDescription = 'Too short';

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithShortDesc as unknown as ReturnType<typeof ProductContext.useProductContext>
      );

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('A descrição do marketplace deve ter pelo menos 50 caracteres');
    });

    it('should validate marketplace description maximum length', async () => {
      const contextWithLongDesc = createMockUseAffiliatesTabContext();
      contextWithLongDesc.formState.editedData.affiliate.showInMarketplace = true;
      contextWithLongDesc.formState.editedData.affiliate.marketplaceDescription = 'a'.repeat(501);

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithLongDesc as unknown as ReturnType<typeof ProductContext.useProductContext>
      );

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('A descrição do marketplace deve ter no máximo 500 caracteres');
    });

    it('should validate marketplace category when showInMarketplace is true', async () => {
      const contextWithNoCategory = createMockUseAffiliatesTabContext();
      contextWithNoCategory.formState.editedData.affiliate.showInMarketplace = true;
      contextWithNoCategory.formState.editedData.affiliate.marketplaceDescription = 'a'.repeat(60);
      contextWithNoCategory.formState.editedData.affiliate.marketplaceCategory = '';

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithNoCategory as unknown as ReturnType<typeof ProductContext.useProductContext>
      );

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('Por favor, selecione uma categoria para o marketplace');
    });
  });

  describe('Save Operations', () => {
    it('should save affiliate settings successfully', async () => {
      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(mockApiCall).toHaveBeenCalledWith('product-settings', {
        action: 'update-affiliate-gateway-settings',
        productId: mockContext.product?.id,
        gatewaySettings: expect.any(Object),
      });

      expect(mockContext.saveAffiliateSettings).toHaveBeenCalled();
      expect(mockContext.dispatchForm).toHaveBeenCalledWith({ type: 'SAVE_SUCCESS' });
      expect(toast.success).toHaveBeenCalledWith('Configurações de afiliados salvas com sucesso');
    });

    it('should handle API error during save', async () => {
      mockApiCall.mockResolvedValue({
        data: { success: false, error: 'API Error' },
        error: null,
      });

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('Não foi possível salvar as configurações');
      expect(mockContext.saveAffiliateSettings).not.toHaveBeenCalled();
    });

    it('should handle network error during save', async () => {
      mockApiCall.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('Não foi possível salvar as configurações');
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useAffiliatesTab());

      expect(result.current).toHaveProperty('product');
      expect(result.current).toHaveProperty('localSettings');
      expect(result.current).toHaveProperty('serverSettings');
      expect(result.current).toHaveProperty('gatewaySettings');
      expect(result.current).toHaveProperty('hasChanges');
      expect(result.current).toHaveProperty('saving');
      expect(result.current).toHaveProperty('handleChange');
      expect(result.current).toHaveProperty('handleGatewaySettingsChange');
      expect(result.current).toHaveProperty('handleSave');
    });
  });
});
