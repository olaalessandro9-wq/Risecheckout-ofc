/**
 * ProductSupportSection Component - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for ProductSupportSection component including form interactions,
 * validation, and error handling.
 * 
 * @module products/tabs/general/__tests__/ProductSupportSection.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductSupportSection } from '../ProductSupportSection';

describe('ProductSupportSection', () => {
  const mockForm = {
    name: '',
    description: '',
    price: 0,
    support_name: 'John Doe',
    support_email: 'support@example.com',
    delivery_url: '',
    delivery_type: 'standard' as const,
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
        <ProductSupportSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      expect(screen.getByText('Suporte ao Cliente')).toBeInTheDocument();
      expect(screen.getByText(/Aprenda como preencher/)).toBeInTheDocument();
    });

    it('should render support name input', () => {
      render(
        <ProductSupportSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const nameInput = screen.getByLabelText(/Nome de exibição do produtor/);
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveValue('John Doe');
    });

    it('should render support email input', () => {
      render(
        <ProductSupportSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const emailInput = screen.getByLabelText(/E-mail de suporte/);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveValue('support@example.com');
    });

    it('should show required field indicators', () => {
      render(
        <ProductSupportSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const asterisks = screen.getAllByText('*');
      expect(asterisks).toHaveLength(2);
    });
  });

  describe('Form Interactions', () => {
    it('should update support name', () => {
      render(
        <ProductSupportSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const nameInput = screen.getByLabelText(/Nome de exibição do produtor/);
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

      expect(mockSetForm).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should update support email', () => {
      render(
        <ProductSupportSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const emailInput = screen.getByLabelText(/E-mail de suporte/);
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

      expect(mockSetForm).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should clear error when typing in support name', () => {
      const errorsWithNameError = {
        ...mockErrors,
        support_name: 'Nome é obrigatório',
      };

      render(
        <ProductSupportSection
          form={mockForm}
          setForm={mockSetForm}
          errors={errorsWithNameError}
          clearError={mockClearError}
        />
      );

      const nameInput = screen.getByLabelText(/Nome de exibição do produtor/);
      fireEvent.change(nameInput, { target: { value: 'New Name' } });

      expect(mockClearError).toHaveBeenCalledWith('support_name');
    });

    it('should clear error when typing in support email', () => {
      const errorsWithEmailError = {
        ...mockErrors,
        support_email: 'Email inválido',
      };

      render(
        <ProductSupportSection
          form={mockForm}
          setForm={mockSetForm}
          errors={errorsWithEmailError}
          clearError={mockClearError}
        />
      );

      const emailInput = screen.getByLabelText(/E-mail de suporte/);
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

      expect(mockClearError).toHaveBeenCalledWith('support_email');
    });
  });

  describe('Error Display', () => {
    it('should display support name error', () => {
      const errorsWithNameError = {
        ...mockErrors,
        support_name: 'Nome é obrigatório',
      };

      render(
        <ProductSupportSection
          form={mockForm}
          setForm={mockSetForm}
          errors={errorsWithNameError}
          clearError={mockClearError}
        />
      );

      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
    });

    it('should display support email error', () => {
      const errorsWithEmailError = {
        ...mockErrors,
        support_email: 'Email inválido',
      };

      render(
        <ProductSupportSection
          form={mockForm}
          setForm={mockSetForm}
          errors={errorsWithEmailError}
          clearError={mockClearError}
        />
      );

      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });

    it('should apply error styling to inputs', () => {
      const errorsWithBothErrors = {
        ...mockErrors,
        support_name: 'Nome é obrigatório',
        support_email: 'Email inválido',
      };

      render(
        <ProductSupportSection
          form={mockForm}
          setForm={mockSetForm}
          errors={errorsWithBothErrors}
          clearError={mockClearError}
        />
      );

      const nameInput = screen.getByLabelText(/Nome de exibição do produtor/);
      const emailInput = screen.getByLabelText(/E-mail de suporte/);

      expect(nameInput).toHaveClass('border-red-500');
      expect(emailInput).toHaveClass('border-red-500');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels', () => {
      render(
        <ProductSupportSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      expect(screen.getByLabelText(/Nome de exibição do produtor/)).toBeInTheDocument();
      expect(screen.getByLabelText(/E-mail de suporte/)).toBeInTheDocument();
    });

    it('should have email input type', () => {
      render(
        <ProductSupportSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      const emailInput = screen.getByLabelText(/E-mail de suporte/);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should have placeholders', () => {
      render(
        <ProductSupportSection
          form={mockForm}
          setForm={mockSetForm}
          errors={mockErrors}
          clearError={mockClearError}
        />
      );

      expect(screen.getByPlaceholderText('Digite o nome de exibição')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Digite o e-mail de suporte')).toBeInTheDocument();
    });
  });
});
