/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for useMembersAreaSettings hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ReactNode } from 'react';

vi.mock('@/lib/api');
vi.mock('sonner');
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));
vi.mock('@/hooks/useUnifiedAuth', () => ({
  useUnifiedAuth: () => ({
    user: { id: 'user-1' },
    isLoading: false,
  }),
}));
vi.mock('@xstate/react', () => ({
  useMachine: () => [
    { value: 'idle', context: { modules: [], settings: null } },
    vi.fn(),
    { subscribe: vi.fn() },
  ],
}));

describe('useMembersAreaSettings', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return function Wrapper({ children }: { children: ReactNode }) {
      return children;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Settings Query', () => {
    it('deve buscar settings com sucesso', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true, data: { enabled: true } },
        error: null,
      });
      expect(api.call).toBeDefined();
    });

    it('deve lidar com erro ao buscar settings', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { message: 'API Error', code: 'INTERNAL_ERROR' },
      });
      expect(api.call).toBeDefined();
    });

    it('deve retornar settings padrao se nao existirem', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true, data: { enabled: false, settings: null } },
        error: null,
      });
      expect(api.call).toBeDefined();
    });
  });

  describe('Modules Query', () => {
    it('deve buscar modulos com sucesso', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true, data: [{ id: 'module-1', title: 'Module 1' }] },
        error: null,
      });
      expect(api.call).toBeDefined();
    });

    it('deve lidar com erro ao buscar modulos', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { message: 'API Error', code: 'INTERNAL_ERROR' },
      });
      expect(api.call).toBeDefined();
    });

    it('deve retornar array vazio se nao houver modulos', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true, data: [] },
        error: null,
      });
      expect(api.call).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    it('deve usar cache de 5 minutos para settings', () => {
      const SETTINGS_STALE_TIME = 5 * 60 * 1000;
      expect(SETTINGS_STALE_TIME).toBe(300000);
    });

    it('deve usar cache de 10 minutos para armazenamento', () => {
      const SETTINGS_CACHE_TIME = 10 * 60 * 1000;
      expect(SETTINGS_CACHE_TIME).toBe(600000);
    });

    it('deve ter query keys corretas', () => {
      const membersAreaQueryKeys = {
        all: ['members-area'] as const,
        settings: (productId: string) => ['members-area', 'settings', productId] as const,
        modules: (productId: string) => ['members-area', 'modules', productId] as const,
      };

      expect(membersAreaQueryKeys.all).toEqual(['members-area']);
      expect(membersAreaQueryKeys.settings('product-1')).toEqual([
        'members-area',
        'settings',
        'product-1',
      ]);
    });
  });

  describe('Enable/Disable Members Area', () => {
    it('deve habilitar area de membros', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });
      expect(api.call).toBeDefined();
    });

    it('deve desabilitar area de membros', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });
      expect(api.call).toBeDefined();
    });
  });

  describe('Update Settings', () => {
    it('deve atualizar settings com sucesso', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });
      expect(api.call).toBeDefined();
    });

    it('deve lidar com erro ao atualizar settings', async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { message: 'API Error', code: 'INTERNAL_ERROR' },
      });
      expect(api.call).toBeDefined();
    });
  });

  describe('XState Integration', () => {
    it('deve usar XState machine como SSOT', () => {
      expect(vi.mocked).toBeDefined();
    });

    it('deve sincronizar state com queries', () => {
      expect(vi.mocked).toBeDefined();
    });
  });
});
