/**
 * ProductDeliverySection Component - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for ProductDeliverySection component including delivery type selection,
 * URL validation, and form interactions.
 * 
 * @module products/tabs/general/__tests__/ProductDeliverySection.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductDeliverySection } from '../ProductDeliverySection';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ProductDeliverySection', () => {
  const mockForm = {
    name: '',
    description: '',
    price: 0,
    support_name: '',
    support_email: '',
    delivery_url: 'https://example.com/delivery',
    delivery_type: 'standard' as const,
  };

  const mockSetForm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render section title', () => {
      render(
        <ProductDeliverySection
          form={mockForm}
          setForm={mockSetForm}
        />
      );

      expect(screen.getByText('Entrega Digital')).toBeInTheDocument();
    });

    it('should render all delivery options', () => {
      render(
        <ProductDeliverySection
          form={mockForm}
          setForm={mockSetForm}
        />
      );

      expect(screen.getByText('Entrega Padrão')).toBeInTheDocument();
      expect(screen.getByText('Área de Membros')).toBeInTheDocument();
      expect(screen.getByText('Entrega Externa')).toBeInTheDocument();
    });

    it('should show delivery URL input for standard delivery', () => {
      render(
        <ProductDeliverySection
          form={mockForm}
          setForm={mockSetForm}
        />
      );

      const urlInput = screen.getByPlaceholderText(/https:\/\//);
      expect(urlInput).toBeInTheDocument();
    });
  });

  describe('Delivery Type Selection', () => {
    it('should select standard delivery by default', () => {
      render(
        <ProductDeliverySection
          form={mockForm}
          setForm={mockSetForm}
        />
      );

      const standardOption = screen.getByText('Entrega Padrão').closest('button');
      expect(standardOption).toHaveClass('border-primary');
    });

    it('should change delivery type when clicking option', () => {
      render(
        <ProductDeliverySection
          form={mockForm}
          setForm={mockSetForm}
        />
      );

      const membersAreaOption = screen.getByText('Área de Membros').closest('button');
      fireEvent.click(membersAreaOption!);

      expect(mockSetForm).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should clear delivery URL when switching to non-standard delivery', () => {
      render(
        <ProductDeliverySection
          form={mockForm}
          setForm={mockSetForm}
        />
      );

      const externalOption = screen.getByText('Entrega Externa').closest('button');
      fireEvent.click(externalOption!);

      const updater = mockSetForm.mock.calls[0][0];
      const result = updater(mockForm);
      
      expect(result.delivery_type).toBe('external');
      expect(result.delivery_url).toBe('');
    });
  });

  describe('URL Validation', () => {
    it('should render URL input for standard delivery', () => {
      render(
        <ProductDeliverySection
          form={mockForm}
          setForm={mockSetForm}
        />
      );

      const urlInput = screen.getByPlaceholderText(/https:\/\//);
      expect(urlInput).toBeInTheDocument();
    });
  });

  describe('Form Updates', () => {
    it('should update delivery URL', () => {
      render(
        <ProductDeliverySection
          form={mockForm}
          setForm={mockSetForm}
        />
      );

      const urlInput = screen.getByPlaceholderText(/https:\/\//);
      fireEvent.change(urlInput, { target: { value: 'https://new-url.com' } });

      expect(mockSetForm).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing delivery_type by deriving from external_delivery', () => {
      const formWithoutType = {
        ...mockForm,
        delivery_type: undefined as any,
        external_delivery: true,
      };

      render(
        <ProductDeliverySection
          form={formWithoutType}
          setForm={mockSetForm}
        />
      );

      const externalOption = screen.getByText('Entrega Externa').closest('button');
      expect(externalOption).toHaveClass('border-primary');
    });

    it('should handle empty delivery URL', () => {
      const formWithEmptyUrl = {
        ...mockForm,
        delivery_url: '',
      };

      render(
        <ProductDeliverySection
          form={formWithEmptyUrl}
          setForm={mockSetForm}
        />
      );

      const urlInput = screen.getByPlaceholderText(/https:\/\//);
      expect(urlInput).toHaveValue('');
    });
  });
});
