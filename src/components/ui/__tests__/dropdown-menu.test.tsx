/**
 * @file dropdown-menu.test.tsx
 * @description Tests for DropdownMenu UI component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Note: Uses fireEvent instead of userEvent due to clipboard compatibility
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '../dropdown-menu';

describe('DropdownMenu', () => {
  describe('Rendering', () => {
    it('renders trigger button', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Open Menu')).toBeInTheDocument();
    });

    it('does not render content initially', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Hidden Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.queryByText('Hidden Item')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('opens menu on trigger click', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
      });
    });

    it('calls onSelect when item is clicked', async () => {
      const onSelect = vi.fn();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={onSelect}>Click Me</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Click Me')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Click Me'));
      expect(onSelect).toHaveBeenCalled();
    });

    it('closes menu after item selection', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Select Me</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Select Me')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select Me'));

      await waitFor(() => {
        expect(screen.queryByText('Select Me')).not.toBeInTheDocument();
      });
    });
  });

  describe('MenuItem Variants', () => {
    it('renders with inset prop', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Inset Item')).toHaveClass('pl-8');
      });
    });

    it('renders disabled item', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled>Disabled</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Disabled')).toHaveAttribute('data-disabled');
      });
    });
  });

  describe('DropdownMenuLabel', () => {
    it('renders label', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Label</DropdownMenuLabel>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('My Label')).toBeInTheDocument();
      });
    });

    it('renders label with inset', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Inset Label')).toHaveClass('pl-8');
      });
    });
  });

  describe('DropdownMenuSeparator', () => {
    it('renders separator', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator data-testid="separator" />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('separator')).toBeInTheDocument();
      });
    });
  });

  describe('DropdownMenuShortcut', () => {
    it('renders shortcut text', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('⌘S')).toBeInTheDocument();
      });
    });
  });

  describe('DropdownMenuCheckboxItem', () => {
    it('renders checkbox item', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>
              Checked Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Checked Item')).toBeInTheDocument();
      });
    });

    it('toggles checkbox state', async () => {
      const onCheckedChange = vi.fn();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem 
              checked={false} 
              onCheckedChange={onCheckedChange}
            >
              Toggle Me
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Toggle Me')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Toggle Me'));
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });
  });

  describe('DropdownMenuRadioGroup', () => {
    it('renders radio items', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 2')).toBeInTheDocument();
      });
    });

    it('selects radio item', async () => {
      const onValueChange = vi.fn();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1" onValueChange={onValueChange}>
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Option 2')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Option 2'));
      expect(onValueChange).toHaveBeenCalledWith('option2');
    });
  });

  describe('DropdownMenuGroup', () => {
    it('renders grouped items', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Grouped Item 1</DropdownMenuItem>
              <DropdownMenuItem>Grouped Item 2</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Grouped Item 1')).toBeInTheDocument();
        expect(screen.getByText('Grouped Item 2')).toBeInTheDocument();
      });
    });
  });

  describe('Submenu', () => {
    it('renders submenu trigger', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('More Options')).toBeInTheDocument();
      });
    });

    it('renders submenu trigger with inset', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger inset>Inset Sub</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Inset Sub')).toHaveClass('pl-8');
      });
    });
  });
});
