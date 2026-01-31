/**
 * MembersArea Components - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Simplified tests for ContentsList and SortableContentItem.
 * 
 * @module products/tabs/members-area/components/__tests__/components.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { MemberContent } from "@/modules/members-area/types";

// Mock dependencies
vi.mock('@dnd-kit/core', () => ({
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
  useSensors: vi.fn(() => []),
  useSensor: vi.fn(),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: {},
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  arrayMove: (arr: unknown[], oldIndex: number, newIndex: number) => {
    const newArr = [...arr];
    const [removed] = newArr.splice(oldIndex, 1);
    newArr.splice(newIndex, 0, removed);
    return newArr;
  },
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Import components after mocks
import { ContentsList } from '../ContentsList';
import { SortableContentItem } from '../SortableContentItem';

// ============================================================================
// MOCK FACTORIES
// ============================================================================

function createMockMemberContent(
  overrides: Partial<MemberContent> = {}
): MemberContent {
  return {
    id: 'content-1',
    module_id: 'module-1',
    title: 'Test Content',
    description: null,
    content_type: 'video',
    content_url: 'https://example.com/video.mp4',
    body: null,
    content_data: null,
    duration_seconds: 300,
    position: 0,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('MembersArea Components', () => {
  describe('ContentsList', () => {
    const mockContents: MemberContent[] = [
      createMockMemberContent({ id: 'content-1', title: 'Test Content' }),
    ];

    const mockHandlers = {
      onEditContent: vi.fn(),
      onDeleteContent: vi.fn(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render contents list', () => {
      render(
        <ContentsList
          moduleId="module-1"
          contents={mockContents}
          onEditContent={mockHandlers.onEditContent}
          onDeleteContent={mockHandlers.onDeleteContent}
        />
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render empty state when no contents', () => {
      render(
        <ContentsList
          moduleId="module-1"
          contents={[]}
          onEditContent={mockHandlers.onEditContent}
          onDeleteContent={mockHandlers.onDeleteContent}
        />
      );

      expect(screen.getByText(/Nenhum conteúdo/)).toBeInTheDocument();
    });
  });

  describe('SortableContentItem', () => {
    const mockContent = createMockMemberContent({
      id: 'content-1',
      title: 'Test Content',
    });

    const mockHandlers = {
      onEditContent: vi.fn(),
      onDeleteContent: vi.fn(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render content item', () => {
      render(
        <SortableContentItem
          content={mockContent}
          onEditContent={mockHandlers.onEditContent}
          onDeleteContent={mockHandlers.onDeleteContent}
        />
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });
});
