/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for useMembersAreaModules hook
 * 
 * Coverage:
 * - addModule
 * - updateModule
 * - deleteModule
 * - reorderModules
 * - Error handling
 * - Toast notifications
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMembersAreaModules } from '../useMembersAreaModules';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { ModuleWithContents, MemberModule } from '../../types';

vi.mock('@/lib/api');
vi.mock('sonner');
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Helper to create valid MemberModule
function createMockMemberModule(overrides: Partial<MemberModule> = {}): MemberModule {
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
    ...overrides,
  };
}

// Helper to create valid ModuleWithContents
function createMockModuleWithContents(overrides: Partial<ModuleWithContents> = {}): ModuleWithContents {
  return {
    ...createMockMemberModule(),
    contents: [],
    ...overrides,
  };
}

describe('useMembersAreaModules', () => {
  const mockDispatch = vi.fn();
  const mockModules: ModuleWithContents[] = [createMockModuleWithContents()];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addModule', () => {
    it('deve adicionar módulo com sucesso', async () => {
      const newModule = createMockMemberModule({
        id: 'module-2',
        title: 'New Module',
        position: 1,
      });

      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true, module: newModule },
        error: null,
      });

      const { result } = renderHook(() =>
        useMembersAreaModules({
          productId: 'product-1',
          modules: mockModules,
          dispatch: mockDispatch,
        })
      );

      let addedModule: MemberModule | null = null;
      await act(async () => {
        addedModule = await result.current.addModule('New Module');
      });

      expect(addedModule).toEqual(newModule);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_MODULE',
        module: { ...newModule, contents: [] },
      });
      expect(toast.success).toHaveBeenCalledWith('Módulo criado!');
    });

    it('deve retornar null se productId não existir', async () => {
      const { result } = renderHook(() =>
        useMembersAreaModules({
          productId: undefined,
          modules: mockModules,
          dispatch: mockDispatch,
        })
      );

      let addedModule: MemberModule | null = null;
      await act(async () => {
        addedModule = await result.current.addModule('New Module');
      });

      expect(addedModule).toBeNull();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('deve mostrar erro se API falhar', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { message: 'API Error', code: 'INTERNAL_ERROR' },
      });

      const { result } = renderHook(() =>
        useMembersAreaModules({
          productId: 'product-1',
          modules: mockModules,
          dispatch: mockDispatch,
        })
      );

      let addedModule: MemberModule | null = null;
      await act(async () => {
        addedModule = await result.current.addModule('New Module');
      });

      expect(addedModule).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Erro ao criar módulo');
    });

    it('deve adicionar módulo com descrição e cover image', async () => {
      const newModule = createMockMemberModule({
        id: 'module-2',
        title: 'New Module',
        position: 1,
        description: 'Module description',
        cover_image_url: 'https://example.com/image.jpg',
      });

      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true, module: newModule },
        error: null,
      });

      const { result } = renderHook(() =>
        useMembersAreaModules({
          productId: 'product-1',
          modules: mockModules,
          dispatch: mockDispatch,
        })
      );

      let addedModule: MemberModule | null = null;
      await act(async () => {
        addedModule = await result.current.addModule(
          'New Module',
          'Module description',
          'https://example.com/image.jpg'
        );
      });

      expect(addedModule).toEqual(newModule);
    });
  });

  describe('updateModule', () => {
    it('deve atualizar módulo com sucesso', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const { result } = renderHook(() =>
        useMembersAreaModules({
          productId: 'product-1',
          modules: mockModules,
          dispatch: mockDispatch,
        })
      );

      await act(async () => {
        await result.current.updateModule('module-1', { title: 'Updated Title' });
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_MODULE',
        id: 'module-1',
        data: { title: 'Updated Title' },
      });
      expect(toast.success).toHaveBeenCalledWith('Módulo atualizado!');
    });

    it('deve mostrar erro se API falhar', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { message: 'API Error', code: 'INTERNAL_ERROR' },
      });

      const { result } = renderHook(() =>
        useMembersAreaModules({
          productId: 'product-1',
          modules: mockModules,
          dispatch: mockDispatch,
        })
      );

      await act(async () => {
        await result.current.updateModule('module-1', { title: 'Updated Title' });
      });

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar módulo');
    });
  });

  describe('deleteModule', () => {
    it('deve deletar módulo com sucesso', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const { result } = renderHook(() =>
        useMembersAreaModules({
          productId: 'product-1',
          modules: mockModules,
          dispatch: mockDispatch,
        })
      );

      await act(async () => {
        await result.current.deleteModule('module-1');
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'DELETE_MODULE',
        id: 'module-1',
      });
      expect(toast.success).toHaveBeenCalledWith('Módulo deletado!');
    });

    it('deve mostrar erro se API falhar', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { message: 'API Error', code: 'INTERNAL_ERROR' },
      });

      const { result } = renderHook(() =>
        useMembersAreaModules({
          productId: 'product-1',
          modules: mockModules,
          dispatch: mockDispatch,
        })
      );

      await act(async () => {
        await result.current.deleteModule('module-1');
      });

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Erro ao deletar módulo');
    });
  });

  describe('reorderModules', () => {
    it('deve reordenar módulos com sucesso', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const { result } = renderHook(() =>
        useMembersAreaModules({
          productId: 'product-1',
          modules: mockModules,
          dispatch: mockDispatch,
        })
      );

      await act(async () => {
        await result.current.reorderModules(['module-2', 'module-1']);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'REORDER_MODULES',
        orderedIds: ['module-2', 'module-1'],
      });
      expect(toast.success).toHaveBeenCalledWith('Ordem atualizada!');
    });

    it('deve mostrar erro se API falhar', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { message: 'API Error', code: 'INTERNAL_ERROR' },
      });

      const { result } = renderHook(() =>
        useMembersAreaModules({
          productId: 'product-1',
          modules: mockModules,
          dispatch: mockDispatch,
        })
      );

      await act(async () => {
        await result.current.reorderModules(['module-2', 'module-1']);
      });

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Erro ao reordenar módulos');
    });
  });
});
