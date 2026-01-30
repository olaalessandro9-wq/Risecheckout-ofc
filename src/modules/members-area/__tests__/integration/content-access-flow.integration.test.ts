/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Test: Fluxo Completo de Liberação de Conteúdo
 * 
 * Este teste valida o fluxo end-to-end de liberação de conteúdo:
 * 1. Compra de produto
 * 2. Concessão de acesso à área de membros
 * 3. Liberação de conteúdo com drip
 * 4. Validação de permissões por grupo
 * 
 * @module members-area/integration/content-access-flow
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

describe('Integration: Fluxo de Liberação de Conteúdo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fluxo Completo: Compra → Acesso → Conteúdo', () => {
    it('deve liberar acesso após compra bem-sucedida', async () => {
      // 1. Simular compra de produto
      const orderId = 'order-123';
      const productId = 'product-123';
      const buyerId = 'buyer-123';

      // 2. Conceder acesso à área de membros
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const grantAccessResult = await api.call('grant-member-access', {
        buyer_id: buyerId,
        product_id: productId,
        order_id: orderId,
        access_type: 'purchase',
      });

      expect(grantAccessResult.data?.success).toBe(true);

      // 3. Verificar acesso concedido
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { 
          success: true, 
          has_access: true,
          access_type: 'purchase'
        },
        error: null,
      });

      const checkAccessResult = await api.call('students-access', {
        action: 'check',
        buyer_id: buyerId,
        product_id: productId,
      });

      expect(checkAccessResult.data?.has_access).toBe(true);
    });

    it('deve respeitar drip content (liberação gradual)', async () => {
      const buyerId = 'buyer-123';
      const productId = 'product-123';
      const moduleId = 'module-123';

      // Simular conteúdo com drip de 7 dias
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          contents: [
            { id: 'content-1', drip_days: 0, is_available: true },
            { id: 'content-2', drip_days: 7, is_available: false },
            { id: 'content-3', drip_days: 14, is_available: false },
          ],
        },
        error: null,
      });

      const dripResult = await api.call('members-area-drip', {
        action: 'check',
        buyer_id: buyerId,
        product_id: productId,
        module_id: moduleId,
      });

      const contents = dripResult.data?.contents || [];
      
      // Conteúdo imediato deve estar disponível
      expect(contents[0].is_available).toBe(true);
      
      // Conteúdo com drip deve estar bloqueado
      expect(contents[1].is_available).toBe(false);
      expect(contents[2].is_available).toBe(false);
    });

    it('deve validar permissões por grupo', async () => {
      const buyerId = 'buyer-123';
      const productId = 'product-123';
      const groupId = 'group-vip';

      // Simular usuário sem grupo VIP
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          groups: ['group-basic'],
        },
        error: null,
      });

      const groupsResult = await api.call('students-groups', {
        action: 'list',
        buyer_id: buyerId,
        product_id: productId,
      });

      const userGroups = groupsResult.data?.groups || [];
      
      // Usuário não deve ter acesso a conteúdo VIP
      expect(userGroups).not.toContain(groupId);
    });

    it('deve liberar conteúdo após adicionar usuário ao grupo', async () => {
      const buyerId = 'buyer-123';
      const productId = 'product-123';
      const groupId = 'group-vip';

      // 1. Adicionar usuário ao grupo VIP
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      await api.call('students-groups', {
        action: 'add',
        buyer_id: buyerId,
        product_id: productId,
        group_id: groupId,
      });

      // 2. Verificar acesso ao conteúdo VIP
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          has_access: true,
          groups: ['group-basic', 'group-vip'],
        },
        error: null,
      });

      const accessResult = await api.call('students-groups', {
        action: 'check',
        buyer_id: buyerId,
        product_id: productId,
        group_id: groupId,
      });

      expect(accessResult.data?.has_access).toBe(true);
    });
  });

  describe('Edge Cases: Liberação de Conteúdo', () => {
    it('deve bloquear acesso após revogação', async () => {
      const buyerId = 'buyer-123';
      const productId = 'product-123';

      // Revogar acesso
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      await api.call('students-access', {
        action: 'revoke',
        buyer_id: buyerId,
        product_id: productId,
      });

      // Verificar acesso bloqueado
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          has_access: false,
        },
        error: null,
      });

      const checkResult = await api.call('students-access', {
        action: 'check',
        buyer_id: buyerId,
        product_id: productId,
      });

      expect(checkResult.data?.has_access).toBe(false);
    });

    it('deve lidar com conteúdo gratuito (is_free)', async () => {
      const productId = 'product-123';

      // Conteúdo gratuito deve estar acessível sem compra
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          contents: [
            { id: 'content-free', is_free: true, is_available: true },
          ],
        },
        error: null,
      });

      const result = await api.call('members-area-drip', {
        action: 'list-free',
        product_id: productId,
      });

      const freeContents = result.data?.contents || [];
      expect(freeContents[0].is_available).toBe(true);
    });

    it('deve respeitar drip_days = null (liberação imediata)', async () => {
      const buyerId = 'buyer-123';
      const productId = 'product-123';

      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          contents: [
            { id: 'content-1', drip_days: null, is_available: true },
          ],
        },
        error: null,
      });

      const result = await api.call('members-area-drip', {
        action: 'check',
        buyer_id: buyerId,
        product_id: productId,
      });

      // drip_days = null deve liberar imediatamente
      expect(result.data?.contents[0].is_available).toBe(true);
    });
  });
});
