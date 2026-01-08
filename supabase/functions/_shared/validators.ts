/**
 * Input Validators for Edge Functions
 * 
 * Provides Zod schemas and validation utilities for secure input handling.
 * 
 * @version 1.0.0
 */

// Zod-like validation without external dependency (Deno compatible)
// Using native validation for better performance in Edge Functions

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validates UUID format
 */
export function isValidUUID(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validates email format
 */
export function isValidEmail(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) && value.length <= 255;
}

/**
 * Validates CPF format (11 digits, optionally formatted)
 */
export function isValidCPF(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const digits = value.replace(/\D/g, "");
  return digits.length === 11;
}

/**
 * Validates phone format (10-11 digits for Brazilian phones)
 */
export function isValidPhone(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11;
}

/**
 * Validates string with min/max length
 */
export function isValidString(value: unknown, minLength = 1, maxLength = 255): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}

/**
 * Validates array of UUIDs
 */
export function isValidUUIDArray(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.every(isValidUUID);
}

// ============================================
// CREATE ORDER SCHEMA
// ============================================

export interface CreateOrderInput {
  product_id: string;
  offer_id?: string;
  checkout_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_cpf?: string;
  order_bump_ids?: string[];
  gateway: string;
  payment_method: string;
  coupon_id?: string;
  affiliate_code?: string;
}

export function validateCreateOrderInput(data: unknown): ValidationResult<CreateOrderInput> {
  const errors: string[] = [];
  
  if (!data || typeof data !== "object") {
    return { success: false, errors: ["Payload inválido"] };
  }
  
  const input = data as Record<string, unknown>;
  
  // Required fields
  if (!isValidUUID(input.product_id)) {
    errors.push("product_id deve ser um UUID válido");
  }
  
  if (!isValidString(input.customer_name, 2, 255)) {
    errors.push("customer_name deve ter entre 2 e 255 caracteres");
  }
  
  if (!isValidEmail(input.customer_email)) {
    errors.push("customer_email deve ser um email válido");
  }
  
  if (!isValidString(input.gateway, 1, 50)) {
    errors.push("gateway é obrigatório");
  }
  
  if (!isValidString(input.payment_method, 1, 50)) {
    errors.push("payment_method é obrigatório");
  }
  
  // Optional fields with validation
  if (input.offer_id !== undefined && input.offer_id !== null && !isValidUUID(input.offer_id)) {
    errors.push("offer_id deve ser um UUID válido");
  }
  
  if (input.checkout_id !== undefined && input.checkout_id !== null && !isValidUUID(input.checkout_id)) {
    errors.push("checkout_id deve ser um UUID válido");
  }
  
  if (input.customer_phone !== undefined && input.customer_phone !== null && input.customer_phone !== "") {
    if (!isValidPhone(input.customer_phone)) {
      errors.push("customer_phone deve ter 10-11 dígitos");
    }
  }
  
  if (input.customer_cpf !== undefined && input.customer_cpf !== null && input.customer_cpf !== "") {
    if (!isValidCPF(input.customer_cpf)) {
      errors.push("customer_cpf deve ter 11 dígitos");
    }
  }
  
  if (input.order_bump_ids !== undefined && input.order_bump_ids !== null) {
    if (!isValidUUIDArray(input.order_bump_ids)) {
      errors.push("order_bump_ids deve ser um array de UUIDs válidos");
    }
  }
  
  if (input.coupon_id !== undefined && input.coupon_id !== null && input.coupon_id !== "") {
    if (!isValidUUID(input.coupon_id)) {
      errors.push("coupon_id deve ser um UUID válido");
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return {
    success: true,
    data: {
      product_id: input.product_id as string,
      offer_id: input.offer_id as string | undefined,
      checkout_id: input.checkout_id as string | undefined,
      customer_name: (input.customer_name as string).trim(),
      customer_email: (input.customer_email as string).toLowerCase().trim(),
      customer_phone: input.customer_phone as string | undefined,
      customer_cpf: input.customer_cpf as string | undefined,
      order_bump_ids: input.order_bump_ids as string[] | undefined,
      gateway: input.gateway as string,
      payment_method: input.payment_method as string,
      coupon_id: input.coupon_id as string | undefined,
      affiliate_code: input.affiliate_code as string | undefined,
    }
  };
}

// ============================================
// BUYER AUTH SCHEMA
// ============================================

export interface BuyerAuthInput {
  email: string;
  password?: string;
  name?: string;
  phone?: string;
}

export function validateBuyerAuthInput(data: unknown, requirePassword = true): ValidationResult<BuyerAuthInput> {
  const errors: string[] = [];
  
  if (!data || typeof data !== "object") {
    return { success: false, errors: ["Payload inválido"] };
  }
  
  const input = data as Record<string, unknown>;
  
  if (!isValidEmail(input.email)) {
    errors.push("Email inválido");
  }
  
  if (requirePassword) {
    if (typeof input.password !== "string" || input.password.length < 6) {
      errors.push("Senha deve ter no mínimo 6 caracteres");
    }
  }
  
  if (input.name !== undefined && input.name !== null) {
    if (!isValidString(input.name, 2, 255)) {
      errors.push("Nome deve ter entre 2 e 255 caracteres");
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return {
    success: true,
    data: {
      email: (input.email as string).toLowerCase().trim(),
      password: input.password as string | undefined,
      name: input.name as string | undefined,
      phone: input.phone as string | undefined,
    }
  };
}

/**
 * Validates password strength
 * Requirements: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Senha deve ter no mínimo 8 caracteres" };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Senha deve conter pelo menos uma letra maiúscula" };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Senha deve conter pelo menos uma letra minúscula" };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Senha deve conter pelo menos um número" };
  }
  
  return { valid: true };
}

/**
 * Creates validation error response
 */
export function createValidationErrorResponse(
  errors: string[], 
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: "Validation failed",
      details: errors 
    }),
    { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}
