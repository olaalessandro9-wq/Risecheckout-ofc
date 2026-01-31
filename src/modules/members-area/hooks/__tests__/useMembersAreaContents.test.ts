/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for useMembersAreaContents hook
 * 
 * Coverage:
 * - addContent
 * - updateContent
 * - deleteContent
 * - reorderContents
 * - Error handling
 * - Toast notifications
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMembersAreaContents } from '../useMembersAreaContents';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { ModuleWithContents, MemberContent } from '../../types';

vi.mock('@/lib/api');
vi.mock('sonner');
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Helper to create valid MemberContent
function createMockContent(overrides: Partial<MemberContent> = {}): MemberContent {
  return {
    id: 'content-1',
    module_id: 'module-1',
    title: 'Content 1',
    content_type: 'mixed',
    position: 0,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    description: null,
    content_url: null,
    body: null,
    content_data: null,
    duration_seconds: null,
    is_active: true,
    ...overrides,
  };
}

// Helper to create valid ModuleWithContents
function createMockModule(overrides: Partial<ModuleWithContents> = {}): ModuleWithContents {
  return {
    id: 'module-1',
    title: 'Module 1',
    product_id: 'product-1',
    position: 0,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    description: null,
    cover_image_url: null,
    width: null,
    height: null,
    is_active: true,
    contents: [],
    ...overrides,
  };
}

describe('useMembersAreaContents', () => {
  const mockDispatch = vi.fn();
  const mockModules: ModuleWithContents[] = [
    createMockModule({
      contents: [createMockContent()],
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addContent', () => {
    it('deve adicionar conteúdo com sucesso', async () => {
      const newContent = createMockContent({
        id: 'content-2',
        title: 'New Content',
        content_type: 'video',
        position: 1,
      });

      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true, data: newContent },
        error: null,
      });

      const { result } = renderHook(() =>
        useMembersAreaContents({ modules: mockModules, dispatch: mockDispatch })
      );

      let addedContent: MemberContent | null = null;
      await act(async () => {
        addedContent = await result.current.addContent('module-1', {
          title: 'New Content',
          description: null,
          content_url: null,
          body: null,
          content_data: null,
          duration_seconds: null,
          content_type: 'video',
          is_active: true,
        });
      });

      expect(addedContent).toEqual(newContent);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_CONTENT',
        moduleId: 'module-1',
        content: newContent,
      });
      expect(toast.success).toHaveBeenCalledWith('Conteúdo criado!');
    });

    it('deve retornar null se módulo não existir', async () => {
      const { result } = renderHook(() =>
        useMembersAreaContents({ modules: mockModules, dispatch: mockDispatch })
      );

      let addedContent: MemberContent | null = null;
      await act(async () => {
        addedContent = await result.current.addContent('non-existent-module', {
          title: 'Content',
          description: null,
          content_url: null,
          body: null,
          content_data: null,
          duration_seconds: null,
          content_type: 'mixed',
          is_active: true,
        });
      });

      expect(addedContent).toBeNull();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('deve mostrar erro se API falhar', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { message: 'API Error', code: 'INTERNAL_ERROR' },
      });

      const { result } = renderHook(() =>
        useMembersAreaContents({ modules: mockModules, dispatch: mockDispatch })
      );

      let addedContent: MemberContent | null = null;
      await act(async () => {
        addedContent = await result.current.addContent('module-1', {
          title: 'Content',
          description: null,
          content_url: null,
          body: null,
          content_data: null,
          duration_seconds: null,
          content_type: 'mixed',
          is_active: true,
        });
      });

      expect(addedContent).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Erro ao criar conteúdo');
    });
  });

  describe('updateContent', () => {
    it('deve atualizar conteúdo com sucesso', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const { result } = renderHook(() =>
        useMembersAreaContents({ modules: mockModules, dispatch: mockDispatch })
      );

      await act(async () => {
        await result.current.updateContent('content-1', { title: 'Updated Title' });
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_CONTENT',
        id: 'content-1',
        data: { title: 'Updated Title' },
      });
      expect(toast.success).toHaveBeenCalledWith('Conteúdo atualizado!');
    });

    it('deve mostrar erro se API falhar', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { message: 'API Error', code: 'INTERNAL_ERROR' },
      });

      const { result } = renderHook(() =>
        useMembersAreaContents({ modules: mockModules, dispatch: mockDispatch })
      );

      await act(async () => {
        await result.current.updateContent('content-1', { title: 'Updated Title' });
      });

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar conteúdo');
    });
  });

  describe('deleteContent', () => {
    it('deve deletar conteúdo com sucesso', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const { result } = renderHook(() =>
        useMembersAreaContents({ modules: mockModules, dispatch: mockDispatch })
      );

      await act(async () => {
        await result.current.deleteContent('content-1');
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'DELETE_CONTENT',
        id: 'content-1',
      });
      expect(toast.success).toHaveBeenCalledWith('Conteúdo deletado!');
    });

    it('deve mostrar erro se API falhar', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { message: 'API Error', code: 'INTERNAL_ERROR' },
      });

      const { result } = renderHook(() =>
        useMembersAreaContents({ modules: mockModules, dispatch: mockDispatch })
      );

      await act(async () => {
        await result.current.deleteContent('content-1');
      });

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Erro ao deletar conteúdo');
    });
  });

  describe('reorderContents', () => {
    it('deve reordenar conteúdos com sucesso', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const { result } = renderHook(() =>
        useMembersAreaContents({ modules: mockModules, dispatch: mockDispatch })
      );

      await act(async () => {
        await result.current.reorderContents('module-1', ['content-2', 'content-1']);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'REORDER_CONTENTS',
        moduleId: 'module-1',
        orderedIds: ['content-2', 'content-1'],
      });
      expect(toast.success).toHaveBeenCalledWith('Ordem atualizada!');
    });

    it('deve mostrar erro se API falhar', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { message: 'API Error', code: 'INTERNAL_ERROR' },
      });

      const { result } = renderHook(() =>
        useMembersAreaContents({ modules: mockModules, dispatch: mockDispatch })
      );

      await act(async () => {
        await result.current.reorderContents('module-1', ['content-2', 'content-1']);
      });

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Erro ao reordenar conteúdos');
    });
  });
});
