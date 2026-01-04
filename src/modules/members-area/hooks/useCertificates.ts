/**
 * useCertificates Hook
 * Manages certificate templates and issued certificates
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { certificatesService } from '../services/certificates.service';
import type {
  CertificateTemplate,
  Certificate,
  CertificateVerification,
  CreateTemplateInput,
  UpdateTemplateInput,
  GenerateCertificateInput,
} from '../types';

interface UseCertificatesReturn {
  templates: CertificateTemplate[];
  certificates: Certificate[];
  isLoading: boolean;
  isSaving: boolean;
  fetchTemplates: (productId: string) => Promise<void>;
  createTemplate: (input: CreateTemplateInput) => Promise<CertificateTemplate | null>;
  updateTemplate: (templateId: string, input: UpdateTemplateInput) => Promise<boolean>;
  deleteTemplate: (templateId: string) => Promise<boolean>;
  generateCertificate: (buyerId: string, input: GenerateCertificateInput) => Promise<Certificate | null>;
  fetchStudentCertificates: (buyerId: string) => Promise<void>;
  verifyCertificate: (code: string) => Promise<CertificateVerification | null>;
  downloadCertificate: (certificateId: string) => Promise<string | null>;
}

export function useCertificates(): UseCertificatesReturn {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTemplates = useCallback(async (productId: string): Promise<void> => {
    setIsLoading(true);

    const { data, error } = await certificatesService.listTemplates(productId);

    if (error) {
      toast.error('Erro ao carregar templates');
    } else if (data) {
      setTemplates(data);
    }

    setIsLoading(false);
  }, []);

  const createTemplate = useCallback(async (
    input: CreateTemplateInput
  ): Promise<CertificateTemplate | null> => {
    setIsSaving(true);

    const { data, error } = await certificatesService.createTemplate(input);

    if (error) {
      toast.error('Erro ao criar template');
      setIsSaving(false);
      return null;
    }

    if (data) {
      setTemplates(prev => [...prev, data]);
      toast.success('Template criado com sucesso');
    }

    setIsSaving(false);
    return data;
  }, []);

  const updateTemplate = useCallback(async (
    templateId: string,
    input: UpdateTemplateInput
  ): Promise<boolean> => {
    setIsSaving(true);

    const { data, error } = await certificatesService.updateTemplate(templateId, input);

    if (error) {
      toast.error('Erro ao atualizar template');
      setIsSaving(false);
      return false;
    }

    if (data) {
      setTemplates(prev => prev.map(t => t.id === templateId ? data : t));
      toast.success('Template atualizado');
    }

    setIsSaving(false);
    return true;
  }, []);

  const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    setIsSaving(true);

    const { error } = await certificatesService.deleteTemplate(templateId);

    if (error) {
      toast.error('Erro ao excluir template');
      setIsSaving(false);
      return false;
    }

    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast.success('Template excluído');

    setIsSaving(false);
    return true;
  }, []);

  const generateCertificate = useCallback(async (
    buyerId: string,
    input: GenerateCertificateInput
  ): Promise<Certificate | null> => {
    setIsSaving(true);

    const { data, error } = await certificatesService.generate(buyerId, input);

    if (error) {
      toast.error('Erro ao gerar certificado');
      setIsSaving(false);
      return null;
    }

    if (data) {
      setCertificates(prev => [...prev, data]);
      toast.success('Certificado gerado com sucesso!');
    }

    setIsSaving(false);
    return data;
  }, []);

  const fetchStudentCertificates = useCallback(async (buyerId: string): Promise<void> => {
    setIsLoading(true);

    const { data, error } = await certificatesService.getStudentCertificates(buyerId);

    if (error) {
      toast.error('Erro ao carregar certificados');
    } else if (data) {
      setCertificates(data);
    }

    setIsLoading(false);
  }, []);

  const verifyCertificate = useCallback(async (
    code: string
  ): Promise<CertificateVerification | null> => {
    setIsLoading(true);

    const { data, error } = await certificatesService.verify(code);

    if (error) {
      toast.error('Erro ao verificar certificado');
      setIsLoading(false);
      return null;
    }

    setIsLoading(false);
    return data;
  }, []);

  const downloadCertificate = useCallback(async (
    certificateId: string
  ): Promise<string | null> => {
    setIsLoading(true);

    const { data, error } = await certificatesService.download(certificateId);

    if (error) {
      toast.error('Erro ao baixar certificado');
      setIsLoading(false);
      return null;
    }

    setIsLoading(false);
    return data?.pdf_url ?? null;
  }, []);

  return {
    templates,
    certificates,
    isLoading,
    isSaving,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    generateCertificate,
    fetchStudentCertificates,
    verifyCertificate,
    downloadCertificate,
  };
}
