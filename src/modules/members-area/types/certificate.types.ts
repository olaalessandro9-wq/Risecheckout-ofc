/**
 * Types for Certificates
 * Customizable templates and issued certificates
 */

/** Certificate template for customization */
export interface CertificateTemplate {
  id: string;
  product_id: string;
  name: string;
  template_html: string | null;
  background_image_url: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Issued certificate for a student */
export interface Certificate {
  id: string;
  buyer_id: string;
  product_id: string;
  template_id: string | null;
  buyer_name: string;
  product_name: string;
  verification_code: string;
  completion_date: string;
  pdf_url: string | null;
  metadata: CertificateMetadata | null;
  created_at: string;
}

/** Additional metadata stored with certificate */
export interface CertificateMetadata {
  total_hours?: number;
  modules_completed?: number;
  quizzes_passed?: number;
  final_score?: number;
  instructor_name?: string;
  custom_fields?: Record<string, string>;
}

/** Public verification response */
export interface CertificateVerification {
  is_valid: boolean;
  certificate: {
    buyer_name: string;
    product_name: string;
    completion_date: string;
    verification_code: string;
  } | null;
  error?: string;
}

/** Input for creating a certificate template */
export interface CreateTemplateInput {
  product_id: string;
  name: string;
  template_html?: string;
  background_image_url?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  is_default?: boolean;
}

/** Input for updating a certificate template */
export interface UpdateTemplateInput {
  name?: string;
  template_html?: string;
  background_image_url?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  is_default?: boolean;
  is_active?: boolean;
}

/** Input for generating a certificate */
export interface GenerateCertificateInput {
  product_id: string;
  template_id?: string;
  custom_metadata?: CertificateMetadata;
}

/** Certificate with template details */
export interface CertificateWithTemplate extends Certificate {
  template: CertificateTemplate | null;
}
