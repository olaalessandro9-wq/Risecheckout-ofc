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
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;
const log = createLogger("asaas-validate-credentials");

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

  log.info('Iniciando validação');

  try {
    // 1. Parse request body
    const body: ValidateRequest = await req.json();
    const { apiKey, environment } = body;

    log.info('Ambiente', { environment });

    // 2. Validações básicas
    if (!apiKey || !apiKey.trim()) {
      log.error('API Key não fornecida');
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
      log.error('Ambiente inválido', { environment });
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

    log.debug('Base URL', { baseUrl });

    // 4. Fazer requisição de teste ao endpoint /myAccount
    // Este endpoint retorna informações da conta e serve para validar a API Key
    const response = await fetch(`${baseUrl}/myAccount`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
    });

    log.info('Status da resposta /myAccount', { status: response.status });

    // 5. Processar resposta
    if (!response.ok) {
      // API Key inválida ou sem permissões
      log.error('Credenciais inválidas', { status: response.status });
      
      let errorMessage = 'API Key inválida ou sem permissões';
      
      try {
        const errorData = await response.json();
        log.error('Erro da API', errorData);
        
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0].description || errorMessage;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        log.error('Erro ao parsear resposta de erro', e);
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
    
    log.info('Conta validada com sucesso', { name: accountData.name || 'N/A' });

    // 7. Tentar obter o walletId de diferentes formas
    let walletId = accountData.walletId || accountData.id || null;
    
    log.debug('WalletId do /myAccount', { walletId: walletId || 'N/A' });

    // 8. Se não veio walletId do /myAccount, tentar endpoint específico /walletId
    if (!walletId) {
      log.info('WalletId não encontrado em /myAccount, tentando /walletId...');
      
      try {
        const walletResponse = await fetch(`${baseUrl}/walletId`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey,
          },
        });

        log.info('Status da resposta /walletId', { status: walletResponse.status });

        if (walletResponse.ok) {
          const walletData = await walletResponse.json();
          log.debug('Dados do /walletId', walletData);
          
          // O endpoint pode retornar diferentes formatos
          walletId = walletData.id || walletData.walletId || walletData.wallet_id || null;
          
          if (walletId) {
            log.info('WalletId obtido via /walletId', { walletId });
          }
        } else {
          const walletError = await walletResponse.text();
          log.warn('Erro ao buscar /walletId', { error: walletError });
        }
      } catch (walletErr) {
        log.error('Exceção ao buscar /walletId', walletErr);
      }
    }

    // 9. Fallback: tentar usar campos alternativos do accountData
    if (!walletId) {
      // Algumas contas podem ter o ID em campos diferentes
      walletId = accountData.wallet?.id || accountData.accountId || null;
      
      if (walletId) {
        log.info('WalletId obtido via campos alternativos', { walletId });
      }
    }

    log.info('WalletId final', { walletId: walletId || 'NÃO ENCONTRADO' });

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
    log.error('Erro inesperado', error);
    
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
