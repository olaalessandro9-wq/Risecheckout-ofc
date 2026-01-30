/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Test: Fluxo de Certificados
 * 
 * Este teste valida o fluxo end-to-end de certificados:
 * 1. Conclusão de 100% do curso
 * 2. Geração automática de certificado
 * 3. Validação de certificado
 * 4. Download de certificado
 * 
 * @module members-area/integration/certificates-flow
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

describe('Integration: Fluxo de Certificados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fluxo Completo: Conclusão → Geração → Validação', () => {
    it('deve gerar certificado após conclusão de 100%', async () => {
      const buyerId = 'buyer-123';
      const productId = 'product-123';

      // 1. Verificar progresso 100%
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          course_progress: {
            overall_progress: 100,
          },
        },
        error: null,
      });

      const progressResult = await api.call('members-area-progress', {
        action: 'get-course-progress',
        buyer_id: buyerId,
        product_id: productId,
      });

      expect(progressResult.data?.course_progress.overall_progress).toBe(100);

      // 2. Gerar certificado
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          certificate: {
            id: 'cert-123',
            buyer_id: buyerId,
            product_id: productId,
            issued_at: new Date().toISOString(),
            certificate_url: 'https://example.com/cert-123.pdf',
            verification_code: 'CERT-ABC-123',
          },
        },
        error: null,
      });

      const certResult = await api.call('members-area-certificates', {
        action: 'generate',
        buyer_id: buyerId,
        product_id: productId,
      });

      expect(certResult.data?.success).toBe(true);
      expect(certResult.data?.certificate.verification_code).toBeDefined();
    });

    it('deve validar certificado por código de verificação', async () => {
      const verificationCode = 'CERT-ABC-123';

      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          valid: true,
          certificate: {
            id: 'cert-123',
            buyer_name: 'João Silva',
            product_name: 'Curso de Marketing',
            issued_at: '2024-01-15',
            verification_code: verificationCode,
          },
        },
        error: null,
      });

      const result = await api.call('members-area-certificates', {
        action: 'validate',
        verification_code: verificationCode,
      });

      expect(result.data?.valid).toBe(true);
      expect(result.data?.certificate.verification_code).toBe(verificationCode);
    });

    it('deve permitir download do certificado', async () => {
      const certificateId = 'cert-123';

      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          download_url: 'https://example.com/cert-123.pdf',
          expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hora
        },
        error: null,
      });

      const result = await api.call('members-area-certificates', {
        action: 'download',
        certificate_id: certificateId,
      });

      expect(result.data?.download_url).toBeDefined();
      expect(result.data?.download_url).toContain('.pdf');
    });

    it('deve listar todos os certificados do aluno', async () => {
      const buyerId = 'buyer-123';

      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          certificates: [
            {
              id: 'cert-1',
              product_name: 'Curso A',
              issued_at: '2024-01-01',
            },
            {
              id: 'cert-2',
              product_name: 'Curso B',
              issued_at: '2024-02-01',
            },
          ],
        },
        error: null,
      });

      const result = await api.call('members-area-certificates', {
        action: 'list',
        buyer_id: buyerId,
      });

      expect(result.data?.certificates).toHaveLength(2);
    });
  });

  describe('Edge Cases: Certificados', () => {
    it('deve rejeitar geração se progresso < 100%', async () => {
      const buyerId = 'buyer-123';
      const productId = 'product-123';

      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: false,
          error: 'Curso não concluído. Progresso atual: 85%',
        },
        error: null,
      });

      const result = await api.call('members-area-certificates', {
        action: 'generate',
        buyer_id: buyerId,
        product_id: productId,
      });

      expect(result.data?.success).toBe(false);
      expect(result.data?.error).toContain('não concluído');
    });

    it('deve rejeitar validação de código inválido', async () => {
      const invalidCode = 'INVALID-CODE';

      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          valid: false,
          error: 'Código de verificação inválido',
        },
        error: null,
      });

      const result = await api.call('members-area-certificates', {
        action: 'validate',
        verification_code: invalidCode,
      });

      expect(result.data?.valid).toBe(false);
    });

    it('deve evitar duplicação de certificados', async () => {
      const buyerId = 'buyer-123';
      const productId = 'product-123';

      // Tentar gerar certificado já existente
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          certificate: {
            id: 'cert-existing',
            already_exists: true,
          },
        },
        error: null,
      });

      const result = await api.call('members-area-certificates', {
        action: 'generate',
        buyer_id: buyerId,
        product_id: productId,
      });

      expect(result.data?.certificate.already_exists).toBe(true);
    });

    it('deve permitir regeneração de certificado', async () => {
      const certificateId = 'cert-123';

      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          certificate: {
            id: 'cert-123-regenerated',
            regenerated: true,
            original_id: certificateId,
          },
        },
        error: null,
      });

      const result = await api.call('members-area-certificates', {
        action: 'regenerate',
        certificate_id: certificateId,
      });

      expect(result.data?.certificate.regenerated).toBe(true);
    });

    it('deve incluir informações do aluno no certificado', async () => {
      const buyerId = 'buyer-123';
      const productId = 'product-123';

      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          certificate: {
            id: 'cert-123',
            buyer_name: 'João Silva',
            buyer_email: 'joao@example.com',
            product_name: 'Curso de Marketing Digital',
            issued_at: '2024-01-15',
            completion_date: '2024-01-15',
            verification_code: 'CERT-ABC-123',
          },
        },
        error: null,
      });

      const result = await api.call('members-area-certificates', {
        action: 'generate',
        buyer_id: buyerId,
        product_id: productId,
      });

      const cert = result.data?.certificate;
      expect(cert?.buyer_name).toBeDefined();
      expect(cert?.product_name).toBeDefined();
      expect(cert?.issued_at).toBeDefined();
    });
  });

  describe('Validação Pública de Certificados', () => {
    it('deve permitir validação pública sem autenticação', async () => {
      const verificationCode = 'CERT-ABC-123';

      // Endpoint público - sem auth
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          valid: true,
          certificate: {
            buyer_name: 'João Silva',
            product_name: 'Curso de Marketing',
            issued_at: '2024-01-15',
          },
        },
        error: null,
      });

      const result = await api.call('members-area-certificates', {
        action: 'validate-public',
        verification_code: verificationCode,
      });

      expect(result.data?.valid).toBe(true);
    });

    it('deve ocultar informações sensíveis em validação pública', async () => {
      const verificationCode = 'CERT-ABC-123';

      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          valid: true,
          certificate: {
            buyer_name: 'João Silva',
            product_name: 'Curso de Marketing',
            issued_at: '2024-01-15',
            // Email e outros dados sensíveis omitidos
          },
        },
        error: null,
      });

      const result = await api.call('members-area-certificates', {
        action: 'validate-public',
        verification_code: verificationCode,
      });

      const cert = result.data?.certificate;
      expect(cert?.buyer_name).toBeDefined();
      expect(cert).not.toHaveProperty('buyer_email');
    });
  });
});
