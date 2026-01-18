/**
 * PII Masking Utilities
 * 
 * Masks Personally Identifiable Information for secure logging.
 * Compliant with LGPD (Brazilian General Data Protection Law).
 * 
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - Single Source of Truth
 * @module kernel/security/pii-masking
 */

// ============================================
// EMAIL MASKING
// ============================================

/**
 * Masks an email address for logging purposes.
 * Shows first 2 characters of username + domain.
 * 
 * @param email - Email address to mask
 * @returns Masked email (e.g., "jo***@example.com")
 * 
 * @example
 * maskEmail("john.doe@example.com");
 * // Returns: "jo***@example.com"
 * 
 * maskEmail("a@test.com");
 * // Returns: "***@test.com"
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return "***@***";
  }
  
  if (!email.includes("@")) {
    return "***@***";
  }
  
  const [user, domain] = email.split("@");
  
  if (!user || !domain) {
    return "***@***";
  }
  
  const maskedUser = user.length > 2 
    ? `${user.substring(0, 2)}***` 
    : "***";
  
  return `${maskedUser}@${domain}`;
}

// ============================================
// ID MASKING
// ============================================

/**
 * Masks a UUID or ID for logging purposes.
 * Shows only the first N characters followed by ellipsis.
 * 
 * @param id - ID to mask
 * @param visibleChars - Number of characters to show (default: 8)
 * @returns Masked ID (e.g., "abc12345...")
 * 
 * @example
 * maskId("550e8400-e29b-41d4-a716-446655440000");
 * // Returns: "550e8400..."
 */
export function maskId(id: string, visibleChars: number = 8): string {
  if (!id || typeof id !== "string") {
    return "***";
  }
  
  if (id.length <= visibleChars) {
    return "***";
  }
  
  return `${id.substring(0, visibleChars)}...`;
}

// ============================================
// DOCUMENT MASKING (CPF/CNPJ)
// ============================================

/**
 * Masks a Brazilian CPF (Individual Taxpayer ID).
 * Shows only first 3 and last 2 digits.
 * 
 * @param cpf - CPF to mask (with or without formatting)
 * @returns Masked CPF (e.g., "123.***.***-45")
 * 
 * @example
 * maskCpf("12345678901");
 * // Returns: "123.***.***-01"
 * 
 * maskCpf("123.456.789-01");
 * // Returns: "123.***.***-01"
 */
export function maskCpf(cpf: string): string {
  if (!cpf || typeof cpf !== "string") {
    return "***.***.***-**";
  }
  
  // Remove all non-numeric characters
  const cleanCpf = cpf.replace(/\D/g, "");
  
  if (cleanCpf.length !== 11) {
    return "***.***.***-**";
  }
  
  return `${cleanCpf.substring(0, 3)}.***.***-${cleanCpf.slice(-2)}`;
}

/**
 * Masks a Brazilian CNPJ (Business Taxpayer ID).
 * Shows only first 2 and last 2 digits.
 * 
 * @param cnpj - CNPJ to mask (with or without formatting)
 * @returns Masked CNPJ (e.g., "12.***.***/****-34")
 * 
 * @example
 * maskCnpj("12345678000190");
 * // Returns: "12.***.***/****-90"
 */
export function maskCnpj(cnpj: string): string {
  if (!cnpj || typeof cnpj !== "string") {
    return "**.***.****/****-**";
  }
  
  // Remove all non-numeric characters
  const cleanCnpj = cnpj.replace(/\D/g, "");
  
  if (cleanCnpj.length !== 14) {
    return "**.***.****/****-**";
  }
  
  return `${cleanCnpj.substring(0, 2)}.***.***/****-${cleanCnpj.slice(-2)}`;
}

// ============================================
// PHONE MASKING
// ============================================

/**
 * Masks a phone number for logging purposes.
 * Shows only the last 4 digits.
 * 
 * @param phone - Phone number to mask
 * @returns Masked phone (e.g., "****-1234")
 * 
 * @example
 * maskPhone("11987654321");
 * // Returns: "****-4321"
 */
export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== "string") {
    return "****-****";
  }
  
  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/\D/g, "");
  
  if (cleanPhone.length < 4) {
    return "****-****";
  }
  
  return `****-${cleanPhone.slice(-4)}`;
}

// ============================================
// NAME MASKING
// ============================================

/**
 * Masks a person's name for logging purposes.
 * Shows first name initial + last name initial.
 * 
 * @param name - Full name to mask
 * @returns Masked name (e.g., "J*** D***")
 * 
 * @example
 * maskName("John Doe");
 * // Returns: "J*** D***"
 */
export function maskName(name: string): string {
  if (!name || typeof name !== "string") {
    return "***";
  }
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 0) {
    return "***";
  }
  
  return parts
    .map((part) => (part.length > 0 ? `${part.charAt(0)}***` : "***"))
    .join(" ");
}

// ============================================
// CREDIT CARD MASKING
// ============================================

/**
 * Masks a credit card number.
 * Shows only the last 4 digits.
 * 
 * @param cardNumber - Card number to mask
 * @returns Masked card (e.g., "**** **** **** 1234")
 * 
 * @example
 * maskCardNumber("4111111111111111");
 * // Returns: "**** **** **** 1111"
 */
export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber || typeof cardNumber !== "string") {
    return "**** **** **** ****";
  }
  
  // Remove all non-numeric characters
  const cleanCard = cardNumber.replace(/\D/g, "");
  
  if (cleanCard.length < 4) {
    return "**** **** **** ****";
  }
  
  return `**** **** **** ${cleanCard.slice(-4)}`;
}
