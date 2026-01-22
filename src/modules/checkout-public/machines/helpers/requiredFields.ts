/**
 * Required Fields Helper
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Normalizes required_fields verification to support both formats:
 * - Array: ['cpf', 'phone']
 * - Object: { cpf: true, phone: true }
 * 
 * @module checkout-public/machines/helpers
 */

import type { RequiredFieldsConfig } from "../../mappers";

/**
 * Checks if a specific field is required based on the product configuration.
 * Supports both array and object formats for backward compatibility.
 */
export function isFieldRequired(
  requiredFields: RequiredFieldsConfig | string[] | undefined | null,
  field: keyof RequiredFieldsConfig
): boolean {
  if (!requiredFields) return false;
  
  if (Array.isArray(requiredFields)) {
    return requiredFields.includes(field);
  }
  
  return requiredFields[field] === true;
}
