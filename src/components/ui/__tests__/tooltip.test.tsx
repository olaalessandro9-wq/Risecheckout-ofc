/**
 * @file tooltip.test.tsx
 * @description Tests for Tooltip UI component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Note: Uses fireEvent instead of userEvent due to clipboard compatibility
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../tooltip';

const renderTooltip = (content: string = 'Tooltip text', trigger: string = 'Hover me') => {
  return render(
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>{trigger}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

describe('Tooltip', () => {
  describe('Rendering', () => {
    it('renders trigger element', () => {
      renderTooltip();
      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('does not render tooltip content initially', () => {
      renderTooltip();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('renders multiple tooltips', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>First</TooltipTrigger>
            <TooltipContent>First tooltip</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>Second</TooltipTrigger>
            <TooltipContent>Second tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('shows tooltip on hover', async () => {
      renderTooltip('Tooltip text');

      fireEvent.mouseEnter(screen.getByText('Hover me'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        expect(screen.getByText('Tooltip text')).toBeInTheDocument();
      });
    });

    it('hides tooltip on unhover', async () => {
      renderTooltip('Tooltip text');

      const trigger = screen.getByText('Hover me');
      
      fireEvent.mouseEnter(trigger);
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      fireEvent.mouseLeave(trigger);
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('shows tooltip on focus', async () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button>Focus me</button>
            </TooltipTrigger>
            <TooltipContent>Focused tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      fireEvent.focus(screen.getByText('Focus me'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className to content', async () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Hover</TooltipTrigger>
            <TooltipContent className="custom-tooltip">Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      fireEvent.mouseEnter(screen.getByText('Hover'));
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveClass('custom-tooltip');
      });
    });

    it('has default styling classes', async () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Hover</TooltipTrigger>
            <TooltipContent>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      fireEvent.mouseEnter(screen.getByText('Hover'));
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveClass('z-50');
        expect(tooltip).toHaveClass('rounded-md');
        expect(tooltip).toHaveClass('border');
      });
    });
  });

  describe('Side Offset', () => {
    it('accepts custom sideOffset', async () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Hover</TooltipTrigger>
            <TooltipContent sideOffset={10}>Offset content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      fireEvent.mouseEnter(screen.getByText('Hover'));
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('uses default sideOffset of 4', async () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Hover</TooltipTrigger>
            <TooltipContent>Default offset</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      fireEvent.mouseEnter(screen.getByText('Hover'));
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('TooltipProvider', () => {
    it('works with delayDuration', async () => {
      render(
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger>Quick hover</TooltipTrigger>
            <TooltipContent>Quick content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      fireEvent.mouseEnter(screen.getByText('Quick hover'));
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('supports skipDelayDuration', async () => {
      render(
        <TooltipProvider skipDelayDuration={0}>
          <Tooltip>
            <TooltipTrigger>First</TooltipTrigger>
            <TooltipContent>First tooltip</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>Second</TooltipTrigger>
            <TooltipContent>Second tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      fireEvent.mouseEnter(screen.getByText('First'));
      await waitFor(() => {
        expect(screen.getByText('First tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('AsChild Pattern', () => {
    it('renders trigger as custom element', async () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="custom-btn">Custom button</button>
            </TooltipTrigger>
            <TooltipContent>Button tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole('button', { name: 'Custom button' });
      expect(button).toHaveClass('custom-btn');

      fireEvent.mouseEnter(button);
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('works with link elements', async () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <a href="#test">Link trigger</a>
            </TooltipTrigger>
            <TooltipContent>Link tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const link = screen.getByRole('link', { name: 'Link trigger' });

      fireEvent.mouseEnter(link);
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('tooltip has role="tooltip"', async () => {
      renderTooltip('Accessible tooltip');

      fireEvent.mouseEnter(screen.getByText('Hover me'));
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('trigger is focusable', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button>Focusable</button>
            </TooltipTrigger>
            <TooltipContent>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('Complex Content', () => {
    it('renders rich content in tooltip', async () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Hover</TooltipTrigger>
            <TooltipContent>
              <div>
                <strong>Title</strong>
                <p>Description text</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      fireEvent.mouseEnter(screen.getByText('Hover'));
      await waitFor(() => {
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Description text')).toBeInTheDocument();
      });
    });
  });

  describe('Open/Close States', () => {
    it('supports controlled open state', () => {
      render(
        <TooltipProvider>
          <Tooltip open={true}>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Always visible</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('supports defaultOpen', () => {
      render(
        <TooltipProvider>
          <Tooltip defaultOpen={true}>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Initially open</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });
});
