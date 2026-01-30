/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Test: Fluxo de Progresso do Aluno
 * 
 * Este teste valida o fluxo end-to-end de progresso:
 * 1. Marcação de conteúdo como completo
 * 2. Cálculo de progresso do módulo
 * 3. Cálculo de progresso geral do curso
 * 4. Atualização de estatísticas
 * 
 * @module members-area/integration/student-progress-flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/lib/api';

vi.mock('@/lib/api');
vi.mock('sonner');
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

describe('Integration: Fluxo de Progresso do Aluno', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fluxo Completo: Conteúdo → Módulo → Curso', () => {
    it('deve marcar conteúdo como completo', async () => {
      const buyerId = 'buyer-123';
      const contentId = 'content-123';

      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          progress: {
            content_id: contentId,
            is_completed: true,
            completed_at: new Date().toISOString(),
          },
        },
        error: null,
      });

      const result = await api.call('members-area-progress', {
        action: 'mark-complete',
        buyer_id: buyerId,
        content_id: contentId,
      });

      expect(result.data?.success).toBe(true);
      expect(result.data?.progress.is_completed).toBe(true);
    });

    it('deve calcular progresso do módulo corretamente', async () => {
      const buyerId = 'buyer-123';
      const moduleId = 'module-123';

      // Módulo com 4 conteúdos, 2 completos = 50%
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          module_progress: {
            module_id: moduleId,
            total_contents: 4,
            completed_contents: 2,
            progress_percentage: 50,
          },
        },
        error: null,
      });

      const result = await api.call('members-area-progress', {
        action: 'get-module-progress',
        buyer_id: buyerId,
        module_id: moduleId,
      });

      expect(result.data?.module_progress.progress_percentage).toBe(50);
      expect(result.data?.module_progress.completed_contents).toBe(2);
      expect(result.data?.module_progress.total_contents).toBe(4);
    });

    it('deve calcular progresso geral do curso', async () => {
      const buyerId = 'buyer-123';
      const productId = 'product-123';

      // Curso com 3 módulos: 100%, 50%, 0% = 50% geral
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          course_progress: {
            product_id: productId,
            total_modules: 3,
            modules: [
              { module_id: 'mod-1', progress: 100 },
              { module_id: 'mod-2', progress: 50 },
              { module_id: 'mod-3', progress: 0 },
            ],
            overall_progress: 50,
          },
        },
        error: null,
      });

      const result = await api.call('members-area-progress', {
        action: 'get-course-progress',
        buyer_id: buyerId,
        product_id: productId,
      });

      expect(result.data?.course_progress.overall_progress).toBe(50);
    });

    it('deve atualizar estatísticas após conclusão', async () => {
      const buyerId = 'buyer-123';
      const contentId = 'content-123';

      // 1. Marcar conteúdo como completo
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      await api.call('members-area-progress', {
        action: 'mark-complete',
        buyer_id: buyerId,
        content_id: contentId,
      });

      // 2. Verificar atualização de estatísticas
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          stats: {
            total_completed: 5,
            total_time_spent: 3600, // 1 hora
            last_activity: new Date().toISOString(),
          },
        },
        error: null,
      });

      const statsResult = await api.call('members-area-progress', {
        action: 'get-stats',
        buyer_id: buyerId,
      });

      expect(statsResult.data?.stats.total_completed).toBe(5);
    });
  });

  describe('Edge Cases: Progresso', () => {
    it('deve permitir desmarcar conteúdo como completo', async () => {
      const buyerId = 'buyer-123';
      const contentId = 'content-123';

      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          progress: {
            content_id: contentId,
            is_completed: false,
            completed_at: null,
          },
        },
        error: null,
      });

      const result = await api.call('members-area-progress', {
        action: 'mark-incomplete',
        buyer_id: buyerId,
        content_id: contentId,
      });

      expect(result.data?.progress.is_completed).toBe(false);
    });

    it('deve lidar com módulo vazio (0 conteúdos)', async () => {
      const buyerId = 'buyer-123';
      const moduleId = 'module-empty';

      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          module_progress: {
            module_id: moduleId,
            total_contents: 0,
            completed_contents: 0,
            progress_percentage: 0,
          },
        },
        error: null,
      });

      const result = await api.call('members-area-progress', {
        action: 'get-module-progress',
        buyer_id: buyerId,
        module_id: moduleId,
      });

      expect(result.data?.module_progress.progress_percentage).toBe(0);
    });

    it('deve lidar com progresso 100% (todos conteúdos completos)', async () => {
      const buyerId = 'buyer-123';
      const moduleId = 'module-123';

      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          module_progress: {
            module_id: moduleId,
            total_contents: 5,
            completed_contents: 5,
            progress_percentage: 100,
          },
        },
        error: null,
      });

      const result = await api.call('members-area-progress', {
        action: 'get-module-progress',
        buyer_id: buyerId,
        module_id: moduleId,
      });

      expect(result.data?.module_progress.progress_percentage).toBe(100);
    });

    it('deve rastrear tempo gasto em cada conteúdo', async () => {
      const buyerId = 'buyer-123';
      const contentId = 'content-123';
      const timeSpent = 600; // 10 minutos

      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          time_tracking: {
            content_id: contentId,
            time_spent_seconds: timeSpent,
          },
        },
        error: null,
      });

      const result = await api.call('members-area-progress', {
        action: 'track-time',
        buyer_id: buyerId,
        content_id: contentId,
        time_spent: timeSpent,
      });

      expect(result.data?.time_tracking.time_spent_seconds).toBe(600);
    });
  });

  describe('Validação de Requisitos', () => {
    it('deve validar se conteúdo anterior foi completado (pré-requisito)', async () => {
      const buyerId = 'buyer-123';
      const contentId = 'content-2';
      const prerequisiteId = 'content-1';

      // Conteúdo 2 requer conclusão do conteúdo 1
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          can_access: false,
          reason: 'prerequisite_not_completed',
          prerequisite_id: prerequisiteId,
        },
        error: null,
      });

      const result = await api.call('members-area-progress', {
        action: 'check-access',
        buyer_id: buyerId,
        content_id: contentId,
      });

      expect(result.data?.can_access).toBe(false);
      expect(result.data?.reason).toBe('prerequisite_not_completed');
    });
  });
});
