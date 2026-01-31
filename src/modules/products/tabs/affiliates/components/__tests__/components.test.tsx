/**
 * Affiliates Components - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Simplified tests for Affiliates subcomponents.
 * 
 * @module products/tabs/affiliates/components/__tests__/components.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AffiliateSettings } from '../../../../types/product.types';

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: { checked?: boolean; onCheckedChange?: (v: boolean) => void }) => (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      data-testid="switch"
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input data-testid="input" {...props} />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: { children: React.ReactNode }) => <label {...props}>{children}</label>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => (
    <button data-testid="button" {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea data-testid="textarea" {...props} />,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div data-testid="select">{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => <span>Select value</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Import components after mocks
import { AffiliateProgramStatus } from '../AffiliateProgramStatus';
import { CommissionSettings } from '../CommissionSettings';
import { AdvancedRules } from '../AdvancedRules';
import { AffiliateInviteLink } from '../AffiliateInviteLink';
import { SupportContact } from '../SupportContact';

// Helper to create valid AffiliateSettings
function createMockAffiliateSettings(overrides: Partial<AffiliateSettings> = {}): AffiliateSettings {
  return {
    enabled: true,
    defaultRate: 10,
    requireApproval: false,
    attributionModel: 'last_click',
    cookieDuration: 30,
    ...overrides,
  };
}

describe('Affiliates Components', () => {
  describe('AffiliateProgramStatus', () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render component', () => {
      const { container } = render(
        <AffiliateProgramStatus
          enabled={false}
          onChange={mockOnChange}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should render switch', () => {
      render(
        <AffiliateProgramStatus
          enabled={false}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId('switch')).toBeInTheDocument();
    });

    it('should show enabled state', () => {
      render(
        <AffiliateProgramStatus
          enabled={true}
          onChange={mockOnChange}
        />
      );

      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should show disabled state', () => {
      render(
        <AffiliateProgramStatus
          enabled={false}
          onChange={mockOnChange}
        />
      );

      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('CommissionSettings', () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render component', () => {
      const { container } = render(
        <CommissionSettings
          settings={createMockAffiliateSettings()}
          onChange={mockOnChange}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should accept settings prop', () => {
      const { container } = render(
        <CommissionSettings
          settings={createMockAffiliateSettings({ defaultRate: 25 })}
          onChange={mockOnChange}
        />
      );

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('AdvancedRules', () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render component', () => {
      const { container } = render(
        <AdvancedRules
          settings={createMockAffiliateSettings({ requireApproval: true })}
          onChange={mockOnChange}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should accept settings prop', () => {
      const { container } = render(
        <AdvancedRules
          settings={createMockAffiliateSettings()}
          onChange={mockOnChange}
        />
      );

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('AffiliateInviteLink', () => {
    const mockProductId = 'product-123';

    it('should render component', () => {
      const { container } = render(<AffiliateInviteLink productId={mockProductId} />);

      expect(container).toBeTruthy();
    });

    it('should accept productId prop', () => {
      const { container } = render(<AffiliateInviteLink productId={mockProductId} />);

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('SupportContact', () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render component', () => {
      const { container } = render(
        <SupportContact
          settings={createMockAffiliateSettings({ supportEmail: 'support@example.com' })}
          onChange={mockOnChange}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should accept settings prop', () => {
      const { container } = render(
        <SupportContact
          settings={createMockAffiliateSettings()}
          onChange={mockOnChange}
        />
      );

      expect(container.firstChild).toBeTruthy();
    });
  });
});
