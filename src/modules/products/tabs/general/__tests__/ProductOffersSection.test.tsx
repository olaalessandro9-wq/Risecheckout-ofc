/**
 * ProductOffersSection Component - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for ProductOffersSection component including integration with
 * OffersManager and ProductContext.
 * 
 * @module products/tabs/general/__tests__/ProductOffersSection.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductOffersSection } from '../ProductOffersSection';
import * as ProductContext from '../../../context/ProductContext';

// Mock dependencies
vi.mock('../../../context/ProductContext', () => ({
  useProductContext: vi.fn(),
}));

const mockOffersManager = vi.fn();
vi.mock('@/components/products/OffersManager', () => ({
  OffersManager: (props: any) => {
    mockOffersManager(props);
    return (
      <div data-testid="offers-manager">
        <div data-testid="product-id">{props.productId}</div>
        <div data-testid="product-name">{props.productName}</div>
        <div data-testid="offers-count">{props.offers.length}</div>
        <div data-testid="default-price">{props.defaultPrice}</div>
        <div data-testid="member-groups-count">{props.memberGroups?.length || 0}</div>
        <div data-testid="has-members-area">{props.hasMembersArea ? 'yes' : 'no'}</div>
      </div>
    );
  },
}));

describe('ProductOffersSection', () => {
  const mockForm = {
    name: 'Test Product',
    description: '',
    price: 99.99,
    support_name: '',
    support_email: '',
    delivery_url: '',
    delivery_type: 'standard' as const,
    external_delivery: false,
  };

  const mockOffers = [
    { id: 'offer-1', name: 'Offer 1', price: 49.99, product_id: 'prod-1', status: 'active', is_default: false, member_group_id: null, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { id: 'offer-2', name: 'Offer 2', price: 79.99, product_id: 'prod-1', status: 'active', is_default: true, member_group_id: null, created_at: '2026-01-01', updated_at: '2026-01-01' },
  ];

  const mockMemberGroups = [
    { id: 'group-1', name: 'Group 1', is_default: false },
    { id: 'group-2', name: 'Group 2', is_default: true },
  ];

  const mockOnOffersChange = vi.fn();
  const mockOnModifiedChange = vi.fn();
  const mockOnOfferDeleted = vi.fn();
  const mockRefreshAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ProductContext.useProductContext).mockReturnValue({
      refreshAll: mockRefreshAll,
    } as any);
  });

  describe('Rendering', () => {
    it('should render OffersManager component', () => {
      render(
        <ProductOffersSection
          productId="test-product-id"
          form={mockForm}
          offers={mockOffers}
          onOffersChange={mockOnOffersChange}
          onModifiedChange={mockOnModifiedChange}
          onOfferDeleted={mockOnOfferDeleted}
        />
      );

      expect(screen.getByTestId('offers-manager')).toBeInTheDocument();
    });

    it('should pass productId to OffersManager', () => {
      render(
        <ProductOffersSection
          productId="test-product-id"
          form={mockForm}
          offers={mockOffers}
          onOffersChange={mockOnOffersChange}
          onModifiedChange={mockOnModifiedChange}
          onOfferDeleted={mockOnOfferDeleted}
        />
      );

      expect(screen.getByTestId('product-id')).toHaveTextContent('test-product-id');
    });

    it('should pass product name to OffersManager', () => {
      render(
        <ProductOffersSection
          productId="test-product-id"
          form={mockForm}
          offers={mockOffers}
          onOffersChange={mockOnOffersChange}
          onModifiedChange={mockOnModifiedChange}
          onOfferDeleted={mockOnOfferDeleted}
        />
      );

      expect(screen.getByTestId('product-name')).toHaveTextContent('Test Product');
    });

    it('should pass offers to OffersManager', () => {
      render(
        <ProductOffersSection
          productId="test-product-id"
          form={mockForm}
          offers={mockOffers}
          onOffersChange={mockOnOffersChange}
          onModifiedChange={mockOnModifiedChange}
          onOfferDeleted={mockOnOfferDeleted}
        />
      );

      expect(screen.getByTestId('offers-count')).toHaveTextContent('2');
    });
  });

  describe('OffersManager Integration', () => {
    it('should pass all required props to OffersManager', () => {
      render(
        <ProductOffersSection
          productId="test-product-id"
          form={mockForm}
          offers={mockOffers}
          onOffersChange={mockOnOffersChange}
          onModifiedChange={mockOnModifiedChange}
          onOfferDeleted={mockOnOfferDeleted}
        />
      );

      expect(mockOffersManager).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'test-product-id',
          productName: 'Test Product',
          defaultPrice: '99.99',
          offers: mockOffers,
          onOffersChange: mockOnOffersChange,
          onModifiedChange: mockOnModifiedChange,
          onOfferDeleted: mockOnOfferDeleted,
          onOfferCreated: expect.any(Function),
        })
      );
    });

    it('should pass memberGroups when provided', () => {
      render(
        <ProductOffersSection
          productId="test-product-id"
          form={mockForm}
          offers={mockOffers}
          onOffersChange={mockOnOffersChange}
          onModifiedChange={mockOnModifiedChange}
          onOfferDeleted={mockOnOfferDeleted}
          memberGroups={mockMemberGroups}
        />
      );

      expect(screen.getByTestId('member-groups-count')).toHaveTextContent('2');
    });

    it('should pass hasMembersArea when provided', () => {
      render(
        <ProductOffersSection
          productId="test-product-id"
          form={mockForm}
          offers={mockOffers}
          onOffersChange={mockOnOffersChange}
          onModifiedChange={mockOnModifiedChange}
          onOfferDeleted={mockOnOfferDeleted}
          hasMembersArea={true}
        />
      );

      expect(screen.getByTestId('has-members-area')).toHaveTextContent('yes');
    });

    it('should use default values for optional props', () => {
      render(
        <ProductOffersSection
          productId="test-product-id"
          form={mockForm}
          offers={mockOffers}
          onOffersChange={mockOnOffersChange}
          onModifiedChange={mockOnModifiedChange}
          onOfferDeleted={mockOnOfferDeleted}
        />
      );

      expect(screen.getByTestId('member-groups-count')).toHaveTextContent('0');
      expect(screen.getByTestId('has-members-area')).toHaveTextContent('no');
    });
  });

  describe('ProductContext Integration', () => {
    it('should call useProductContext', () => {
      render(
        <ProductOffersSection
          productId="test-product-id"
          form={mockForm}
          offers={mockOffers}
          onOffersChange={mockOnOffersChange}
          onModifiedChange={mockOnModifiedChange}
          onOfferDeleted={mockOnOfferDeleted}
        />
      );

      expect(ProductContext.useProductContext).toHaveBeenCalled();
    });

    it('should provide onOfferCreated handler that calls refreshAll', () => {
      render(
        <ProductOffersSection
          productId="test-product-id"
          form={mockForm}
          offers={mockOffers}
          onOffersChange={mockOnOffersChange}
          onModifiedChange={mockOnModifiedChange}
          onOfferDeleted={mockOnOfferDeleted}
        />
      );

      const onOfferCreated = mockOffersManager.mock.calls[0][0].onOfferCreated;
      onOfferCreated();

      expect(mockRefreshAll).toHaveBeenCalled();
    });
  });

  describe('Price Formatting', () => {
    it('should convert price to string for OffersManager', () => {
      render(
        <ProductOffersSection
          productId="test-product-id"
          form={mockForm}
          offers={mockOffers}
          onOffersChange={mockOnOffersChange}
          onModifiedChange={mockOnModifiedChange}
          onOfferDeleted={mockOnOfferDeleted}
        />
      );

      expect(screen.getByTestId('default-price')).toHaveTextContent('99.99');
    });

    it('should handle zero price', () => {
      const formWithZeroPrice = {
        ...mockForm,
        price: 0,
      };

      render(
        <ProductOffersSection
          productId="test-product-id"
          form={formWithZeroPrice}
          offers={mockOffers}
          onOffersChange={mockOnOffersChange}
          onModifiedChange={mockOnModifiedChange}
          onOfferDeleted={mockOnOfferDeleted}
        />
      );

      expect(screen.getByTestId('default-price')).toHaveTextContent('0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty offers array', () => {
      render(
        <ProductOffersSection
          productId="test-product-id"
          form={mockForm}
          offers={[]}
          onOffersChange={mockOnOffersChange}
          onModifiedChange={mockOnModifiedChange}
          onOfferDeleted={mockOnOfferDeleted}
        />
      );

      expect(screen.getByTestId('offers-count')).toHaveTextContent('0');
    });

    it('should handle empty member groups', () => {
      render(
        <ProductOffersSection
          productId="test-product-id"
          form={mockForm}
          offers={mockOffers}
          onOffersChange={mockOnOffersChange}
          onModifiedChange={mockOnModifiedChange}
          onOfferDeleted={mockOnOfferDeleted}
          memberGroups={[]}
        />
      );

      expect(screen.getByTestId('member-groups-count')).toHaveTextContent('0');
    });
  });
});
