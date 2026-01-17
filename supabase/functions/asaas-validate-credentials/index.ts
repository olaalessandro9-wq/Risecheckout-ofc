/**
 * Edge Function: asaas-validate-credentials
 * 
 * Valida credenciais do Asaas fazendo uma requisição de teste ao endpoint /myAccount.
 * Também busca o walletId através do endpoint /walletId para suportar split.
 * Retorna informações da conta se válido, ou erro se inválido.
 * 
 * Documentação Asaas: https://docs.asaas.com/reference/obter-dados-da-conta
 * 
 * @author RiseCheckout Team
 * @version 1.1.0
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

interface ValidateRequest {
  apiKey: string;
  environment: 'sandbox' | 'production';
}

interface ValidateResponse {
  valid: boolean;
  message?: string;
  accountName?: string;
  walletId?: string;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const functionName = 'asaas-validate-credentials';
  console.log(`[${functionName}] Iniciando validação...`);

  try {
    // 1. Parse request body
    const body: ValidateRequest = await req.json();
    const { apiKey, environment } = body;

    console.log(`[${functionName}] Ambiente: ${environment}`);

    // 2. Validações básicas
    if (!apiKey || !apiKey.trim()) {
      console.error(`[${functionName}] API Key não fornecida`);
      return new Response(
        JSON.stringify({
          valid: false,
          message: 'API Key é obrigatória',
        } as ValidateResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!environment || !['sandbox', 'production'].includes(environment)) {
      console.error(`[${functionName}] Ambiente inválido: ${environment}`);
      return new Response(
        JSON.stringify({
          valid: false,
          message: 'Ambiente deve ser "sandbox" ou "production"',
        } as ValidateResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 3. Determinar URL base
    const baseUrl = environment === 'sandbox'
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/v3';

    console.log(`[${functionName}] Base URL: ${baseUrl}`);

    // 4. Fazer requisição de teste ao endpoint /myAccount
    // Este endpoint retorna informações da conta e serve para validar a API Key
    const response = await fetch(`${baseUrl}/myAccount`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
    });

    console.log(`[${functionName}] Status da resposta /myAccount: ${response.status}`);

    // 5. Processar resposta
    if (!response.ok) {
      // API Key inválida ou sem permissões
      console.error(`[${functionName}] Credenciais inválidas. Status: ${response.status}`);
      
      let errorMessage = 'API Key inválida ou sem permissões';
      
      try {
        const errorData = await response.json();
        console.error(`[${functionName}] Erro da API:`, errorData);
        
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0].description || errorMessage;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        console.error(`[${functionName}] Erro ao parsear resposta de erro:`, e);
      }

      return new Response(
        JSON.stringify({
          valid: false,
          message: errorMessage,
        } as ValidateResponse),
        { 
          status: 200, // Retornamos 200 porque a validação foi processada, mesmo que inválida
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 6. Credenciais válidas - extrair informações da conta
    const accountData = await response.json();
    
    console.log(`[${functionName}] Conta validada com sucesso`);
    console.log(`[${functionName}] Nome da conta: ${accountData.name || 'N/A'}`);
    console.log(`[${functionName}] Dados da conta:`, JSON.stringify(accountData));

    // 7. Tentar obter o walletId de diferentes formas
    let walletId = accountData.walletId || accountData.id || null;
    
    console.log(`[${functionName}] WalletId do /myAccount: ${walletId || 'N/A'}`);

    // 8. Se não veio walletId do /myAccount, tentar endpoint específico /walletId
    if (!walletId) {
      console.log(`[${functionName}] WalletId não encontrado em /myAccount, tentando /walletId...`);
      
      try {
        const walletResponse = await fetch(`${baseUrl}/walletId`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey,
          },
        });

        console.log(`[${functionName}] Status da resposta /walletId: ${walletResponse.status}`);

        if (walletResponse.ok) {
          const walletData = await walletResponse.json();
          console.log(`[${functionName}] Dados do /walletId:`, JSON.stringify(walletData));
          
          // O endpoint pode retornar diferentes formatos
          walletId = walletData.id || walletData.walletId || walletData.wallet_id || null;
          
          if (walletId) {
            console.log(`[${functionName}] WalletId obtido via /walletId: ${walletId}`);
          }
        } else {
          const walletError = await walletResponse.text();
          console.log(`[${functionName}] Erro ao buscar /walletId: ${walletError}`);
        }
      } catch (walletErr) {
        console.error(`[${functionName}] Exceção ao buscar /walletId:`, walletErr);
      }
    }

    // 9. Fallback: tentar usar campos alternativos do accountData
    if (!walletId) {
      // Algumas contas podem ter o ID em campos diferentes
      walletId = accountData.wallet?.id || accountData.accountId || null;
      
      if (walletId) {
        console.log(`[${functionName}] WalletId obtido via campos alternativos: ${walletId}`);
      }
    }

    console.log(`[${functionName}] WalletId final: ${walletId || 'NÃO ENCONTRADO'}`);

    return new Response(
      JSON.stringify({
        valid: true,
        message: 'Credenciais válidas',
        accountName: accountData.name || undefined,
        walletId: walletId || undefined,
      } as ValidateResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`[${functionName}] Erro inesperado:`, error);
    
    return new Response(
      JSON.stringify({
        valid: false,
        message: error instanceof Error 
          ? `Erro ao validar credenciais: ${error.message}` 
          : 'Erro desconhecido ao validar credenciais',
      } as ValidateResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
