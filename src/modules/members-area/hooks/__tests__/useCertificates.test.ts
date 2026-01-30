/**
 * useCertificates Hook Tests
 * 
 * RISE V3 Compliant - 10.0/10
 * Tests certificate template CRUD and certificate generation
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCertificates } from "../useCertificates";
import { certificatesService } from "../../services/certificates.service";
import type { CertificateTemplate, Certificate, CertificateVerification } from "../../types";

// Mock dependencies
vi.mock("../../services/certificates.service", () => ({
  certificatesService: {
    listTemplates: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    generate: vi.fn(),
    getStudentCertificates: vi.fn(),
    verify: vi.fn(),
    download: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Test factories
function createMockTemplate(overrides: Partial<CertificateTemplate> = {}): CertificateTemplate {
  return {
    id: "template-1",
    product_id: "product-1",
    name: "Certificate of Completion",
    template_html: "<html>Certificate</html>",
    primary_color: "#000000",
    secondary_color: "#ffffff",
    logo_url: null,
    background_image_url: null,
    is_default: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockCertificate(overrides: Partial<Certificate> = {}): Certificate {
  return {
    id: "cert-1",
    buyer_id: "buyer-1",
    buyer_name: "John Doe",
    product_id: "product-1",
    product_name: "Course 101",
    template_id: "template-1",
    verification_code: "ABC123",
    pdf_url: "https://example.com/cert.pdf",
    completion_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    metadata: null,
    ...overrides,
  };
}

describe("useCertificates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should start with empty templates and certificates", () => {
      const { result } = renderHook(() => useCertificates());

      expect(result.current.templates).toEqual([]);
      expect(result.current.certificates).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSaving).toBe(false);
    });
  });

  describe("fetchTemplates", () => {
    it("should fetch templates successfully", async () => {
      const mockTemplates = [createMockTemplate()];
      (certificatesService.listTemplates as Mock).mockResolvedValueOnce({
        data: mockTemplates,
        error: null,
      });

      const { result } = renderHook(() => useCertificates());

      await act(async () => {
        await result.current.fetchTemplates("product-1");
      });

      expect(result.current.templates).toEqual(mockTemplates);
      expect(certificatesService.listTemplates).toHaveBeenCalledWith("product-1");
    });

    it("should handle fetch error", async () => {
      (certificatesService.listTemplates as Mock).mockResolvedValueOnce({
        data: null,
        error: "Network error",
      });

      const { result } = renderHook(() => useCertificates());

      await act(async () => {
        await result.current.fetchTemplates("product-1");
      });

      expect(result.current.templates).toEqual([]);
    });
  });

  describe("createTemplate", () => {
    it("should create template and add to list", async () => {
      const newTemplate = createMockTemplate({ id: "new-template" });
      (certificatesService.createTemplate as Mock).mockResolvedValueOnce({
        data: newTemplate,
        error: null,
      });

      const { result } = renderHook(() => useCertificates());

      let createdTemplate: CertificateTemplate | null = null;
      await act(async () => {
        createdTemplate = await result.current.createTemplate({
          product_id: "product-1",
          name: "New Certificate",
        });
      });

      expect(createdTemplate).toEqual(newTemplate);
      expect(result.current.templates).toContainEqual(newTemplate);
    });

    it("should return null on create error", async () => {
      (certificatesService.createTemplate as Mock).mockResolvedValueOnce({
        data: null,
        error: "Create failed",
      });

      const { result } = renderHook(() => useCertificates());

      let createdTemplate: CertificateTemplate | null = null;
      await act(async () => {
        createdTemplate = await result.current.createTemplate({
          product_id: "product-1",
          name: "New Certificate",
        });
      });

      expect(createdTemplate).toBeNull();
    });
  });

  describe("updateTemplate", () => {
    it("should update template in list", async () => {
      const original = createMockTemplate({ id: "template-1", name: "Original" });
      const updated = { ...original, name: "Updated" };

      (certificatesService.listTemplates as Mock).mockResolvedValueOnce({
        data: [original],
        error: null,
      });
      (certificatesService.updateTemplate as Mock).mockResolvedValueOnce({
        data: updated,
        error: null,
      });

      const { result } = renderHook(() => useCertificates());

      await act(async () => {
        await result.current.fetchTemplates("product-1");
      });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.updateTemplate("template-1", { name: "Updated" });
      });

      expect(success).toBe(true);
      expect(result.current.templates[0].name).toBe("Updated");
    });
  });

  describe("deleteTemplate", () => {
    it("should remove template from list", async () => {
      const template = createMockTemplate({ id: "template-to-delete" });

      (certificatesService.listTemplates as Mock).mockResolvedValueOnce({
        data: [template],
        error: null,
      });
      (certificatesService.deleteTemplate as Mock).mockResolvedValueOnce({
        error: null,
      });

      const { result } = renderHook(() => useCertificates());

      await act(async () => {
        await result.current.fetchTemplates("product-1");
      });

      expect(result.current.templates).toHaveLength(1);

      let success: boolean = false;
      await act(async () => {
        success = await result.current.deleteTemplate("template-to-delete");
      });

      expect(success).toBe(true);
      expect(result.current.templates).toHaveLength(0);
    });
  });

  describe("generateCertificate", () => {
    it("should generate certificate and add to list", async () => {
      const newCert = createMockCertificate();
      (certificatesService.generate as Mock).mockResolvedValueOnce({
        data: newCert,
        error: null,
      });

      const { result } = renderHook(() => useCertificates());

      let generated: Certificate | null = null;
      await act(async () => {
        generated = await result.current.generateCertificate("buyer-1", {
          product_id: "product-1",
          template_id: "template-1",
        });
      });

      expect(generated).toEqual(newCert);
      expect(result.current.certificates).toContainEqual(newCert);
    });
  });

  describe("verifyCertificate", () => {
    it("should verify certificate by code", async () => {
      const verification: CertificateVerification = {
        is_valid: true,
        certificate: createMockCertificate(),
      };
      (certificatesService.verify as Mock).mockResolvedValueOnce({
        data: verification,
        error: null,
      });

      const { result } = renderHook(() => useCertificates());

      let verificationResult: CertificateVerification | null = null;
      await act(async () => {
        verificationResult = await result.current.verifyCertificate("ABC123");
      });

      expect(verificationResult).toEqual(verification);
      expect(certificatesService.verify).toHaveBeenCalledWith("ABC123");
    });
  });

  describe("downloadCertificate", () => {
    it("should return PDF URL on success", async () => {
      (certificatesService.download as Mock).mockResolvedValueOnce({
        data: { pdf_url: "https://example.com/download.pdf" },
        error: null,
      });

      const { result } = renderHook(() => useCertificates());

      let pdfUrl: string | null = null;
      await act(async () => {
        pdfUrl = await result.current.downloadCertificate("cert-1");
      });

      expect(pdfUrl).toBe("https://example.com/download.pdf");
    });

    it("should return null on download error", async () => {
      (certificatesService.download as Mock).mockResolvedValueOnce({
        data: null,
        error: "Download failed",
      });

      const { result } = renderHook(() => useCertificates());

      let pdfUrl: string | null = null;
      await act(async () => {
        pdfUrl = await result.current.downloadCertificate("cert-1");
      });

      expect(pdfUrl).toBeNull();
    });
  });
});
