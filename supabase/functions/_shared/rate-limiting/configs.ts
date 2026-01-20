/**
 * Rate Limiting Configurations
 * 
 * Configurações centralizadas para todas as ações de rate limiting.
 * Cada domínio tem sua própria configuração otimizada.
 * 
 * Benchmarks baseados em análise da indústria (Stripe, Auth0, Cloudflare):
 * - Stripe: 100 req/s (6000/min) para pagamentos
 * - Auth0: 30 tentativas/min para login
 * - Cloudflare: 10.000+ req/min para webhooks
 * 
 * @version 2.0.0 - RISE V3 Compliant (Otimizado via Análise Manus AI)
 * @see docs/RATE_LIMIT_ANALYSIS.md
 */

import { RateLimitConfig } from "./types.ts";

// ============================================================================
// Authentication Configs
// ============================================================================

/** Login de buyer - proteção contra brute force (2x aumento) */
export const BUYER_AUTH_LOGIN: RateLimitConfig = {
  action: "buyer_auth_login",
  maxAttempts: 10,       // Era: 5
  windowMinutes: 15,
  blockDurationMinutes: 30,
};

/** Registro de buyer - proteção contra spam (67% aumento) */
export const BUYER_AUTH_REGISTER: RateLimitConfig = {
  action: "buyer_auth_register",
  maxAttempts: 5,        // Era: 3
  windowMinutes: 60,
  blockDurationMinutes: 60,
};

/** Reset de senha - proteção contra abuse (67% aumento) */
export const BUYER_AUTH_RESET: RateLimitConfig = {
  action: "buyer_auth_reset",
  maxAttempts: 5,        // Era: 3
  windowMinutes: 60,
  blockDurationMinutes: 120,
};

/** Login de produtor - proteção contra brute force (3x aumento) */
export const PRODUCER_AUTH_LOGIN: RateLimitConfig = {
  action: "producer_auth_login",
  maxAttempts: 15,       // Era: 5
  windowMinutes: 15,
  blockDurationMinutes: 30,
};

// ============================================================================
// Payment Configs (CRÍTICO - 6x aumento baseado em benchmarks Stripe)
// ============================================================================

/** Criação de orders - suporta picos de vendas (Black Friday, lançamentos) */
export const CREATE_ORDER: RateLimitConfig = {
  action: "create_order",
  maxAttempts: 60,       // Era: 10 (6x aumento)
  windowMinutes: 1,
  blockDurationMinutes: 2, // Era: 5 (reduzido para não perder vendas)
};

/** Criação de pagamento PIX */
export const CREATE_PIX: RateLimitConfig = {
  action: "create_pix",
  maxAttempts: 60,       // Era: 10 (6x aumento)
  windowMinutes: 1,
  blockDurationMinutes: 2, // Era: 5
};

/** Criação de pagamento ASAAS */
export const ASAAS_CREATE_PAYMENT: RateLimitConfig = {
  action: "asaas_create_payment",
  maxAttempts: 60,       // Era: 10 (6x aumento)
  windowMinutes: 1,
  blockDurationMinutes: 2, // Era: 5
};

/** Criação de pagamento MercadoPago */
export const MERCADOPAGO_CREATE_PAYMENT: RateLimitConfig = {
  action: "mercadopago_create_payment",
  maxAttempts: 60,       // Era: 10 (6x aumento)
  windowMinutes: 1,
  blockDurationMinutes: 2, // Era: 5
};

/** Criação de pagamento Stripe */
export const STRIPE_CREATE_PAYMENT: RateLimitConfig = {
  action: "stripe_create_payment",
  maxAttempts: 60,       // Era: 10 (6x aumento)
  windowMinutes: 1,
  blockDurationMinutes: 2, // Era: 5
};

// ============================================================================
// Webhook Configs (3x aumento - gateways enviam múltiplos eventos)
// ============================================================================

/** Webhooks de gateways - alta frequência permitida */
export const WEBHOOK: RateLimitConfig = {
  action: "webhook",
  maxAttempts: 300,      // Era: 100 (3x aumento)
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

/** Teste de webhook - limite moderado */
export const WEBHOOK_TEST: RateLimitConfig = {
  action: "webhook_test",
  maxAttempts: 30,       // Era: 10 (3x aumento)
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

// ============================================================================
// Members Area Configs (2x aumento - navegação normal requer muitas requests)
// ============================================================================

/** Leitura da área de membros - alta frequência permitida */
export const MEMBERS_AREA: RateLimitConfig = {
  action: "members_area",
  maxAttempts: 120,      // Era: 60 (2x aumento)
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

/** Escrita na área de membros - limite moderado */
export const MEMBERS_AREA_WRITE: RateLimitConfig = {
  action: "members_area_write",
  maxAttempts: 60,       // Era: 30 (2x aumento)
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

// ============================================================================
// Security Configs (ajustes moderados)
// ============================================================================

/** Verificação Turnstile - limite aumentado para UX */
export const TURNSTILE_VERIFY: RateLimitConfig = {
  action: "turnstile_verify",
  maxAttempts: 30,       // Era: 10 (3x aumento)
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

/** Decrypt de dados sensíveis - limite moderado */
export const DECRYPT_DATA: RateLimitConfig = {
  action: "decrypt_data",
  maxAttempts: 40,       // Era: 20 (2x aumento)
  windowMinutes: 1,
  blockDurationMinutes: 10,
};

// ============================================================================
// Vault Configs
// ============================================================================

/** Salvar no vault - limite moderado */
export const VAULT_SAVE: RateLimitConfig = {
  action: "vault_save",
  maxAttempts: 40,       // Era: 20 (2x aumento)
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

// ============================================================================
// Admin Configs (2x aumento)
// ============================================================================

/** Ações administrativas - limite moderado */
export const ADMIN_ACTION: RateLimitConfig = {
  action: "admin_action",
  maxAttempts: 60,       // Era: 30 (2x aumento)
  windowMinutes: 1,
  blockDurationMinutes: 10,
};

/** Envio de emails - limite moderado */
export const SEND_EMAIL: RateLimitConfig = {
  action: "send_email",
  maxAttempts: 20,       // Era: 10 (2x aumento)
  windowMinutes: 1,
  blockDurationMinutes: 15,
};

// ============================================================================
// Producer Configs (3x aumento - produtores precisam trabalhar sem bloqueios)
// ============================================================================

/** Ações de produtor genéricas */
export const PRODUCER_ACTION: RateLimitConfig = {
  action: "producer_action",
  maxAttempts: 60,       // Era: 20 (3x aumento)
  windowMinutes: 5,
  blockDurationMinutes: 10,
};

/** Gerenciamento de afiliação */
export const AFFILIATION_MANAGE: RateLimitConfig = {
  action: "affiliation_manage",
  maxAttempts: 60,       // Era: 20 (3x aumento)
  windowMinutes: 5,
  blockDurationMinutes: 10,
};

/** Configurações de produto */
export const PRODUCT_SETTINGS: RateLimitConfig = {
  action: "product_settings",
  maxAttempts: 60,       // Era: 20 (3x aumento)
  windowMinutes: 5,
  blockDurationMinutes: 10,
};

/** Gerenciamento de pixels */
export const PIXEL_MANAGEMENT: RateLimitConfig = {
  action: "pixel_management",
  maxAttempts: 60,       // Era: 30 (2x aumento)
  windowMinutes: 5,
  blockDurationMinutes: 10,
};

// ============================================================================
// CRUD Configs (2x aumento)
// ============================================================================

/** CRUD genérico - limite moderado */
export const CRUD_DEFAULT: RateLimitConfig = {
  action: "crud_default",
  maxAttempts: 60,       // Era: 30 (2x aumento)
  windowMinutes: 1,
  blockDurationMinutes: 5,
};

/** GDPR requests - limite estrito (mantido - operação sensível) */
export const GDPR_REQUEST: RateLimitConfig = {
  action: "gdpr_request",
  maxAttempts: 5,        // Mantido
  windowMinutes: 60,
  blockDurationMinutes: 60,
};

/** GDPR forget (anonimização) - limite muito restritivo */
export const GDPR_FORGET: RateLimitConfig = {
  action: "gdpr_forget",
  maxAttempts: 5,
  windowMinutes: 60,
  blockDurationMinutes: 120,
};

/** Producer Password Reset - recuperação de senha de produtor */
export const PRODUCER_AUTH_RESET: RateLimitConfig = {
  action: "producer_password_reset",
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
  maxAttempts: 60,       // Era: 30 (2x aumento)
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
  PRODUCER_AUTH_RESET,
  
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
  
  // GDPR
  GDPR_REQUEST,
  GDPR_FORGET,
  
  // Default
  DEFAULT,
} as const;
