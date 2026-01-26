/**
 * Form Data Adapter
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Converte entre FormData (XState) e CheckoutFormData (public API components).
 * Este é o ÚNICO ponto de tradução entre os dois mundos.
 * 
 * @module checkout-public/adapters
 */

import type { FormData as XStateFormData } from "../machines/checkoutPublicMachine.types";
import type { CheckoutFormData as PublicFormData } from "@/types/checkout";

/**
 * Converte XState FormData → Public API CheckoutFormData
 * 
 * IMPORTANTE: A public API usa AMBOS 'document' e 'cpf'.
 * Este adapter garante que AMBOS os campos estejam preenchidos corretamente.
 * 
 * @param xstate - FormData do XState machine
 * @returns CheckoutFormData compatível com componentes de public API
 */
export function toCheckoutFormData(xstate: XStateFormData): PublicFormData {
  const cpfValue = xstate.cpf || xstate.document || '';
  
  return {
    name: xstate.name,
    email: xstate.email,
    phone: xstate.phone || '',
    document: cpfValue,  // Componentes que usam document
    cpf: cpfValue,       // SharedPersonalDataForm usa cpf
  };
}

/**
 * Converte Public API CheckoutFormData → XState FormData
 * 
 * @param publicData - CheckoutFormData do componente public API
 * @returns FormData compatível com XState machine
 */
export function fromCheckoutFormData(publicData: PublicFormData): XStateFormData {
  const cpfValue = publicData.cpf || publicData.document || '';
  
  return {
    name: publicData.name,
    email: publicData.email,
    phone: publicData.phone || '',
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
