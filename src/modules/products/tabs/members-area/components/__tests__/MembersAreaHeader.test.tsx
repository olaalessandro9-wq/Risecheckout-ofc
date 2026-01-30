/**
 * MembersAreaHeader Component - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for MembersAreaHeader component.
 * 
 * @module products/tabs/members-area/components/__tests__/MembersAreaHeader.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MembersAreaHeader } from '../MembersAreaHeader';

describe('MembersAreaHeader', () => {
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render title and description', () => {
      render(
        <MembersAreaHeader
          enabled={false}
          isSaving={false}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText('Área de Membros')).toBeInTheDocument();
      expect(screen.getByText(/Crie conteúdos exclusivos/)).toBeInTheDocument();
    });

    it('should render switch', () => {
      render(
        <MembersAreaHeader
          enabled={false}
          isSaving={false}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should show "Desativada" when disabled', () => {
      render(
        <MembersAreaHeader
          enabled={false}
          isSaving={false}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText('Desativada')).toBeInTheDocument();
    });

    it('should show "Ativada" when enabled', () => {
      render(
        <MembersAreaHeader
          enabled={true}
          isSaving={false}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText('Ativada')).toBeInTheDocument();
    });
  });

  describe('Switch Interaction', () => {
    it('should call onToggle when switch is clicked', () => {
      render(
        <MembersAreaHeader
          enabled={false}
          isSaving={false}
          onToggle={mockOnToggle}
        />
      );

      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);

      expect(mockOnToggle).toHaveBeenCalled();
    });

    it('should disable switch when isSaving is true', () => {
      render(
        <MembersAreaHeader
          enabled={false}
          isSaving={true}
          onToggle={mockOnToggle}
        />
      );

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeDisabled();
    });
  });

  describe('Conditional Content', () => {
    it('should show link section when enabled', () => {
      render(
        <MembersAreaHeader
          enabled={true}
          isSaving={false}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText(/Link de acesso para compradores/)).toBeInTheDocument();
    });

    it('should not show link section when disabled', () => {
      render(
        <MembersAreaHeader
          enabled={false}
          isSaving={false}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.queryByText(/Link de acesso para compradores/)).not.toBeInTheDocument();
    });
  });
});
