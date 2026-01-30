/**
 * @file popover.test.tsx
 * @description Tests for Popover UI component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Note: Uses fireEvent instead of userEvent due to clipboard compatibility
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { Popover, PopoverTrigger, PopoverContent } from '../popover';

describe('Popover', () => {
  describe('Rendering', () => {
    it('renders trigger element', () => {
      render(
        <Popover>
          <PopoverTrigger>Open Popover</PopoverTrigger>
          <PopoverContent>Popover content</PopoverContent>
        </Popover>
      );

      expect(screen.getByText('Open Popover')).toBeInTheDocument();
    });

    it('does not render content initially', () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Hidden content</PopoverContent>
        </Popover>
      );

      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
    });

    it('renders trigger as button by default', () => {
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('opens popover on trigger click', async () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Popover content</PopoverContent>
        </Popover>
      );

      fireEvent.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Popover content')).toBeInTheDocument();
      });
    });

    it('closes popover on second click', async () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Open');

      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });

    it('closes on click outside', async () => {
      render(
        <div>
          <Popover>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent>Content</PopoverContent>
          </Popover>
          <button>Outside</button>
        </div>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Outside'));
      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Alignment', () => {
    it('defaults to center alignment', async () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent data-testid="content">Content</PopoverContent>
        </Popover>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content).toHaveAttribute('data-align', 'center');
      });
    });

    it('accepts start alignment', async () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent align="start" data-testid="content">Content</PopoverContent>
        </Popover>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content).toHaveAttribute('data-align', 'start');
      });
    });

    it('accepts end alignment', async () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent align="end" data-testid="content">Content</PopoverContent>
        </Popover>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content).toHaveAttribute('data-align', 'end');
      });
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className to content', async () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent className="custom-class" data-testid="content">
            Content
          </PopoverContent>
        </Popover>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('content')).toHaveClass('custom-class');
      });
    });

    it('applies default width class', async () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent data-testid="content">Content</PopoverContent>
        </Popover>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('content')).toHaveClass('w-72');
      });
    });
  });

  describe('Controlled Mode', () => {
    it('works with controlled open state', () => {
      const onOpenChange = vi.fn();

      render(
        <Popover open={false} onOpenChange={onOpenChange}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      fireEvent.click(screen.getByText('Open'));
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('shows content when open is true', () => {
      render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Controlled Content</PopoverContent>
        </Popover>
      );

      expect(screen.getByText('Controlled Content')).toBeInTheDocument();
    });

    it('hides content when open is false', () => {
      render(
        <Popover open={false}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Hidden</PopoverContent>
        </Popover>
      );

      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('trigger has correct aria attributes when closed', () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('trigger has correct aria attributes when open', async () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        const trigger = screen.getByRole('button');
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('Side Offset', () => {
    it('accepts custom sideOffset', async () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent sideOffset={10} data-testid="content">
            Content
          </PopoverContent>
        </Popover>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });
  });

  describe('Complex Content', () => {
    it('renders form inside popover', async () => {
      render(
        <Popover>
          <PopoverTrigger>Settings</PopoverTrigger>
          <PopoverContent>
            <form>
              <input type="text" placeholder="Name" />
              <button type="submit">Save</button>
            </form>
          </PopoverContent>
        </Popover>
      );

      fireEvent.click(screen.getByText('Settings'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
    });

    it('handles form interactions', async () => {
      const onSubmit = vi.fn((e) => e.preventDefault());

      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <form onSubmit={onSubmit}>
              <input type="text" placeholder="Input" />
              <button type="submit">Submit</button>
            </form>
          </PopoverContent>
        </Popover>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Input')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Input'), { target: { value: 'test' } });
      fireEvent.click(screen.getByText('Submit'));

      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
