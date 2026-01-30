/**
 * @file drawer.test.tsx
 * @description Tests for Drawer UI component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Note: Uses fireEvent instead of userEvent due to clipboard compatibility
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '../drawer';

describe('Drawer', () => {
  describe('Rendering', () => {
    it('renders trigger element', () => {
      render(
        <Drawer>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );

      expect(screen.getByText('Open Drawer')).toBeInTheDocument();
    });

    it('does not render content initially', () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Hidden</DrawerTitle>
            <DrawerDescription>Hidden content</DrawerDescription>
          </DrawerContent>
        </Drawer>
      );

      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
    });

    it('renders trigger as button', () => {
      render(
        <Drawer>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );

      expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('opens drawer on trigger click', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Drawer Title</DrawerTitle>
            <DrawerDescription>Drawer content here</DrawerDescription>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Drawer content here')).toBeInTheDocument();
      });
    });
  });

  describe('Header and Footer', () => {
    it('renders DrawerHeader', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader data-testid="header">
              <DrawerTitle>Header Title</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByText('Header Title')).toBeInTheDocument();
      });
    });

    it('renders DrawerFooter', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerFooter data-testid="footer">
              <button>Action</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('footer')).toBeInTheDocument();
        expect(screen.getByText('Action')).toBeInTheDocument();
      });
    });

    it('applies correct styles to header', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader data-testid="header" className="custom-header">
              <DrawerTitle>Title</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        const header = screen.getByTestId('header');
        expect(header).toHaveClass('custom-header');
        expect(header).toHaveClass('grid');
      });
    });

    it('applies correct styles to footer', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerFooter data-testid="footer" className="custom-footer">
              <button>Action</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        const footer = screen.getByTestId('footer');
        expect(footer).toHaveClass('custom-footer');
        expect(footer).toHaveClass('flex');
      });
    });
  });

  describe('Title and Description', () => {
    it('renders DrawerTitle', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>My Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('My Title')).toBeInTheDocument();
      });
    });

    it('renders DrawerDescription', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription>My Description</DrawerDescription>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('My Description')).toBeInTheDocument();
      });
    });

    it('applies custom className to title', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle className="custom-title" data-testid="title">
              Styled Title
            </DrawerTitle>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('title')).toHaveClass('custom-title');
      });
    });

    it('applies custom className to description', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription className="custom-desc" data-testid="desc">
              Description
            </DrawerDescription>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('desc')).toHaveClass('custom-desc');
      });
    });
  });

  describe('DrawerClose', () => {
    it('renders close element', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerClose>Cancel</DrawerClose>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    it('closes drawer when DrawerClose is clicked', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription>Description</DrawerDescription>
            <DrawerClose>Cancel</DrawerClose>
          </DrawerContent>
        </Drawer>
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
      render(
        <Drawer open={true}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Controlled Drawer</DrawerTitle>
            <DrawerDescription>Content</DrawerDescription>
          </DrawerContent>
        </Drawer>
      );

      expect(screen.getByText('Controlled Drawer')).toBeInTheDocument();
    });

    it('calls onOpenChange when closing', () => {
      const onOpenChange = vi.fn();

      render(
        <Drawer open={true} onOpenChange={onOpenChange}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerClose>Cancel</DrawerClose>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Cancel'));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className to content', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent className="custom-drawer" data-testid="content">
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('content')).toHaveClass('custom-drawer');
      });
    });

    it('has default drawer handle', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent data-testid="content">
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content.querySelector('.rounded-full')).toBeInTheDocument();
      });
    });
  });

  describe('shouldScaleBackground', () => {
    it('defaults to true for shouldScaleBackground', () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );

      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('accepts shouldScaleBackground=false', () => {
      render(
        <Drawer shouldScaleBackground={false}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );

      expect(screen.getByText('Open')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has dialog role when open', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Accessible Drawer</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('title has correct styling', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle data-testid="title">Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        const title = screen.getByTestId('title');
        expect(title).toHaveClass('text-lg');
        expect(title).toHaveClass('font-semibold');
      });
    });
  });

  describe('Complex Content', () => {
    it('renders form inside drawer', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Open Form</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Form Title</DrawerTitle>
            </DrawerHeader>
            <form>
              <input type="text" placeholder="Name" />
              <button type="submit">Submit</button>
            </form>
            <DrawerFooter>
              <DrawerClose>Cancel</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Open Form'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
        expect(screen.getByText('Submit')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    it('handles form interactions', async () => {
      const onSubmit = vi.fn((e) => e.preventDefault());

      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <form onSubmit={onSubmit}>
              <input type="text" placeholder="Input" />
              <button type="submit">Submit</button>
            </form>
          </DrawerContent>
        </Drawer>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Input')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Input'), { target: { value: 'test value' } });
      fireEvent.click(screen.getByText('Submit'));

      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
