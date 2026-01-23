/**
 * Certificates Service
 * Communicates with members-area-certificates Edge Function
 * 
 * RISE V3: Uses credentials: 'include' for httpOnly cookies
 */

import { SUPABASE_URL } from '@/config/supabase';
import type {
  CertificateTemplate,
  Certificate,
  CertificateVerification,
  CreateTemplateInput,
  UpdateTemplateInput,
  GenerateCertificateInput,
} from '../types';

const FUNCTION_NAME = 'members-area-certificates';

interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Invoke the certificates edge function with authentication
 */
async function invokeCertificatesFunction<T>(
  action: string,
  payload: object
): Promise<ServiceResponse<T>> {
  try {
    // RISE V3: Autenticação via cookies httpOnly (credentials: include)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || `HTTP ${response.status}` };
    }

    return { data: data as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * List certificate templates for a product
 */
export async function listTemplates(
  productId: string
): Promise<ServiceResponse<CertificateTemplate[]>> {
  return invokeCertificatesFunction<CertificateTemplate[]>('list_templates', {
    product_id: productId,
  });
}

/**
 * Create a new certificate template
 */
export async function createTemplate(
  input: CreateTemplateInput
): Promise<ServiceResponse<CertificateTemplate>> {
  return invokeCertificatesFunction<CertificateTemplate>('create_template', input);
}

/**
 * Update a certificate template
 */
export async function updateTemplate(
  templateId: string,
  input: UpdateTemplateInput
): Promise<ServiceResponse<CertificateTemplate>> {
  return invokeCertificatesFunction<CertificateTemplate>('update_template', {
    template_id: templateId,
    ...input,
  });
}

/**
 * Delete a certificate template
 */
export async function deleteTemplate(
  templateId: string
): Promise<ServiceResponse<{ success: boolean }>> {
  return invokeCertificatesFunction<{ success: boolean }>('delete_template', {
    template_id: templateId,
  });
}

/**
 * Generate a certificate for a student
 */
export async function generateCertificate(
  buyerId: string,
  input: GenerateCertificateInput
): Promise<ServiceResponse<Certificate>> {
  return invokeCertificatesFunction<Certificate>('generate', {
    buyer_id: buyerId,
    ...input,
  });
}

/**
 * Get all certificates for a student
 */
export async function getStudentCertificates(
  buyerId: string
): Promise<ServiceResponse<Certificate[]>> {
  return invokeCertificatesFunction<Certificate[]>('get_student_certificates', {
    buyer_id: buyerId,
  });
}

/**
 * Verify a certificate by code (public endpoint)
 */
export async function verifyCertificate(
  verificationCode: string
): Promise<ServiceResponse<CertificateVerification>> {
  // This could be a public endpoint without auth
  return invokeCertificatesFunction<CertificateVerification>('verify', {
    verification_code: verificationCode,
  });
}

/**
 * Download certificate PDF
 */
export async function downloadCertificate(
  certificateId: string
): Promise<ServiceResponse<{ pdf_url: string }>> {
  return invokeCertificatesFunction<{ pdf_url: string }>('download', {
    certificate_id: certificateId,
  });
}

export const certificatesService = {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generate: generateCertificate,
  getStudentCertificates,
  verify: verifyCertificate,
  download: downloadCertificate,
};
