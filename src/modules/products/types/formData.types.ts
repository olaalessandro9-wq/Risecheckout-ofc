/**
 * Tipos de Dados de Formulário
 * 
 * Define as interfaces para dados editáveis nos formulários de produto.
 * Parte do sistema centralizado de Form State.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização de Tipos
 */

import type {
  ProductData,
  Offer,
  UpsellSettings,
  AffiliateSettings,
} from "./product.types";
import type { PaymentMethod } from "@/config/payment-gateways";

// ============================================================================
// CHECKOUT SETTINGS
// ============================================================================

/**
 * Dados do formulário de configurações de checkout
 */
export interface CheckoutSettingsFormData {
  required_fields: {
    name: boolean;
    email: boolean;
    phone: boolean;
    cpf: boolean;
  };
  default_payment_method: PaymentMethod;
  pix_gateway: string;
  credit_card_gateway: string;
}

/**
 * Status de credencial de gateway
 */
export interface GatewayCredentialStatus {
  configured: boolean;
  viaSecrets?: boolean;
}

/**
 * Credenciais de gateways de pagamento
 */
export interface GatewayCredentials {
  mercadopago?: GatewayCredentialStatus;
  pushinpay?: GatewayCredentialStatus;
  stripe?: GatewayCredentialStatus;
  asaas?: GatewayCredentialStatus;
  [key: string]: GatewayCredentialStatus | undefined;
}

// ============================================================================
// FORM DATA TYPES (Dados Editáveis)
// ============================================================================

/**
 * Dados do formulário da aba Geral
 */
export interface GeneralFormData {
  name: string;
  description: string;
  price: number;
  support_name: string;
  support_email: string;
  delivery_url: string;
  external_delivery: boolean;
}

/**
 * Estado da imagem no formulário
 */
export interface ImageFormState {
  imageFile: File | null;
  imageUrl: string;
  pendingRemoval: boolean;
}

/**
 * Dados do formulário de ofertas
 */
export interface OffersFormState {
  localOffers: Offer[];
  deletedOfferIds: string[];
  modified: boolean;
}

// ============================================================================
// SERVER DATA SNAPSHOT
// ============================================================================

/**
 * Snapshot dos dados como vieram do servidor
 * Usado para comparação e detecção de mudanças
 */
export interface ServerDataSnapshot {
  product: ProductData | null;
  general: GeneralFormData;
  upsell: UpsellSettings;
  affiliateSettings: AffiliateSettings | null;
  offers: Offer[];
  checkoutSettings: CheckoutSettingsFormData;
}

// ============================================================================
// EDITED DATA
// ============================================================================

/**
 * Dados atualmente sendo editados pelo usuário
 */
export interface EditedFormData {
  general: GeneralFormData;
  image: ImageFormState;
  offers: OffersFormState;
  upsell: UpsellSettings;
  affiliate: AffiliateSettings | null;
  checkoutSettings: CheckoutSettingsFormData;
}

// ============================================================================
// VALIDATION STATE
// ============================================================================

/**
 * Erros de validação por campo
 */
export interface FormValidationErrors {
  general: {
    name?: string;
    description?: string;
    price?: string;
    support_name?: string;
    support_email?: string;
    delivery_url?: string;
  };
  upsell: {
    customPageUrl?: string;
  };
  affiliate: {
    defaultRate?: string;
    cookieDuration?: string;
    supportEmail?: string;
    marketplaceDescription?: string;
    marketplaceCategory?: string;
  };
}
