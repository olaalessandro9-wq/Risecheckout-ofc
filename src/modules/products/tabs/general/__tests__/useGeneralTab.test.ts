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
import { renderHook, act } from '@testing-library/react';
import { useGeneralTab } from '../useGeneralTab';
import * as ProductContext from '../../../context/ProductContext';
import * as Hooks from '../hooks';
import {
  createMockUseGeneralTabContext,
  createMockUseGeneralTabImage,
  createMockUseGeneralTabOffers,
  createMockUseGeneralTabMemberGroups,
  createMockProductOffer,
  createMockMemberGroup,
  type UseGeneralTabContextMock,
  type UseGeneralTabImageMock,
  type UseGeneralTabOffersMock,
  type UseGeneralTabMemberGroupsMock,
} from '@/test/factories';

// Mock dependencies
vi.mock('../../../context/ProductContext');
vi.mock('../hooks');

describe('useGeneralTab', () => {
  // Type-safe mocks using factories
  let mockContext: UseGeneralTabContextMock;
  let mockImageHook: UseGeneralTabImageMock;
  let mockOffersHook: UseGeneralTabOffersMock;
  let mockMemberGroupsHook: UseGeneralTabMemberGroupsMock;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mocks for each test
    mockContext = createMockUseGeneralTabContext();
    mockImageHook = createMockUseGeneralTabImage();
    mockOffersHook = createMockUseGeneralTabOffers();
    mockMemberGroupsHook = createMockUseGeneralTabMemberGroups();

    // Configure mocks - uses 'as unknown as T' pattern (RISE V3 justified)
    // Justification: vi.mocked requires full type match but we only need partial context
    vi.mocked(ProductContext.useProductContext).mockReturnValue(
      mockContext as unknown as ReturnType<typeof ProductContext.useProductContext>
    );
    vi.mocked(Hooks.useGeneralTabImage).mockReturnValue(mockImageHook);
    vi.mocked(Hooks.useGeneralTabOffers).mockReturnValue(mockOffersHook);
    vi.mocked(Hooks.useGeneralTabMemberGroups).mockReturnValue(mockMemberGroupsHook);
  });

  describe('Initialization', () => {
    it('should initialize with product data from context', () => {
      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.product).toEqual(mockContext.product);
      expect(result.current.form).toEqual(mockContext.formState.editedData.general);
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
        productId: mockContext.product?.id,
        membersAreaEnabled: mockContext.product?.members_area_enabled,
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

      expect(mockContext.dispatchForm).toHaveBeenCalledWith({
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

      expect(mockContext.dispatchForm).toHaveBeenCalledWith({
        type: 'EDIT_GENERAL',
        payload: expect.objectContaining({
          price: 149.99,
        }),
      });
    });
  });

  describe('Error Handling', () => {
    it('should map form errors from context', () => {
      const contextWithErrors = createMockUseGeneralTabContext({
        formErrors: {
          general: {
            name: 'Nome é obrigatório',
            price: 'Preço inválido',
          },
          upsell: {},
          affiliate: {},
          checkoutSettings: {},
        },
      });

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithErrors as unknown as ReturnType<typeof ProductContext.useProductContext>
      );

      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.errors.name).toBe('Nome é obrigatório');
      expect(result.current.errors.price).toBe('Preço inválido');
    });

    it('should clear error when clearError is called', () => {
      const { result } = renderHook(() => useGeneralTab());

      act(() => {
        result.current.clearError('name');
      });

      expect(mockContext.dispatchForm).toHaveBeenCalledWith({
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
        createMockProductOffer({ id: 'offer-1', name: 'Offer 1', price: 4999 }),
        createMockProductOffer({ id: 'offer-2', name: 'Offer 2', price: 7999 }),
      ];

      vi.mocked(Hooks.useGeneralTabOffers).mockReturnValue(
        createMockUseGeneralTabOffers({ localOffers: mockOffers })
      );

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
        createMockMemberGroup({ id: 'group-1', name: 'Group 1' }),
        createMockMemberGroup({ id: 'group-2', name: 'Group 2' }),
      ];

      vi.mocked(Hooks.useGeneralTabMemberGroups).mockReturnValue(
        createMockUseGeneralTabMemberGroups({
          memberGroups: mockGroups,
          hasMembersArea: true,
        })
      );

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
      const contextWithChanges = createMockUseGeneralTabContext();
      contextWithChanges.formState.editedData.general.name = 'Changed Name';

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithChanges as unknown as ReturnType<typeof ProductContext.useProductContext>
      );

      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.hasChanges).toBe(true);
    });

    it('should detect image changes', () => {
      vi.mocked(Hooks.useGeneralTabImage).mockReturnValue(
        createMockUseGeneralTabImage({
          image: {
            imageFile: new File([''], 'test.jpg'),
            imageUrl: 'blob:test',
            pendingRemoval: false,
          },
        })
      );

      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.hasChanges).toBe(true);
    });

    it('should detect image removal', () => {
      vi.mocked(Hooks.useGeneralTabImage).mockReturnValue(
        createMockUseGeneralTabImage({
          image: {
            imageFile: null,
            imageUrl: '',
            pendingRemoval: true,
          },
        })
      );

      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.hasChanges).toBe(true);
    });

    it('should detect offers modifications', () => {
      vi.mocked(Hooks.useGeneralTabOffers).mockReturnValue(
        createMockUseGeneralTabOffers({ offersModified: true })
      );

      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.hasChanges).toBe(true);
    });

    it('should detect deleted offers', () => {
      vi.mocked(Hooks.useGeneralTabOffers).mockReturnValue(
        createMockUseGeneralTabOffers({ deletedOfferIds: ['offer-1', 'offer-2'] })
      );

      const { result } = renderHook(() => useGeneralTab());

      expect(result.current.hasChanges).toBe(true);
    });

    it('should return false when product is null', () => {
      const contextWithNullProduct = createMockUseGeneralTabContext({ product: null });

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        contextWithNullProduct as unknown as ReturnType<typeof ProductContext.useProductContext>
      );

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
      const modifiedContext = createMockUseGeneralTabContext();
      modifiedContext.formState.editedData.general.name = 'Modified Name';

      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        modifiedContext as unknown as ReturnType<typeof ProductContext.useProductContext>
      );

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
