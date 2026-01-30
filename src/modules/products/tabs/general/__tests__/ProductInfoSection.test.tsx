/**
 * ProductInfoSection Component - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for ProductInfoSection component including rendering, form interactions,
 * validation, and character limits.
 * 
 * @module products/tabs/general/__tests__/ProductInfoSection.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ProductInfoSection } from '../ProductInfoSection';
import { PRODUCT_FIELD_LIMITS } from '@/lib/constants/field-limits';

describe('ProductInfoSection', () => {
  const mockForm = {
    name: 'Test Product',
    description: 'Test Description with enough characters to pass the minimum requirement of 100 characters for this field',
    price: 99.99,
    support_name: '',
    support_email: '',
    delivery_url: '',
    delivery_type: 'url' as const,
  };

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
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      expect(screen.getByText('Produto')).toBeInTheDocument();
      expect(screen.getByText(/A aprovação do produto é instantânea/)).toBeInTheDocument();
    });

    it('should render product name input', () => {
      render(
        <ProductInfoSection
          form={mockForm}
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
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const descriptionTextarea = screen.getByLabelText(/Descrição/);
      expect(descriptionTextarea).toBeInTheDocument();
      expect(descriptionTextarea).toHaveValue(mockForm.description);
    });

    it('should show character counters', () => {
      render(
        <ProductInfoSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      expect(screen.getByText(`${mockForm.name.length}/${PRODUCT_FIELD_LIMITS.NAME}`)).toBeInTheDocument();
      expect(screen.getByText(`${mockForm.description.length}/${PRODUCT_FIELD_LIMITS.DESCRIPTION}`)).toBeInTheDocument();
    });
  });

  describe('Name Input Interactions', () => {
    it('should update name when typing', async () => {
      render(
        <ProductInfoSection
          form={mockForm}
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
      const errorsWithNameError = {
        ...mockErrors,
        name: 'Nome é obrigatório',
      };

      render(
        <ProductInfoSection
          form={mockForm}
          setForm={mockSetForm}
          errors={errorsWithNameError}
          clearError={mockClearError}
        />
      );

      const nameInput = screen.getByLabelText('Nome do Produto');
      
      fireEvent.change(nameInput, { target: { value: 'New Name' } });

      expect(mockClearError).toHaveBeenCalledWith('name');
    });

    it('should respect maxLength for name', () => {
      render(
        <ProductInfoSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const nameInput = screen.getByLabelText('Nome do Produto') as HTMLInputElement;
      
      expect(nameInput.maxLength).toBe(PRODUCT_FIELD_LIMITS.NAME);
    });

    it('should display name error when present', () => {
      const errorsWithNameError = {
        ...mockErrors,
        name: 'Nome é obrigatório',
      };

      render(
        <ProductInfoSection
          form={mockForm}
          setForm={mockSetForm}
          errors={errorsWithNameError}
          clearError={mockClearError}
        />
      );

      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
    });

    it('should apply error styling to name input when error exists', () => {
      const errorsWithNameError = {
        ...mockErrors,
        name: 'Nome é obrigatório',
      };

      render(
        <ProductInfoSection
          form={mockForm}
          setForm={mockSetForm}
          errors={errorsWithNameError}
          clearError={mockClearError}
        />
      );

      const nameInput = screen.getByLabelText('Nome do Produto');
      
      expect(nameInput).toHaveClass('border-red-500');
    });
  });

  describe('Description Textarea Interactions', () => {
    it('should update description when typing', async () => {
      render(
        <ProductInfoSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const descriptionTextarea = screen.getByLabelText(/Descrição/);
      
      fireEvent.change(descriptionTextarea, { target: { value: 'Updated Description' } });

      expect(mockSetForm).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should clear error when typing in description field', async () => {
      const errorsWithDescriptionError = {
        ...mockErrors,
        description: 'Descrição é obrigatória',
      };

      render(
        <ProductInfoSection
          form={mockForm}
          setForm={mockSetForm}
          errors={errorsWithDescriptionError}
          clearError={mockClearError}
        />
      );

      const descriptionTextarea = screen.getByLabelText(/Descrição/);
      
      fireEvent.change(descriptionTextarea, { target: { value: 'New Description' } });

      expect(mockClearError).toHaveBeenCalledWith('description');
    });

    it('should respect maxLength for description', () => {
      render(
        <ProductInfoSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const descriptionTextarea = screen.getByLabelText(/Descrição/) as HTMLTextAreaElement;
      
      expect(descriptionTextarea.maxLength).toBe(PRODUCT_FIELD_LIMITS.DESCRIPTION);
    });

    it('should display description error when present', () => {
      const errorsWithDescriptionError = {
        ...mockErrors,
        description: 'Descrição é obrigatória',
      };

      render(
        <ProductInfoSection
          form={mockForm}
          setForm={mockSetForm}
          errors={errorsWithDescriptionError}
          clearError={mockClearError}
        />
      );

      expect(screen.getByText('Descrição é obrigatória')).toBeInTheDocument();
    });

    it('should apply error styling to description textarea when error exists', () => {
      const errorsWithDescriptionError = {
        ...mockErrors,
        description: 'Descrição é obrigatória',
      };

      render(
        <ProductInfoSection
          form={mockForm}
          setForm={mockSetForm}
          errors={errorsWithDescriptionError}
          clearError={mockClearError}
        />
      );

      const descriptionTextarea = screen.getByLabelText(/Descrição/);
      
      expect(descriptionTextarea).toHaveClass('border-red-500');
    });

    it('should show green text when description meets minimum length', () => {
      const formWithLongDescription = {
        ...mockForm,
        description: 'a'.repeat(150),
      };

      render(
        <ProductInfoSection
          form={formWithLongDescription}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const counter = screen.getByText(`150/${PRODUCT_FIELD_LIMITS.DESCRIPTION}`);
      expect(counter).toHaveClass('text-green-500');
    });

    it('should show muted text when description is below minimum length', () => {
      const formWithShortDescription = {
        ...mockForm,
        description: 'Short',
      };

      render(
        <ProductInfoSection
          form={formWithShortDescription}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const counter = screen.getByText(`5/${PRODUCT_FIELD_LIMITS.DESCRIPTION}`);
      expect(counter).toHaveClass('text-muted-foreground');
    });
  });

  describe('Required Field Indicator', () => {
    it('should show asterisk for required description field', () => {
      render(
        <ProductInfoSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const label = screen.getByText('*');
      expect(label).toBeInTheDocument();
      expect(label).toHaveClass('text-destructive');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for inputs', () => {
      render(
        <ProductInfoSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      expect(screen.getByLabelText('Nome do Produto')).toBeInTheDocument();
      expect(screen.getByLabelText(/Descrição/)).toBeInTheDocument();
    });

    it('should have placeholder for description', () => {
      render(
        <ProductInfoSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const descriptionTextarea = screen.getByPlaceholderText('Descreva seu produto (mínimo 100 caracteres)');
      expect(descriptionTextarea).toBeInTheDocument();
    });
  });

  describe('Form State Updates', () => {
    it('should call setForm with updater function for name', () => {
      render(
        <ProductInfoSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const nameInput = screen.getByLabelText('Nome do Produto');
      fireEvent.change(nameInput, { target: { value: 'New Name' } });

      expect(mockSetForm).toHaveBeenCalledTimes(1);
      const updater = mockSetForm.mock.calls[0][0];
      expect(typeof updater).toBe('function');
    });

    it('should call setForm with updater function for description', () => {
      render(
        <ProductInfoSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const descriptionTextarea = screen.getByLabelText(/Descrição/);
      fireEvent.change(descriptionTextarea, { target: { value: 'New Description' } });

      expect(mockSetForm).toHaveBeenCalledTimes(1);
      const updater = mockSetForm.mock.calls[0][0];
      expect(typeof updater).toBe('function');
    });
  });
});
