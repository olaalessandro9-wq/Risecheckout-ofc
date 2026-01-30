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
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAffiliatesTab } from '../useAffiliatesTab';
import * as ProductContext from '../../../context/ProductContext';
import { toast } from 'sonner';

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
    call: (...args: any[]) => mockApiCall(...args),
  },
}));

describe('useAffiliatesTab', () => {
  const mockProduct = {
    id: 'test-product-id',
    name: 'Test Product',
  };

  const mockFormState = {
    serverData: {
      affiliateSettings: {
        enabled: false,
        defaultRate: 30,
        cookieDuration: 30,
        attributionModel: 'last_click' as const,
        requireApproval: true,
        commissionOnOrderBump: false,
        commissionOnUpsell: false,
        supportEmail: '',
        publicDescription: '',
        showInMarketplace: false,
        marketplaceDescription: '',
        marketplaceCategory: '',
      },
    },
    editedData: {
      affiliate: {
        enabled: false,
        defaultRate: 30,
        cookieDuration: 30,
        attributionModel: 'last_click' as const,
        requireApproval: true,
        commissionOnOrderBump: false,
        commissionOnUpsell: false,
        supportEmail: '',
        publicDescription: '',
        showInMarketplace: false,
        marketplaceDescription: '',
        marketplaceCategory: '',
      },
    },
    dirtyFlags: {
      affiliate: false,
    },
  };

  const mockDispatchForm = vi.fn();
  const mockSaveAffiliateSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(ProductContext.useProductContext).mockReturnValue({
      product: mockProduct,
      formState: mockFormState,
      dispatchForm: mockDispatchForm,
      saveAffiliateSettings: mockSaveAffiliateSettings,
      saving: false,
    } as any);

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

      expect(result.current.localSettings).toEqual(mockFormState.editedData.affiliate);
      expect(result.current.serverSettings).toEqual(mockFormState.serverData.affiliateSettings);
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
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: mockProduct,
        formState: {
          ...mockFormState,
          dirtyFlags: {
            affiliate: true,
          },
        },
        dispatchForm: mockDispatchForm,
        saveAffiliateSettings: mockSaveAffiliateSettings,
        saving: false,
      } as any);

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

      expect(mockDispatchForm).toHaveBeenCalledWith({
        type: 'EDIT_AFFILIATE',
        payload: { enabled: true },
      });
    });

    it('should handle defaultRate change', () => {
      const { result } = renderHook(() => useAffiliatesTab());

      act(() => {
        result.current.handleChange('defaultRate', 50);
      });

      expect(mockDispatchForm).toHaveBeenCalledWith({
        type: 'EDIT_AFFILIATE',
        payload: { defaultRate: 50 },
      });
    });

    it('should handle cookieDuration change', () => {
      const { result } = renderHook(() => useAffiliatesTab());

      act(() => {
        result.current.handleChange('cookieDuration', 60);
      });

      expect(mockDispatchForm).toHaveBeenCalledWith({
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
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: mockProduct,
        formState: {
          ...mockFormState,
          editedData: {
            affiliate: {
              ...mockFormState.editedData.affiliate,
              defaultRate: 0,
            },
          },
        },
        dispatchForm: mockDispatchForm,
        saveAffiliateSettings: mockSaveAffiliateSettings,
        saving: false,
      } as any);

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('A comissão deve estar entre 1% e 90%');
      expect(mockSaveAffiliateSettings).not.toHaveBeenCalled();
    });

    it('should validate defaultRate maximum', async () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: mockProduct,
        formState: {
          ...mockFormState,
          editedData: {
            affiliate: {
              ...mockFormState.editedData.affiliate,
              defaultRate: 95,
            },
          },
        },
        dispatchForm: mockDispatchForm,
        saveAffiliateSettings: mockSaveAffiliateSettings,
        saving: false,
      } as any);

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('A comissão deve estar entre 1% e 90%');
    });

    it('should validate cookieDuration minimum', async () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: mockProduct,
        formState: {
          ...mockFormState,
          editedData: {
            affiliate: {
              ...mockFormState.editedData.affiliate,
              cookieDuration: 0,
            },
          },
        },
        dispatchForm: mockDispatchForm,
        saveAffiliateSettings: mockSaveAffiliateSettings,
        saving: false,
      } as any);

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('A duração do cookie deve estar entre 1 e 365 dias');
    });

    it('should validate cookieDuration maximum', async () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: mockProduct,
        formState: {
          ...mockFormState,
          editedData: {
            affiliate: {
              ...mockFormState.editedData.affiliate,
              cookieDuration: 400,
            },
          },
        },
        dispatchForm: mockDispatchForm,
        saveAffiliateSettings: mockSaveAffiliateSettings,
        saving: false,
      } as any);

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('A duração do cookie deve estar entre 1 e 365 dias');
    });

    it('should validate email format', async () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: mockProduct,
        formState: {
          ...mockFormState,
          editedData: {
            affiliate: {
              ...mockFormState.editedData.affiliate,
              supportEmail: 'invalid-email',
            },
          },
        },
        dispatchForm: mockDispatchForm,
        saveAffiliateSettings: mockSaveAffiliateSettings,
        saving: false,
      } as any);

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('Por favor, insira um e-mail válido no formato: exemplo@dominio.com');
    });

    it('should validate marketplace description when showInMarketplace is true', async () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: mockProduct,
        formState: {
          ...mockFormState,
          editedData: {
            affiliate: {
              ...mockFormState.editedData.affiliate,
              showInMarketplace: true,
              marketplaceDescription: '',
            },
          },
        },
        dispatchForm: mockDispatchForm,
        saveAffiliateSettings: mockSaveAffiliateSettings,
        saving: false,
      } as any);

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('Por favor, adicione uma descrição para o marketplace');
    });

    it('should validate marketplace description minimum length', async () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: mockProduct,
        formState: {
          ...mockFormState,
          editedData: {
            affiliate: {
              ...mockFormState.editedData.affiliate,
              showInMarketplace: true,
              marketplaceDescription: 'Too short',
            },
          },
        },
        dispatchForm: mockDispatchForm,
        saveAffiliateSettings: mockSaveAffiliateSettings,
        saving: false,
      } as any);

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('A descrição do marketplace deve ter pelo menos 50 caracteres');
    });

    it('should validate marketplace description maximum length', async () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: mockProduct,
        formState: {
          ...mockFormState,
          editedData: {
            affiliate: {
              ...mockFormState.editedData.affiliate,
              showInMarketplace: true,
              marketplaceDescription: 'a'.repeat(501),
            },
          },
        },
        dispatchForm: mockDispatchForm,
        saveAffiliateSettings: mockSaveAffiliateSettings,
        saving: false,
      } as any);

      const { result } = renderHook(() => useAffiliatesTab());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(toast.error).toHaveBeenCalledWith('A descrição do marketplace deve ter no máximo 500 caracteres');
    });

    it('should validate marketplace category when showInMarketplace is true', async () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: mockProduct,
        formState: {
          ...mockFormState,
          editedData: {
            affiliate: {
              ...mockFormState.editedData.affiliate,
              showInMarketplace: true,
              marketplaceDescription: 'a'.repeat(60),
              marketplaceCategory: '',
            },
          },
        },
        dispatchForm: mockDispatchForm,
        saveAffiliateSettings: mockSaveAffiliateSettings,
        saving: false,
      } as any);

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
        productId: mockProduct.id,
        gatewaySettings: expect.any(Object),
      });

      expect(mockSaveAffiliateSettings).toHaveBeenCalled();
      expect(mockDispatchForm).toHaveBeenCalledWith({ type: 'SAVE_SUCCESS' });
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
      expect(mockSaveAffiliateSettings).not.toHaveBeenCalled();
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
