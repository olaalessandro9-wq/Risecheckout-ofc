/**
 * Form Snapshot Utility
 * 
 * Lê dados pessoais diretamente do DOM para resolver o problema de autofill.
 * Quando o navegador preenche campos automaticamente, nem sempre dispara eventos
 * onChange/onInput, deixando o estado React desatualizado.
 * 
 * Esta função lê os valores diretamente do DOM e mescla com o estado React,
 * garantindo que a validação e o pagamento usem dados corretos.
 * 
 * Segue RISE ARCHITECT PROTOCOL:
 * - Resolve causa raiz (não apenas sintoma)
 * - Responsabilidade única (leitura do DOM)
 */

import type { PersonalData } from '../types';
import { maskPersonalField } from './masks';

// ============================================================================
// DOM SNAPSHOT
// ============================================================================

/**
 * Lê dados pessoais diretamente de um formulário HTML.
 * 
 * @param form - Referência para o elemento form
 * @returns PersonalData com valores do DOM
 */
export function readPersonalDataFromForm(form: HTMLFormElement): PersonalData {
  const formDataObj = new FormData(form);
  
  return {
    name: (formDataObj.get('name') as string) || '',
    email: (formDataObj.get('email') as string) || '',
    cpf: (formDataObj.get('cpf') as string) || '',
    phone: (formDataObj.get('phone') as string) || '',
  };
}

/**
 * Lê um campo específico por query selector.
 * Fallback se o FormData não funcionar.
 */
export function readFieldFromDOM(fieldName: string): string {
  const input = document.querySelector(`input[name="${fieldName}"]`) as HTMLInputElement | null;
  return input?.value || '';
}

/**
 * Lê todos os campos pessoais do DOM usando query selectors.
 */
export function readAllFieldsFromDOM(): PersonalData {
  return {
    name: readFieldFromDOM('name'),
    email: readFieldFromDOM('email'),
    cpf: readFieldFromDOM('cpf'),
    phone: readFieldFromDOM('phone'),
  };
}

// ============================================================================
// MERGE SNAPSHOT
// ============================================================================

/**
 * Mescla dados do estado React com snapshot do DOM.
 * Prioriza valores do DOM quando o estado está vazio mas o DOM tem valor.
 * 
 * @param stateData - Dados do estado React (useFormManager)
 * @param domData - Dados lidos do DOM
 * @returns PersonalData mesclado
 */
export function mergeWithDOMSnapshot(
  stateData: Partial<PersonalData>,
  domData: PersonalData
): PersonalData {
  return {
    name: (stateData.name?.trim() || domData.name?.trim()) || '',
    email: (stateData.email?.trim() || domData.email?.trim()) || '',
    cpf: (stateData.cpf?.trim() || domData.cpf?.trim()) || '',
    phone: (stateData.phone?.trim() || domData.phone?.trim()) || '',
  };
}

/**
 * Aplica máscaras nos dados mesclados.
 */
export function normalizePersonalData(data: PersonalData): PersonalData {
  return {
    name: maskPersonalField('name', data.name),
    email: data.email.trim(),
    cpf: maskPersonalField('cpf', data.cpf),
    phone: maskPersonalField('phone', data.phone),
  };
}

/**
 * Lê, mescla e normaliza dados pessoais.
 * Use esta função no submit para garantir dados corretos mesmo com autofill.
 * 
 * @param form - Referência para o formulário (ou null para usar fallback)
 * @param stateData - Dados do estado React
 * @returns PersonalData final, pronto para validação e pagamento
 */
export function getSubmitSnapshot(
  form: HTMLFormElement | null,
  stateData: Partial<PersonalData>
): PersonalData {
  // Lê do DOM
  const domData = form 
    ? readPersonalDataFromForm(form)
    : readAllFieldsFromDOM();
  
  // Mescla priorizando valores preenchidos
  const merged = mergeWithDOMSnapshot(stateData, domData);
  
  // Normaliza (aplica máscaras)
  return normalizePersonalData(merged);
}
