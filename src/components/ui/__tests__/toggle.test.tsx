/**
 * @file toggle.test.tsx
 * @description Tests for Toggle UI component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Note: Uses fireEvent instead of userEvent due to clipboard compatibility
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { Toggle, toggleVariants } from '../toggle';

describe('Toggle', () => {
  describe('Rendering', () => {
    it('renders toggle button', () => {
      render(<Toggle>Toggle</Toggle>);
      expect(screen.getByRole('button', { name: 'Toggle' })).toBeInTheDocument();
    });

    it('renders with children', () => {
      render(<Toggle>Click me</Toggle>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders with aria-pressed false by default', () => {
      render(<Toggle>Toggle</Toggle>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });

    it('renders with icon content', () => {
      render(
        <Toggle>
          <span data-testid="icon">★</span>
        </Toggle>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('toggles on click', () => {
      render(<Toggle>Toggle</Toggle>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(button).toHaveAttribute('data-state', 'off');

      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(button).toHaveAttribute('data-state', 'on');
    });

    it('toggles off on second click', () => {
      render(<Toggle>Toggle</Toggle>);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      expect(button).toHaveAttribute('data-state', 'on');

      fireEvent.click(button);
      expect(button).toHaveAttribute('data-state', 'off');
    });

    it('calls onPressedChange when toggled', () => {
      const onPressedChange = vi.fn();

      render(<Toggle onPressedChange={onPressedChange}>Toggle</Toggle>);

      fireEvent.click(screen.getByRole('button'));
      expect(onPressedChange).toHaveBeenCalledWith(true);

      fireEvent.click(screen.getByRole('button'));
      expect(onPressedChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Disabled State', () => {
    it('renders as disabled', () => {
      render(<Toggle disabled>Toggle</Toggle>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not toggle when disabled', () => {
      const onPressedChange = vi.fn();

      render(
        <Toggle disabled onPressedChange={onPressedChange}>
          Toggle
        </Toggle>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(onPressedChange).not.toHaveBeenCalled();
    });

    it('applies disabled styles', () => {
      render(<Toggle disabled>Toggle</Toggle>);
      expect(screen.getByRole('button')).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Pressed State', () => {
    it('can start pressed', () => {
      render(<Toggle pressed>Toggle</Toggle>);
      expect(screen.getByRole('button')).toHaveAttribute('data-state', 'on');
    });

    it('can start unpressed', () => {
      render(<Toggle pressed={false}>Toggle</Toggle>);
      expect(screen.getByRole('button')).toHaveAttribute('data-state', 'off');
    });

    it('works with defaultPressed', () => {
      render(<Toggle defaultPressed>Toggle</Toggle>);
      expect(screen.getByRole('button')).toHaveAttribute('data-state', 'on');
    });
  });

  describe('Variant Styles', () => {
    it('applies default variant', () => {
      render(<Toggle>Toggle</Toggle>);
      expect(screen.getByRole('button')).toHaveClass('bg-transparent');
    });

    it('applies outline variant', () => {
      render(<Toggle variant="outline">Toggle</Toggle>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('border-input');
    });
  });

  describe('Size Variants', () => {
    it('applies default size', () => {
      render(<Toggle>Toggle</Toggle>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-3');
    });

    it('applies small size', () => {
      render(<Toggle size="sm">Toggle</Toggle>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-2.5');
    });

    it('applies large size', () => {
      render(<Toggle size="lg">Toggle</Toggle>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11');
      expect(button).toHaveClass('px-5');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<Toggle className="custom-class">Toggle</Toggle>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('merges custom className with defaults', () => {
      render(<Toggle className="my-custom">Toggle</Toggle>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('my-custom');
      expect(button).toHaveClass('inline-flex');
    });
  });

  describe('Accessibility', () => {
    it('has button role', () => {
      render(<Toggle>Toggle</Toggle>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('is focusable', () => {
      render(<Toggle>Toggle</Toggle>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('can be toggled with keyboard', () => {
      render(<Toggle>Toggle</Toggle>);
      const button = screen.getByRole('button');
      
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(button).toHaveAttribute('data-state', 'on');

      fireEvent.keyDown(button, { key: ' ' });
      expect(button).toHaveAttribute('data-state', 'off');
    });

    it('has correct aria-pressed value', () => {
      render(<Toggle pressed>Toggle</Toggle>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Controlled Mode', () => {
    it('works in controlled mode', () => {
      const onPressedChange = vi.fn();

      const { rerender } = render(
        <Toggle pressed={false} onPressedChange={onPressedChange}>
          Toggle
        </Toggle>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(onPressedChange).toHaveBeenCalledWith(true);

      rerender(
        <Toggle pressed={true} onPressedChange={onPressedChange}>
          Toggle
        </Toggle>
      );

      expect(screen.getByRole('button')).toHaveAttribute('data-state', 'on');
    });
  });

  describe('toggleVariants', () => {
    it('exports toggleVariants for external use', () => {
      expect(toggleVariants).toBeDefined();
      expect(typeof toggleVariants).toBe('function');
    });

    it('generates correct classes for default variant', () => {
      const classes = toggleVariants({ variant: 'default', size: 'default' });
      expect(classes).toContain('bg-transparent');
      expect(classes).toContain('h-10');
    });

    it('generates correct classes for outline variant', () => {
      const classes = toggleVariants({ variant: 'outline', size: 'default' });
      expect(classes).toContain('border');
      expect(classes).toContain('border-input');
    });

    it('generates correct classes for small size', () => {
      const classes = toggleVariants({ size: 'sm' });
      expect(classes).toContain('h-9');
    });

    it('generates correct classes for large size', () => {
      const classes = toggleVariants({ size: 'lg' });
      expect(classes).toContain('h-11');
    });
  });

  describe('Data State Styling', () => {
    it('applies on state styling when pressed', () => {
      render(<Toggle>Toggle</Toggle>);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      expect(button).toHaveAttribute('data-state', 'on');
    });

    it('applies off state by default', () => {
      render(<Toggle>Toggle</Toggle>);
      expect(screen.getByRole('button')).toHaveAttribute('data-state', 'off');
    });
  });

  describe('AsChild Pattern', () => {
    it('renders as child element when asChild is true', () => {
      render(
        <Toggle asChild>
          <span role="button" tabIndex={0}>Custom element</span>
        </Toggle>
      );

      expect(screen.getByText('Custom element')).toBeInTheDocument();
    });
  });
});
