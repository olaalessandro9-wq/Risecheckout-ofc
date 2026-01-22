/**
 * Form Data Adapter
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Converte entre FormData (XState) e CheckoutFormData (legacy components).
 * Este é o ÚNICO ponto de tradução entre os dois mundos.
 * 
 * @module checkout-public/adapters
 */

import type { FormData as XStateFormData } from "../machines/checkoutPublicMachine.types";
import type { CheckoutFormData as LegacyFormData } from "@/types/checkout";

/**
 * Converte XState FormData → Legacy CheckoutFormData
 * 
 * IMPORTANTE: O legacy usa AMBOS 'document' e 'cpf'.
 * Este adapter garante que AMBOS os campos estejam preenchidos corretamente.
 * 
 * @param xstate - FormData do XState machine
 * @returns CheckoutFormData compatível com componentes legacy
 */
export function toCheckoutFormData(xstate: XStateFormData): LegacyFormData {
  const cpfValue = xstate.cpf || xstate.document || '';
  
  return {
    name: xstate.name,
    email: xstate.email,
    phone: xstate.phone || '',
    document: cpfValue,  // Legacy components que usam document
    cpf: cpfValue,       // SharedPersonalDataForm usa cpf
  };
}

/**
 * Converte Legacy CheckoutFormData → XState FormData
 * 
 * @param legacy - CheckoutFormData do componente legacy
 * @returns FormData compatível com XState machine
 */
export function fromCheckoutFormData(legacy: LegacyFormData): XStateFormData {
  const cpfValue = legacy.cpf || legacy.document || '';
  
  return {
    name: legacy.name,
    email: legacy.email,
    phone: legacy.phone || '',
    cpf: cpfValue,
    document: cpfValue,
  };
}

/**
 * Verifica se os dados do formulário são equivalentes
 * Útil para evitar re-renders desnecessários
 * 
 * @param a - Primeiro FormData
 * @param b - Segundo FormData
 * @returns true se os dados são equivalentes
 */
export function areFormDataEqual(a: XStateFormData, b: XStateFormData): boolean {
  return (
    a.name === b.name &&
    a.email === b.email &&
    a.phone === b.phone &&
    a.cpf === b.cpf &&
    a.document === b.document
  );
}
