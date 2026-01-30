/**
 * useGeneralTab Hook - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for useGeneralTab hook including state management, form handling,
 * image operations, offers management, and change detection.
 * 
 * @module products/tabs/general/__tests__/useGeneralTab.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGeneralTab } from '../useGeneralTab';
import * as ProductContext from '../../../context/ProductContext';
import * as Hooks from '../hooks';

// Mock dependencies
vi.mock('../../../context/ProductContext');
vi.mock('../hooks');

describe('useGeneralTab', () => {
  const mockProduct = {
    id: 'test-product-id',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    image_url: 'https://example.com/image.jpg',
    support_name: 'Support Team',
    support_email: 'support@example.com',
    delivery_url: 'https://example.com/delivery',
    delivery_type: 'url',
    members_area_enabled: false,
  };

  const mockFormState = {
    serverData: {
      general: {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        support_name: 'Support Team',
        support_email: 'support@example.com',
        delivery_url: 'https://example.com/delivery',
        delivery_type: 'url',
      },
    },
    editedData: {
      general: {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        support_name: 'Support Team',
        support_email: 'support@example.com',
        delivery_url: 'https://example.com/delivery',
        delivery_type: 'url',
      },
    },
  };

  const mockDispatchForm = vi.fn();
  const mockFormErrors = { general: {} };

  const mockImageHook = {
    image: {
      imageFile: null,
      imagePreview: null,
      pendingRemoval: false,
    },
    handleImageFileChange: vi.fn(),
    handleImageUrlChange: vi.fn(),
    handleRemoveImage: vi.fn(),
  };

  const mockOffersHook = {
    localOffers: [],
    offersModified: false,
    deletedOfferIds: [],
    handleOffersChange: vi.fn(),
    handleOffersModifiedChange: vi.fn(),
    handleOfferDeleted: vi.fn(),
  };

  const mockMemberGroupsHook = {
    memberGroups: [],
    hasMembersArea: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(ProductContext.useProductContext).mockReturnValue({
      product: mockProduct,
      formState: mockFormState,
      dispatchForm: mockDispatchForm,
      formErrors: mockFormErrors,
    } as any);

    vi.mocked(Hooks.useGeneralTabImage).mockReturnValue(mockImageHook as any);
    vi.mocked(Hooks.useGeneralTabOffers).mockReturnValue(mockOffersHook as any);
    vi.mocked(Hooks.useGeneralTabMemberGroups).mockReturnValue(mockMemberGroupsHook as any);
  });

  describe('Initialization', () => {
    it('should initialize with product data from context', () => {
      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.product).toEqual(mockProduct);
      expect(result.current.form).toEqual(mockFormState.editedData.general);
    });

    it('should initialize with empty errors', () => {
      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.errors).toEqual({
        name: '',
        description: '',
        price: '',
        support_name: '',
        support_email: '',
        delivery_url: '',
      });
    });

    it('should call all sub-hooks', () => {
      renderHook(() => useGeneralTab());

      expect(Hooks.useGeneralTabImage).toHaveBeenCalled();
      expect(Hooks.useGeneralTabOffers).toHaveBeenCalled();
      expect(Hooks.useGeneralTabMemberGroups).toHaveBeenCalledWith({
        productId: mockProduct.id,
        membersAreaEnabled: mockProduct.members_area_enabled,
      });
    });
  });

  describe('Form State Management', () => {
    it('should provide form data from context', () => {
      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.form.name).toBe('Test Product');
      expect(result.current.form.price).toBe(99.99);
    });

    it('should dispatch EDIT_GENERAL action when setForm is called with object', () => {
      const { result } = renderHook(() => useGeneralTab());

      act(() => {
        result.current.setForm({
          ...result.current.form,
          name: 'Updated Product',
        });
      });

      expect(mockDispatchForm).toHaveBeenCalledWith({
        type: 'EDIT_GENERAL',
        payload: expect.objectContaining({
          name: 'Updated Product',
        }),
      });
    });

    it('should dispatch EDIT_GENERAL action when setForm is called with function', () => {
      const { result } = renderHook(() => useGeneralTab());

      act(() => {
        result.current.setForm((prev) => ({
          ...prev,
          price: 149.99,
        }));
      });

      expect(mockDispatchForm).toHaveBeenCalledWith({
        type: 'EDIT_GENERAL',
        payload: expect.objectContaining({
          price: 149.99,
        }),
      });
    });
  });

  describe('Error Handling', () => {
    it('should map form errors from context', () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: mockProduct,
        formState: mockFormState,
        dispatchForm: mockDispatchForm,
        formErrors: {
          general: {
            name: 'Nome é obrigatório',
            price: 'Preço inválido',
          },
        },
      } as any);

      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.errors.name).toBe('Nome é obrigatório');
      expect(result.current.errors.price).toBe('Preço inválido');
    });

    it('should clear error when clearError is called', () => {
      const { result } = renderHook(() => useGeneralTab());

      act(() => {
        result.current.clearError('name');
      });

      expect(mockDispatchForm).toHaveBeenCalledWith({
        type: 'SET_VALIDATION_ERROR',
        section: 'general',
        field: 'name',
        error: undefined,
      });
    });
  });

  describe('Image Handling', () => {
    it('should provide image state from hook', () => {
      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.image).toEqual(mockImageHook.image);
    });

    it('should provide image handlers from hook', () => {
      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.handleImageFileChange).toBe(mockImageHook.handleImageFileChange);
      expect(result.current.handleImageUrlChange).toBe(mockImageHook.handleImageUrlChange);
      expect(result.current.handleRemoveImage).toBe(mockImageHook.handleRemoveImage);
    });
  });

  describe('Offers Handling', () => {
    it('should provide offers state from hook', () => {
      const mockOffers = [
        { id: 'offer-1', name: 'Offer 1', price: 49.99 },
        { id: 'offer-2', name: 'Offer 2', price: 79.99 },
      ];

      vi.mocked(Hooks.useGeneralTabOffers).mockReturnValue({
        ...mockOffersHook,
        localOffers: mockOffers,
      } as any);

      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.localOffers).toEqual(mockOffers);
    });

    it('should provide offers handlers from hook', () => {
      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.handleOffersChange).toBe(mockOffersHook.handleOffersChange);
      expect(result.current.handleOffersModifiedChange).toBe(mockOffersHook.handleOffersModifiedChange);
      expect(result.current.handleOfferDeleted).toBe(mockOffersHook.handleOfferDeleted);
    });
  });

  describe('Member Groups', () => {
    it('should provide member groups from hook', () => {
      const mockGroups = [
        { id: 'group-1', name: 'Group 1' },
        { id: 'group-2', name: 'Group 2' },
      ];

      vi.mocked(Hooks.useGeneralTabMemberGroups).mockReturnValue({
        memberGroups: mockGroups,
        hasMembersArea: true,
      } as any);

      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.memberGroups).toEqual(mockGroups);
      expect(result.current.hasMembersArea).toBe(true);
    });
  });

  describe('Change Detection', () => {
    it('should detect no changes when data matches server', () => {
      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.hasChanges).toBe(false);
    });

    it('should detect form changes', () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: mockProduct,
        formState: {
          ...mockFormState,
          editedData: {
            general: {
              ...mockFormState.editedData.general,
              name: 'Changed Name',
            },
          },
        },
        dispatchForm: mockDispatchForm,
        formErrors: mockFormErrors,
      } as any);

      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.hasChanges).toBe(true);
    });

    it('should detect image changes', () => {
      vi.mocked(Hooks.useGeneralTabImage).mockReturnValue({
        ...mockImageHook,
        image: {
          imageFile: new File([''], 'test.jpg'),
          imagePreview: 'blob:test',
          pendingRemoval: false,
        },
      } as any);

      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.hasChanges).toBe(true);
    });

    it('should detect image removal', () => {
      vi.mocked(Hooks.useGeneralTabImage).mockReturnValue({
        ...mockImageHook,
        image: {
          imageFile: null,
          imagePreview: null,
          pendingRemoval: true,
        },
      } as any);

      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.hasChanges).toBe(true);
    });

    it('should detect offers modifications', () => {
      vi.mocked(Hooks.useGeneralTabOffers).mockReturnValue({
        ...mockOffersHook,
        offersModified: true,
      } as any);

      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.hasChanges).toBe(true);
    });

    it('should detect deleted offers', () => {
      vi.mocked(Hooks.useGeneralTabOffers).mockReturnValue({
        ...mockOffersHook,
        deletedOfferIds: ['offer-1', 'offer-2'],
      } as any);

      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.hasChanges).toBe(true);
    });

    it('should return false when product is null', () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: null,
        formState: mockFormState,
        dispatchForm: mockDispatchForm,
        formErrors: mockFormErrors,
      } as any);

      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.hasChanges).toBe(false);
    });
  });

  describe('Memoization', () => {
    it('should memoize hasChanges calculation', () => {
      const { result, rerender } = renderHook(() => useGeneralTab());

      const firstHasChanges = result.current.hasChanges;
      rerender();
      const secondHasChanges = result.current.hasChanges;

      expect(firstHasChanges).toBe(secondHasChanges);
    });

    it('should update hasChanges when dependencies change', () => {
      const { result, rerender } = renderHook(() => useGeneralTab());

      expect(result.current.hasChanges).toBe(false);

      // Change the mock to return modified data
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: mockProduct,
        formState: {
          ...mockFormState,
          editedData: {
            general: {
              ...mockFormState.editedData.general,
              name: 'Modified Name',
            },
          },
        },
        dispatchForm: mockDispatchForm,
        formErrors: mockFormErrors,
      } as any);

      rerender();

      expect(result.current.hasChanges).toBe(true);
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useGeneralTab());

      expect(result.current).toHaveProperty('product');
      expect(result.current).toHaveProperty('form');
      expect(result.current).toHaveProperty('setForm');
      expect(result.current).toHaveProperty('errors');
      expect(result.current).toHaveProperty('clearError');
      expect(result.current).toHaveProperty('image');
      expect(result.current).toHaveProperty('localOffers');
      expect(result.current).toHaveProperty('hasChanges');
      expect(result.current).toHaveProperty('memberGroups');
      expect(result.current).toHaveProperty('hasMembersArea');
      expect(result.current).toHaveProperty('handleImageFileChange');
      expect(result.current).toHaveProperty('handleImageUrlChange');
      expect(result.current).toHaveProperty('handleRemoveImage');
      expect(result.current).toHaveProperty('handleOffersChange');
      expect(result.current).toHaveProperty('handleOffersModifiedChange');
      expect(result.current).toHaveProperty('handleOfferDeleted');
    });
  });
});
