/**
 * Rate Limiting Configurations
 * 
 * Configurações centralizadas para todas as ações de rate limiting.
 * Cada domínio tem sua própria configuração otimizada.
 * 
 * @version 1.0.0 - RISE V3 Compliant
 */

import { RateLimitConfig } from "./types.ts";

// ============================================================================
// Authentication Configs
// ============================================================================

/** Login de buyer - proteção contra brute force */
export const BUYER_AUTH_LOGIN: RateLimitConfig = {
  action: "buyer_auth_login",
  maxAttempts: 5,
  windowMinutes: 15,
  blockDurationMinutes: 30,
};

/** Registro de buyer - proteção contra spam */
export const BUYER_AUTH_REGISTER: RateLimitConfig = {
  action: "buyer_auth_register",
  maxAttempts: 3,
  windowMinutes: 60,
  blockDurationMinutes: 60,
};

/** Reset de senha - proteção contra abuse */
export const BUYER_AUTH_RESET: RateLimitConfig = {
  action: "buyer_auth_reset",
  maxAttempts: 3,
  windowMinutes: 60,
  blockDurationMinutes: 120,
};

/** Login de produtor - proteção contra brute force */
export const PRODUCER_AUTH_LOGIN: RateLimitConfig = {
  action: "producer_auth_login",
  maxAttempts: 5,
  windowMinutes: 15,
  blockDurationMinutes: 30,
};

// ============================================================================
// Payment Configs
// ============================================================================

/** Criação de orders - proteção contra spam de pedidos */
export const CREATE_ORDER: RateLimitConfig = {
  action: "create_order",
  maxAttempts: 10,
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

/** Criação de pagamento PIX */
export const CREATE_PIX: RateLimitConfig = {
  action: "create_pix",
  maxAttempts: 10,
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

/** Criação de pagamento ASAAS */
export const ASAAS_CREATE_PAYMENT: RateLimitConfig = {
  action: "asaas_create_payment",
  maxAttempts: 10,
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

/** Criação de pagamento MercadoPago */
export const MERCADOPAGO_CREATE_PAYMENT: RateLimitConfig = {
  action: "mercadopago_create_payment",
  maxAttempts: 10,
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

/** Criação de pagamento Stripe */
export const STRIPE_CREATE_PAYMENT: RateLimitConfig = {
  action: "stripe_create_payment",
  maxAttempts: 10,
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

// ============================================================================
// Webhook Configs
// ============================================================================

/** Webhooks de gateways - alta frequência permitida */
export const WEBHOOK: RateLimitConfig = {
  action: "webhook",
  maxAttempts: 100,
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

/** Teste de webhook - limite moderado */
export const WEBHOOK_TEST: RateLimitConfig = {
  action: "webhook_test",
  maxAttempts: 10,
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

// ============================================================================
// Members Area Configs
// ============================================================================

/** Leitura da área de membros - alta frequência permitida */
export const MEMBERS_AREA: RateLimitConfig = {
  action: "members_area",
  maxAttempts: 60,
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

/** Escrita na área de membros - limite moderado */
export const MEMBERS_AREA_WRITE: RateLimitConfig = {
  action: "members_area_write",
  maxAttempts: 30,
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

// ============================================================================
// Security Configs
// ============================================================================

/** Verificação Turnstile - limite moderado */
export const TURNSTILE_VERIFY: RateLimitConfig = {
  action: "turnstile_verify",
  maxAttempts: 10,
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

/** Decrypt de dados sensíveis - limite estrito */
export const DECRYPT_DATA: RateLimitConfig = {
  action: "decrypt_data",
  maxAttempts: 20,
  windowMinutes: 1,
  blockDurationMinutes: 10,
};

// ============================================================================
// Vault Configs
// ============================================================================

/** Salvar no vault - limite moderado */
export const VAULT_SAVE: RateLimitConfig = {
  action: "vault_save",
  maxAttempts: 20,
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

// ============================================================================
// Admin Configs
// ============================================================================

/** Ações administrativas - limite estrito */
export const ADMIN_ACTION: RateLimitConfig = {
  action: "admin_action",
  maxAttempts: 30,
  windowMinutes: 1,
  blockDurationMinutes: 10,
};

/** Envio de emails - limite estrito */
export const SEND_EMAIL: RateLimitConfig = {
  action: "send_email",
  maxAttempts: 10,
  windowMinutes: 1,
  blockDurationMinutes: 15,
};

// ============================================================================
// Producer Configs
// ============================================================================

/** Ações de produtor genéricas */
export const PRODUCER_ACTION: RateLimitConfig = {
  action: "producer_action",
  maxAttempts: 20,
  windowMinutes: 5,
  blockDurationMinutes: 10,
};

/** Gerenciamento de afiliação */
export const AFFILIATION_MANAGE: RateLimitConfig = {
  action: "affiliation_manage",
  maxAttempts: 20,
  windowMinutes: 5,
  blockDurationMinutes: 10,
};

/** Configurações de produto */
export const PRODUCT_SETTINGS: RateLimitConfig = {
  action: "product_settings",
  maxAttempts: 20,
  windowMinutes: 5,
  blockDurationMinutes: 10,
};

/** Gerenciamento de pixels */
export const PIXEL_MANAGEMENT: RateLimitConfig = {
  action: "pixel_management",
  maxAttempts: 30,
  windowMinutes: 5,
  blockDurationMinutes: 10,
};

// ============================================================================
// CRUD Configs
// ============================================================================

/** CRUD genérico - limite moderado */
export const CRUD_DEFAULT: RateLimitConfig = {
  action: "crud_default",
  maxAttempts: 30,
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

/** GDPR requests - limite estrito */
export const GDPR_REQUEST: RateLimitConfig = {
  action: "gdpr_request",
  maxAttempts: 5,
  windowMinutes: 60,
  blockDurationMinutes: 60,
};

// ============================================================================
// Default Config
// ============================================================================

/** Configuração padrão para ações não especificadas */
export const DEFAULT: RateLimitConfig = {
  action: "default",
  maxAttempts: 30,
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

// ============================================================================
// Config Map (para lookup dinâmico)
// ============================================================================

/**
 * Mapeamento de configurações usando SCREAMING_CASE como chaves.
 * Isso garante consistência com o padrão de acesso usado nos arquivos:
 * RATE_LIMIT_CONFIGS.DECRYPT_DATA ao invés de RATE_LIMIT_CONFIGS.decrypt_data
 */
export const RATE_LIMIT_CONFIGS = {
  // Authentication
  BUYER_AUTH_LOGIN,
  BUYER_AUTH_REGISTER,
  BUYER_AUTH_RESET,
  PRODUCER_AUTH_LOGIN,
  
  // Payments
  CREATE_ORDER,
  CREATE_PIX,
  ASAAS_CREATE_PAYMENT,
  MERCADOPAGO_CREATE_PAYMENT,
  STRIPE_CREATE_PAYMENT,
  
  // Webhooks
  WEBHOOK,
  WEBHOOK_TEST,
  
  // Members Area
  MEMBERS_AREA,
  MEMBERS_AREA_WRITE,
  
  // Security
  TURNSTILE_VERIFY,
  DECRYPT_DATA,
  
  // Vault
  VAULT_SAVE,
  
  // Admin
  ADMIN_ACTION,
  SEND_EMAIL,
  
  // Producer
  PRODUCER_ACTION,
  AFFILIATION_MANAGE,
  PRODUCT_SETTINGS,
  PIXEL_MANAGEMENT,
  
  // CRUD
  CRUD_DEFAULT,
  GDPR_REQUEST,
  
  // Default
  DEFAULT,
} as const;
