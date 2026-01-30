/**
 * @file accordion.test.tsx
 * @description Tests for Accordion UI component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Note: Uses fireEvent instead of userEvent due to clipboard compatibility
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../accordion';

describe('Accordion', () => {
  describe('Rendering', () => {
    it('renders accordion with items', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('renders multiple items', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>First</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Second</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });

    it('applies custom className to AccordionItem', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" className="custom-class" data-testid="accordion-item">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByTestId('accordion-item')).toHaveClass('custom-class');
    });

    it('applies custom className to AccordionTrigger', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="trigger-class">Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByRole('button')).toHaveClass('trigger-class');
    });
  });

  describe('Interactions', () => {
    it('expands content on trigger click', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Toggle</AccordionTrigger>
            <AccordionContent>Hidden Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByRole('button', { name: 'Toggle' });
      expect(trigger).toHaveAttribute('data-state', 'closed');

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('data-state', 'open');
    });

    it('collapses content on second click when collapsible', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Toggle</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('data-state', 'open');

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('data-state', 'closed');
    });

    it('allows multiple items open with type="multiple"', () => {
      render(
        <Accordion type="multiple">
          <AccordionItem value="item-1">
            <AccordionTrigger>First</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Second</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const [first, second] = screen.getAllByRole('button');

      fireEvent.click(first);
      fireEvent.click(second);

      expect(first).toHaveAttribute('data-state', 'open');
      expect(second).toHaveAttribute('data-state', 'open');
    });

    it('closes other items with type="single"', () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>First</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Second</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const [first, second] = screen.getAllByRole('button');

      fireEvent.click(first);
      expect(first).toHaveAttribute('data-state', 'open');

      fireEvent.click(second);
      expect(first).toHaveAttribute('data-state', 'closed');
      expect(second).toHaveAttribute('data-state', 'open');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Toggle</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded on open', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Toggle</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('renders with heading structure', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Toggle</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });

  describe('Default Value', () => {
    it('starts with item open when defaultValue is set', () => {
      render(
        <Accordion type="single" defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('data-state', 'open');
    });

    it('supports multiple defaultValue items', () => {
      render(
        <Accordion type="multiple" defaultValue={['item-1', 'item-2']}>
          <AccordionItem value="item-1">
            <AccordionTrigger>First</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Second</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const [first, second] = screen.getAllByRole('button');
      expect(first).toHaveAttribute('data-state', 'open');
      expect(second).toHaveAttribute('data-state', 'open');
    });
  });
});
