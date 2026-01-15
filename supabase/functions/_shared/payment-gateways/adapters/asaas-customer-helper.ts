/**
 * asaas-customer-helper.ts
 * 
 * Módulo auxiliar para gerenciamento de customers na Asaas.
 * Separado do AsaasAdapter para manter arquivos < 300 linhas (RISE Protocol V2).
 * 
 * @version 1.0.0
 */

// ============================================
// TYPES
// ============================================

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

export interface CustomerInput {
  name: string;
  email: string;
  document?: string;
  phone?: string;
}

// ============================================
// CUSTOMER MANAGEMENT FUNCTIONS
// ============================================

/**
 * Busca customer existente por CPF/CNPJ ou cria novo
 */
export async function findOrCreateCustomer(
  baseUrl: string,
  headers: HeadersInit,
  customerData: CustomerInput
): Promise<AsaasCustomer | null> {
  const document = customerData.document?.replace(/\D/g, '') || '';
  
  // 1. Tentar buscar por documento
  if (document) {
    const existing = await findCustomerByDocument(baseUrl, headers, document);
    if (existing) {
      console.log(`[AsaasCustomerHelper] Customer encontrado: ${existing.id}`);
      return existing;
    }
  }

  // 2. Criar novo customer
  return createCustomer(baseUrl, headers, customerData);
}

/**
 * Busca customer por CPF/CNPJ
 */
export async function findCustomerByDocument(
  baseUrl: string,
  headers: HeadersInit,
  document: string
): Promise<AsaasCustomer | null> {
  try {
    const response = await fetch(
      `${baseUrl}/customers?cpfCnpj=${document}`,
      { headers }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.data?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * Cria novo customer na Asaas
 */
export async function createCustomer(
  baseUrl: string,
  headers: HeadersInit,
  customerData: CustomerInput
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

    console.log(`[AsaasCustomerHelper] Criando customer: ${customerData.email}`);

    const response = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[AsaasCustomerHelper] Erro ao criar customer:', error);
      return null;
    }

    const customer = await response.json();
    console.log(`[AsaasCustomerHelper] Customer criado: ${customer.id}`);
    return customer;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[AsaasCustomerHelper] Exception createCustomer:', errorMessage);
    return null;
  }
}
