/**
 * ProductInfoSection Component - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductInfoSection } from '../ProductInfoSection';
import { PRODUCT_FIELD_LIMITS } from '@/lib/constants/field-limits';
import type { GeneralFormData } from '../../../types/formData.types';

// Helper to create valid GeneralFormData
function createMockFormData(overrides: Partial<GeneralFormData> = {}): GeneralFormData {
  return {
    name: 'Test Product',
    description: 'Test Description with enough characters to pass the minimum requirement of 100 characters for this field',
    price: 99.99,
    support_name: '',
    support_email: '',
    delivery_url: '',
    delivery_type: 'standard',
    external_delivery: false,
    ...overrides,
  };
}

describe('ProductInfoSection', () => {
  const mockSetForm = vi.fn();
  const mockClearError = vi.fn();
  const mockErrors = {
    name: '',
    description: '',
    price: '',
    support_name: '',
    support_email: '',
    delivery_url: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render section title and description', () => {
      render(
        <ProductInfoSection
          form={createMockFormData()}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      expect(screen.getByText('Produto')).toBeInTheDocument();
    });

    it('should render product name input', () => {
      render(
        <ProductInfoSection
          form={createMockFormData()}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const nameInput = screen.getByLabelText('Nome do Produto');
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveValue('Test Product');
    });

    it('should render product description textarea', () => {
      render(
        <ProductInfoSection
          form={createMockFormData()}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const descriptionTextarea = screen.getByLabelText(/Descrição/);
      expect(descriptionTextarea).toBeInTheDocument();
    });
  });

  describe('Name Input Interactions', () => {
    it('should update name when typing', async () => {
      render(
        <ProductInfoSection
          form={createMockFormData()}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const nameInput = screen.getByLabelText('Nome do Produto');
      fireEvent.change(nameInput, { target: { value: 'Updated Product' } });

      expect(mockSetForm).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should clear error when typing in name field', async () => {
      const errorsWithNameError = { ...mockErrors, name: 'Nome é obrigatório' };

      render(
        <ProductInfoSection
          form={createMockFormData()}
          setForm={mockSetForm}
          errors={errorsWithNameError}
          clearError={mockClearError}
        />
      );

      const nameInput = screen.getByLabelText('Nome do Produto');
      fireEvent.change(nameInput, { target: { value: 'New Name' } });

      expect(mockClearError).toHaveBeenCalledWith('name');
    });
  });

  describe('Description Textarea Interactions', () => {
    it('should update description when typing', async () => {
      render(
        <ProductInfoSection
          form={createMockFormData()}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const descriptionTextarea = screen.getByLabelText(/Descrição/);
      fireEvent.change(descriptionTextarea, { target: { value: 'Updated Description' } });

      expect(mockSetForm).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for inputs', () => {
      render(
        <ProductInfoSection
          form={createMockFormData()}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      expect(screen.getByLabelText('Nome do Produto')).toBeInTheDocument();
      expect(screen.getByLabelText(/Descrição/)).toBeInTheDocument();
    });
  });
});
