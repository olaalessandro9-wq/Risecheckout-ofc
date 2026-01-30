/**
 * @file sheet.test.tsx
 * @description Tests for Sheet UI component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Note: Uses fireEvent instead of userEvent due to clipboard compatibility
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '../sheet';

describe('Sheet', () => {
  describe('Rendering', () => {
    it('renders trigger element', () => {
      render(
        <Sheet>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByText('Open Sheet')).toBeInTheDocument();
    });

    it('does not render content initially', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Hidden content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
    });

    it('renders trigger as button', () => {
      render(
        <Sheet>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('opens sheet on trigger click', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Sheet content here</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Sheet content here')).toBeInTheDocument();
      });
    });

    it('closes sheet on close button click', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Side Variants', () => {
    it('renders on right side by default', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent data-testid="sheet-content">
            <SheetTitle>Right Sheet</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        const content = screen.getByTestId('sheet-content');
        expect(content).toHaveClass('right-0');
      });
    });

    it('renders on left side', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent side="left" data-testid="sheet-content">
            <SheetTitle>Left Sheet</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        const content = screen.getByTestId('sheet-content');
        expect(content).toHaveClass('left-0');
      });
    });

    it('renders on top', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent side="top" data-testid="sheet-content">
            <SheetTitle>Top Sheet</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        const content = screen.getByTestId('sheet-content');
        expect(content).toHaveClass('top-0');
      });
    });

    it('renders on bottom', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent side="bottom" data-testid="sheet-content">
            <SheetTitle>Bottom Sheet</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        const content = screen.getByTestId('sheet-content');
        expect(content).toHaveClass('bottom-0');
      });
    });
  });

  describe('Header and Footer', () => {
    it('renders SheetHeader', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader data-testid="header">
              <SheetTitle>Header Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByText('Header Title')).toBeInTheDocument();
      });
    });

    it('renders SheetFooter', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetFooter data-testid="footer">
              <button>Action</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('footer')).toBeInTheDocument();
        expect(screen.getByText('Action')).toBeInTheDocument();
      });
    });

    it('applies correct styles to header', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader data-testid="header" className="custom-header">
              <SheetTitle>Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        const header = screen.getByTestId('header');
        expect(header).toHaveClass('custom-header');
        expect(header).toHaveClass('flex');
        expect(header).toHaveClass('flex-col');
      });
    });
  });

  describe('Title and Description', () => {
    it('renders SheetTitle', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>My Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('My Title')).toBeInTheDocument();
      });
    });

    it('renders SheetDescription', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>My Description</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('My Description')).toBeInTheDocument();
      });
    });

    it('applies custom className to title', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle className="custom-title" data-testid="title">
              Styled Title
            </SheetTitle>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('title')).toHaveClass('custom-title');
      });
    });
  });

  describe('SheetClose', () => {
    it('renders close element', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetClose>Cancel</SheetClose>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    it('closes sheet when SheetClose is clicked', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
            <SheetClose>Cancel</SheetClose>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Description')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));
      await waitFor(() => {
        expect(screen.queryByText('Description')).not.toBeInTheDocument();
      });
    });
  });

  describe('Controlled Mode', () => {
    it('works with controlled open state', () => {
      const onOpenChange = vi.fn();

      render(
        <Sheet open={true} onOpenChange={onOpenChange}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Controlled Sheet</SheetTitle>
            <SheetDescription>Content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByText('Controlled Sheet')).toBeInTheDocument();
    });

    it('calls onOpenChange when closing', () => {
      const onOpenChange = vi.fn();

      render(
        <Sheet open={true} onOpenChange={onOpenChange}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      const closeButton = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeButton);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className to content', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent className="custom-sheet" data-testid="content">
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('content')).toHaveClass('custom-sheet');
      });
    });
  });

  describe('Accessibility', () => {
    it('has dialog role when open', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Accessible Sheet</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('close button has accessible name', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
      });
    });
  });
});
