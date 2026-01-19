/**
 * Asaas Customer Service
 * 
 * Módulo ÚNICO responsável por buscar ou criar clientes no Asaas.
 * FONTE DA VERDADE para gerenciamento de customers Asaas.
 * 
 * Usado por:
 * - asaas-create-payment (Edge Function direta)
 * - AsaasAdapter (via PaymentFactory)
 * 
 * @module _shared/asaas-customer
 * @version 2.0.0 - Unificado para RISE Protocol V2
 */

import { createLogger } from "./logger.ts";

const log = createLogger("AsaasCustomer");

// ============================================
// TYPES
// ============================================

export interface CustomerData {
  name: string;
  email: string;
  document?: string;
  phone?: string;
}

export interface AsaasCustomer {
  id: string;
  name?: string;
  email?: string;
  cpfCnpj?: string;
  phone?: string;
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Busca cliente existente por CPF/CNPJ ou cria um novo.
 * 
 * Suporta duas formas de autenticação:
 * - String (apiKey): Headers serão construídos internamente
 * - HeadersInit: Headers pré-construídos
 * 
 * @param baseUrl - URL base da API Asaas (sandbox ou produção)
 * @param auth - Token de acesso da API Asaas OU headers pré-construídos
 * @param customer - Dados do cliente
 * @returns Customer ou null em caso de erro
 */
export async function findOrCreateCustomer(
  baseUrl: string, 
  auth: string | HeadersInit, 
  customer: CustomerData
): Promise<AsaasCustomer | null> {
  // Normalizar headers
  const headers: HeadersInit = typeof auth === 'string'
    ? { 'Content-Type': 'application/json', 'access_token': auth }
    : auth;
  
  const document = customer.document?.replace(/\D/g, '') || '';

  // 1. Tentar buscar por CPF/CNPJ
  if (document) {
    const existing = await findCustomerByDocument(baseUrl, headers, document);
    if (existing) {
      log.info(`Customer found: ${existing.id}`);
      return existing;
    }
  }

  // 2. Criar novo customer
  return await createCustomer(baseUrl, headers, customer);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Busca customer por CPF/CNPJ
 */
async function findCustomerByDocument(
  baseUrl: string,
  headers: HeadersInit,
  document: string
): Promise<AsaasCustomer | null> {
  try {
    const response = await fetch(`${baseUrl}/customers?cpfCnpj=${document}`, { headers });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.data?.[0] || null;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Error fetching customer:", errorMessage);
    return null;
  }
}

/**
 * Cria novo customer na Asaas
 */
async function createCustomer(
  baseUrl: string,
  headers: HeadersInit,
  customerData: CustomerData
): Promise<AsaasCustomer | null> {
  try {
    const document = customerData.document?.replace(/\D/g, '') || '';
    
    const payload = {
      name: customerData.name,
      email: customerData.email,
      cpfCnpj: document,
      phone: customerData.phone?.replace(/\D/g, ''),
      notificationDisabled: false
    };

    log.info(`Creating customer: ${customerData.email}`);

    const response = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      log.error("Error creating customer:", error);
      return null;
    }

    const newCustomer = await response.json();
    log.info(`Customer created: ${newCustomer.id}`);
    return newCustomer;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Exception creating customer:", errorMessage);
    return null;
  }
}
