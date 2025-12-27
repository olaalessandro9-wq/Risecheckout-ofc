/**
 * Personal Data Masks
 * 
 * Single Source of Truth para máscaras de dados pessoais.
 * Usa as funções de máscara existentes em @/lib/validation.
 * 
 * Segue RISE ARCHITECT PROTOCOL: 
 * - Responsabilidade única (mascaramento)
 * - Funções puras
 */

import {
  maskName,
  maskDocument,
  maskPhone,
} from '@/lib/validation';
import type { PersonalDataField } from '../types';

// ============================================================================
// MASK APPLICATION
// ============================================================================

/**
 * Aplica a máscara apropriada para um campo de dados pessoais.
 * 
 * @param field - Nome do campo
 * @param value - Valor bruto
 * @returns Valor com máscara aplicada
 */
export function maskPersonalField(field: PersonalDataField, value: string): string {
  switch (field) {
    case 'name':
      return maskName(value);
    
    case 'cpf':
      return maskDocument(value);
    
    case 'phone':
      return maskPhone(value);
    
    case 'email':
      // Email não tem máscara, apenas retorna o valor
      return value;
    
    default:
      return value;
  }
}

/**
 * Retorna o maxLength apropriado para cada campo.
 */
export function getFieldMaxLength(field: PersonalDataField): number | undefined {
  switch (field) {
    case 'cpf':
      return 18; // 00.000.000/0000-00 (CNPJ é o maior)
    case 'phone':
      return 15; // (00) 00000-0000
    default:
      return undefined;
  }
}

/**
 * Retorna o placeholder para cada campo.
 */
export function getFieldPlaceholder(field: PersonalDataField): string {
  switch (field) {
    case 'name':
      return 'Digite seu nome completo';
    case 'email':
      return 'Digite seu email';
    case 'cpf':
      return '000.000.000-00 ou 00.000.000/0000-00';
    case 'phone':
      return '(00) 00000-0000';
    default:
      return '';
  }
}

/**
 * Retorna o label para cada campo.
 */
export function getFieldLabel(field: PersonalDataField): string {
  switch (field) {
    case 'name':
      return 'Nome completo';
    case 'email':
      return 'Email';
    case 'cpf':
      return 'CPF/CNPJ';
    case 'phone':
      return 'Celular';
    default:
      return '';
  }
}

/**
 * Retorna o tipo de input HTML para cada campo.
 */
export function getFieldInputType(field: PersonalDataField): string {
  switch (field) {
    case 'email':
      return 'email';
    case 'phone':
      return 'tel';
    default:
      return 'text';
  }
}

/**
 * Retorna o valor de autocomplete para cada campo.
 */
export function getFieldAutocomplete(field: PersonalDataField): string {
  switch (field) {
    case 'name':
      return 'name';
    case 'email':
      return 'email';
    case 'phone':
      return 'tel';
    case 'cpf':
      return 'off'; // CPF não deve usar autocomplete
    default:
      return 'off';
  }
}
