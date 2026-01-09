/**
 * Input Sanitizer para Edge Functions
 * 
 * Fornece funções de sanitização para prevenir XSS, SQL Injection e outros ataques.
 * 
 * VULN-006: Backend sanitization para inputs críticos
 * 
 * @version 1.0.0
 */

/**
 * Remove caracteres perigosos de strings
 * Previne XSS e injection attacks
 */
export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== "string") {
    return "";
  }
  
  return input
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove tags HTML/Script
    .replace(/<[^>]*>/g, "")
    // Escapa caracteres especiais HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    // Remove caracteres de controle (exceto newline, tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Trim e limita tamanho
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitiza e valida email
 * Remove espaços e converte para lowercase
 */
export function sanitizeEmail(input: unknown): string {
  if (typeof input !== "string") {
    return "";
  }
  
  return input
    .toLowerCase()
    .trim()
    // Remove caracteres não permitidos em email
    .replace(/[^\w.@+-]/g, "")
    .slice(0, 255);
}

/**
 * Sanitiza CPF/CNPJ - mantém apenas dígitos
 */
export function sanitizeCPF(input: unknown): string {
  if (typeof input !== "string") {
    return "";
  }
  
  // Remove tudo que não é dígito
  const digits = input.replace(/\D/g, "");
  
  // CPF tem 11 dígitos, CNPJ tem 14
  if (digits.length === 11 || digits.length === 14) {
    return digits;
  }
  
  // Retorna os primeiros 14 dígitos se for maior
  return digits.slice(0, 14);
}

/**
 * Sanitiza telefone - mantém apenas dígitos
 */
export function sanitizePhone(input: unknown): string {
  if (typeof input !== "string") {
    return "";
  }
  
  // Remove tudo que não é dígito
  const digits = input.replace(/\D/g, "");
  
  // Telefone brasileiro: 10-11 dígitos (com DDD)
  return digits.slice(0, 15);
}

/**
 * Sanitiza nome - permite apenas letras, espaços e alguns caracteres especiais
 */
export function sanitizeName(input: unknown, maxLength = 255): string {
  if (typeof input !== "string") {
    return "";
  }
  
  return input
    // Remove tags HTML
    .replace(/<[^>]*>/g, "")
    // Permite apenas letras (incluindo acentos), espaços, hífens e apóstrofos
    .replace(/[^\p{L}\p{M}\s'-]/gu, "")
    // Remove múltiplos espaços
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitiza UUID - garante formato válido
 */
export function sanitizeUUID(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }
  
  // Remove espaços
  const cleaned = input.trim().toLowerCase();
  
  // Valida formato UUID v4
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  
  if (!uuidRegex.test(cleaned)) {
    return null;
  }
  
  return cleaned;
}

/**
 * Sanitiza URL - valida e limpa URL
 */
export function sanitizeURL(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }
  
  try {
    const url = new URL(input.trim());
    
    // Apenas permite http/https
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }
    
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Sanitiza número inteiro
 */
export function sanitizeInteger(input: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number | null {
  if (typeof input === "number") {
    if (!Number.isInteger(input)) {
      return null;
    }
    return Math.max(min, Math.min(max, input));
  }
  
  if (typeof input === "string") {
    const parsed = parseInt(input, 10);
    if (isNaN(parsed)) {
      return null;
    }
    return Math.max(min, Math.min(max, parsed));
  }
  
  return null;
}

/**
 * Sanitiza valor monetário em centavos
 */
export function sanitizeAmountCents(input: unknown): number | null {
  const amount = sanitizeInteger(input, 1, 999999999); // Max ~R$10M
  return amount;
}

/**
 * Interface para inputs de criação de pedido sanitizados
 */
export interface SanitizedOrderInput {
  product_id: string;
  offer_id?: string;
  checkout_id?: string;
  customer_name: string;
  customer_email: string;
  customer_cpf: string;
  customer_phone: string;
  amount_cents: number;
  payment_method?: string;
  affiliate_id?: string;
  coupon_code?: string;
  bump_ids?: string[];
}

/**
 * Sanitiza todos os campos de um pedido
 */
export function sanitizeOrderInput(input: Record<string, unknown>): SanitizedOrderInput | null {
  const product_id = sanitizeUUID(input.product_id);
  const customer_email = sanitizeEmail(input.customer_email);
  const customer_name = sanitizeName(input.customer_name);
  const customer_cpf = sanitizeCPF(input.customer_cpf);
  const customer_phone = sanitizePhone(input.customer_phone);
  const amount_cents = sanitizeAmountCents(input.amount_cents);
  
  // Campos obrigatórios
  if (!product_id || !customer_email || !customer_name || !customer_cpf || !amount_cents) {
    return null;
  }
  
  const result: SanitizedOrderInput = {
    product_id,
    customer_name,
    customer_email,
    customer_cpf,
    customer_phone,
    amount_cents,
  };
  
  // Campos opcionais
  if (input.offer_id) {
    const offer_id = sanitizeUUID(input.offer_id);
    if (offer_id) result.offer_id = offer_id;
  }
  
  if (input.checkout_id) {
    const checkout_id = sanitizeUUID(input.checkout_id);
    if (checkout_id) result.checkout_id = checkout_id;
  }
  
  if (input.affiliate_id) {
    const affiliate_id = sanitizeUUID(input.affiliate_id);
    if (affiliate_id) result.affiliate_id = affiliate_id;
  }
  
  if (input.payment_method) {
    const payment_method = sanitizeString(input.payment_method, 50);
    if (["pix", "credit_card", "boleto"].includes(payment_method.toLowerCase())) {
      result.payment_method = payment_method.toLowerCase();
    }
  }
  
  if (input.coupon_code) {
    const coupon_code = sanitizeString(input.coupon_code, 50)
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "");
    if (coupon_code) result.coupon_code = coupon_code;
  }
  
  if (Array.isArray(input.bump_ids)) {
    result.bump_ids = input.bump_ids
      .map((id) => sanitizeUUID(id))
      .filter((id): id is string => id !== null);
  }
  
  return result;
}

/**
 * Interface para inputs de autenticação sanitizados
 */
export interface SanitizedAuthInput {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

/**
 * Sanitiza inputs de autenticação
 */
export function sanitizeAuthInput(input: Record<string, unknown>): SanitizedAuthInput | null {
  const email = sanitizeEmail(input.email);
  
  // Password não deve ser sanitizado (pode conter caracteres especiais)
  // mas deve ser validado como string
  if (typeof input.password !== "string" || input.password.length < 1) {
    return null;
  }
  
  if (!email) {
    return null;
  }
  
  const result: SanitizedAuthInput = {
    email,
    password: input.password, // Mantém original
  };
  
  if (input.name) {
    result.name = sanitizeName(input.name);
  }
  
  if (input.phone) {
    result.phone = sanitizePhone(input.phone);
  }
  
  return result;
}
