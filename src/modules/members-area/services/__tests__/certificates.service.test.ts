/**
 * Certificates Service Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateCertificate,
  getStudentCertificates,
  verifyCertificate,
  downloadCertificate,
  certificatesService,
} from '../certificates.service';

// Mock SUPABASE_URL
vi.mock('@/config/supabase', () => ({
  SUPABASE_URL: 'https://test.supabase.co',
}));

describe('certificates.service', () => {
  const originalFetch = global.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.stubGlobal('fetch', originalFetch);
  });

  describe('invokeCertificatesFunction', () => {
    it('should include credentials in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await listTemplates('product-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/members-area-certificates',
        expect.objectContaining({
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const result = await listTemplates('product-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Server error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failed'));

      const result = await listTemplates('product-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Network failed');
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValueOnce('unknown');

      const result = await listTemplates('product-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('listTemplates', () => {
    it('should fetch templates for a product', async () => {
      const templates = [{ id: 'tpl-1', name: 'Template 1' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(templates),
      });

      const result = await listTemplates('product-123');

      expect(result.data).toEqual(templates);
      expect(result.error).toBeNull();
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('list_templates');
      expect(body.product_id).toBe('product-123');
    });
  });

  describe('createTemplate', () => {
    it('should create a new template', async () => {
      const newTemplate = { id: 'tpl-new', name: 'New Template' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newTemplate),
      });

      const result = await createTemplate({
        product_id: 'product-123',
        name: 'New Template',
      });

      expect(result.data).toEqual(newTemplate);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('create_template');
      expect(body.product_id).toBe('product-123');
    });
  });

  describe('updateTemplate', () => {
    it('should update an existing template', async () => {
      const updated = { id: 'tpl-1', name: 'Updated' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updated),
      });

      const result = await updateTemplate('tpl-1', { name: 'Updated' });

      expect(result.data).toEqual(updated);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('update_template');
      expect(body.template_id).toBe('tpl-1');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await deleteTemplate('tpl-1');

      expect(result.data).toEqual({ success: true });
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('delete_template');
      expect(body.template_id).toBe('tpl-1');
    });
  });

  describe('generateCertificate', () => {
    it('should generate a certificate for a student', async () => {
      const certificate = { id: 'cert-1', buyer_id: 'buyer-123' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(certificate),
      });

      const result = await generateCertificate('buyer-123', {
        product_id: 'product-123',
        template_id: 'tpl-1',
      });

      expect(result.data).toEqual(certificate);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('generate');
      expect(body.buyer_id).toBe('buyer-123');
    });
  });

  describe('getStudentCertificates', () => {
    it('should fetch certificates for a student', async () => {
      const certs = [{ id: 'cert-1' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(certs),
      });

      const result = await getStudentCertificates('buyer-123');

      expect(result.data).toEqual(certs);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('get_student_certificates');
    });
  });

  describe('verifyCertificate', () => {
    it('should verify a certificate by code', async () => {
      const verification = { valid: true, certificate_id: 'cert-1' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(verification),
      });

      const result = await verifyCertificate('ABC123');

      expect(result.data).toEqual(verification);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('verify');
      expect(body.verification_code).toBe('ABC123');
    });
  });

  describe('downloadCertificate', () => {
    it('should get download URL for a certificate', async () => {
      const download = { pdf_url: 'https://storage/cert.pdf' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(download),
      });

      const result = await downloadCertificate('cert-1');

      expect(result.data).toEqual(download);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('download');
      expect(body.certificate_id).toBe('cert-1');
    });
  });

  describe('certificatesService object', () => {
    it('should export all methods', () => {
      expect(certificatesService.listTemplates).toBe(listTemplates);
      expect(certificatesService.createTemplate).toBe(createTemplate);
      expect(certificatesService.updateTemplate).toBe(updateTemplate);
      expect(certificatesService.deleteTemplate).toBe(deleteTemplate);
      expect(certificatesService.generate).toBe(generateCertificate);
      expect(certificatesService.getStudentCertificates).toBe(getStudentCertificates);
      expect(certificatesService.verify).toBe(verifyCertificate);
      expect(certificatesService.download).toBe(downloadCertificate);
    });
  });
});
