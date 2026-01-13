/**
 * Asaas Customer Service
 * 
 * Módulo responsável por buscar ou criar clientes no Asaas.
 * Extraído de asaas-create-payment para Clean Architecture.
 * 
 * @module _shared/asaas-customer
 */

export interface CustomerData {
  name: string;
  email: string;
  document: string;
  phone?: string;
}

export interface AsaasCustomer {
  id: string;
}

/**
 * Busca cliente existente por CPF/CNPJ ou cria um novo.
 * 
 * @param baseUrl - URL base da API Asaas (sandbox ou produção)
 * @param apiKey - Token de acesso da API Asaas
 * @param customer - Dados do cliente
 * @returns Customer ID ou null em caso de erro
 */
export async function findOrCreateCustomer(
  baseUrl: string, 
  apiKey: string, 
  customer: CustomerData
): Promise<AsaasCustomer | null> {
  const document = customer.document.replace(/\D/g, '');

  // Tentar buscar por CPF/CNPJ
  if (document) {
    try {
      const searchResponse = await fetch(`${baseUrl}/customers?cpfCnpj=${document}`, {
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey
        }
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.data?.[0]) {
          console.log('[asaas-customer] Cliente encontrado:', searchData.data[0].id);
          return { id: searchData.data[0].id };
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[asaas-customer] Erro ao buscar cliente:', errorMessage);
    }
  }

  // Criar novo customer
  try {
    const createResponse = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify({
        name: customer.name,
        email: customer.email,
        cpfCnpj: document,
        phone: customer.phone?.replace(/\D/g, ''),
        notificationDisabled: false
      })
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error('[asaas-customer] Erro ao criar cliente:', errorData);
      return null;
    }

    const newCustomer = await createResponse.json();
    console.log('[asaas-customer] Cliente criado:', newCustomer.id);
    return { id: newCustomer.id };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[asaas-customer] Exceção ao criar cliente:', errorMessage);
    return null;
  }
}
