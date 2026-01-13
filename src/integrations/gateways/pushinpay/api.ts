/**
 * API do PushinPay Gateway
 * Módulo: src/integrations/gateways/pushinpay
 * 
 * Este arquivo contém todas as funções para interagir com a API da PushinPay
 * via Edge Functions do Supabase.
 * 
 * RISE Protocol V2 Compliant - Todas as operações de escrita via Edge Functions
 * 
 * Migrado de: src/services/pushinpay.ts
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  PushinPaySettings,
  PushinPayEnvironment,
  PixChargeResponse,
  PixStatusResponse,
  PushinPayConnectionTestResponse,
  PushinPayStats,
  PushinPayAccountInfo,
} from "./types";

// URLs da API PushinPay por ambiente
const PUSHINPAY_API_URLS = {
  sandbox: "https://api-sandbox.pushinpay.com.br/api",
  production: "https://api.pushinpay.com.br/api",
} as const;

/**
 * Busca informações da conta PushinPay usando o token
 * Endpoint: GET /accounts/find
 * 
 * @param token - Token de API da PushinPay
 * @param environment - Ambiente (sandbox ou production)
 * @returns Dados da conta (id, name, email) ou null se erro
 * 
 * @example
 * const account = await fetchPushinPayAccountInfo("pk_...", "production");
 * if (account) {
 *   console.log("Account ID:", account.id);
 *   console.log("Nome:", account.name);
 * }
 */
export async function fetchPushinPayAccountInfo(
  token: string,
  environment: PushinPayEnvironment = "production"
): Promise<PushinPayAccountInfo | null> {
  const baseUrl = PUSHINPAY_API_URLS[environment];
  
  try {
    const response = await fetch(`${baseUrl}/accounts/find`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      console.error("[PushinPay] Erro ao buscar conta:", response.status, await response.text());
      return null;
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
    };
  } catch (error) {
    console.error("[PushinPay] Erro ao buscar conta:", error);
    return null;
  }
}

/**
 * Salva ou atualiza as configurações da PushinPay para o usuário especificado
 * Usa Edge Function vault-save para segurança
 * 
 * @param userId - ID do usuário autenticado
 * @param settings - Configurações da PushinPay (token e ambiente)
 * @returns Objeto com status de sucesso e mensagem de erro (se houver)
 * 
 * @example
 * const result = await savePushinPaySettings(user.id, {
 *   pushinpay_token: "pk_test_...",
 *   environment: "sandbox"
 * });
 * 
 * if (result.ok) {
 *   console.log("Configurações salvas com sucesso!");
 * }
 */
export async function savePushinPaySettings(
  userId: string,
  settings: PushinPaySettings
): Promise<{ ok: boolean; error?: string }> {
  if (!userId) {
    return { ok: false, error: "Usuário não autenticado" };
  }

  try {
    // Usar Edge Function vault-save para salvar credenciais de forma segura
    const { data, error } = await supabase.functions.invoke("save-vendor-credentials", {
      body: {
        vendor_id: userId,
        integration_type: "PUSHINPAY",
        credentials: {
          api_token: settings.pushinpay_token,
          environment: settings.environment,
          user_id: settings.pushinpay_account_id || null,
        },
        active: true,
      },
    });

    if (error) {
      console.error("[PushinPay] Erro ao salvar via Edge Function:", error);
      return { ok: false, error: error.message };
    }

    const result = data as { success?: boolean; error?: string };
    if (!result.success) {
      return { ok: false, error: result.error || "Erro ao salvar configurações" };
    }
    
    return { ok: true };
  } catch (e) {
    console.error("[PushinPay] Erro inesperado:", e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Recupera as configurações da PushinPay do usuário especificado
 * 
 * @param userId - ID do usuário autenticado
 * @returns Configurações da PushinPay (com token mascarado) ou null se não encontrado
 * 
 * @example
 * const settings = await getPushinPaySettings(user.id);
 * 
 * if (settings) {
 *   console.log("Ambiente:", settings.environment);
 *   // Token sempre retorna mascarado: "••••••••"
 * }
 */
export async function getPushinPaySettings(userId: string): Promise<PushinPaySettings | null> {
  if (!userId) {
    return null;
  }

  // Interface para resposta do Supabase
  interface PushinPaySettingsRow {
    environment: string;
    pushinpay_account_id: string | null;
    pushinpay_token: string | null;
  }

  const { data, error } = await supabase
    .from("payment_gateway_settings")
    .select("environment, pushinpay_account_id, pushinpay_token")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }
  
  const row = data as PushinPaySettingsRow;
  
  // Retorna com token vazio (mascarado) - o token real nunca é exposto ao cliente
  return {
    pushinpay_token: row.pushinpay_token ? "••••••••" : "",
    pushinpay_account_id: row.pushinpay_account_id || "",
    environment: row.environment as PushinPayEnvironment,
  } as PushinPaySettings;
}

/**
 * Cria uma cobrança PIX via Edge Function
 * 
 * @param orderId - ID do pedido
 * @param valueInCents - Valor em centavos (ex: 10000 = R$ 100,00)
 * @returns Resposta com dados do PIX (QR Code, ID, etc.) ou erro
 * 
 * @example
 * const result = await createPixCharge("order-123", 10000);
 * 
 * if (result.ok && result.pix) {
 *   console.log("QR Code:", result.pix.qr_code);
 *   console.log("PIX ID:", result.pix.pix_id);
 * }
 */
export async function createPixCharge(
  orderId: string,
  valueInCents: number
): Promise<PixChargeResponse> {
  const { data, error } = await supabase.functions.invoke(
    "pushinpay-create-pix",
    {
      body: { orderId, valueInCents },
    }
  );

  if (error) {
    return { ok: false, error: error.message };
  }
  
  return data as PixChargeResponse;
}

/**
 * Consulta o status de um pagamento PIX via Edge Function
 * 
 * @param orderId - ID do pedido
 * @returns Status do pagamento (paid, created, expired, canceled) ou erro
 * 
 * @example
 * const result = await getPixStatus("order-123");
 * 
 * if (result.ok && result.status) {
 *   if (result.status.status === "paid") {
 *     console.log("Pagamento confirmado!");
 *     console.log("Pagador:", result.status.payer_name);
 *   }
 * }
 */
export async function getPixStatus(orderId: string): Promise<PixStatusResponse> {
  const { data, error } = await supabase.functions.invoke(
    "pushinpay-get-status",
    {
      body: { orderId },
    }
  );

  if (error) {
    return { ok: false, error: error.message };
  }
  
  return data as PixStatusResponse;
}

/**
 * Testa a conexão com a API da PushinPay
 * 
 * @returns Resultado do teste com detalhes da conta ou erro
 * 
 * @example
 * const result = await testPushinPayConnection();
 * 
 * if (result.ok) {
 *   console.log("Conexão OK!");
 *   console.log("Ambiente:", result.environment);
 *   console.log("Conta:", result.details?.accountId);
 * }
 */
export async function testPushinPayConnection(): Promise<PushinPayConnectionTestResponse> {
  const { data, error } = await supabase.functions.invoke("test-pushinpay-connection");
  
  if (error) {
    return { 
      ok: false, 
      environment: "sandbox",
      message: error.message 
    };
  }
  
  return data;
}

/**
 * Obtém estatísticas de uso da PushinPay
 * 
 * @returns Estatísticas (total de transações, valor total, etc.) ou null se erro
 * 
 * @example
 * const stats = await getPushinPayStats();
 * 
 * if (stats) {
 *   console.log("Total de transações:", stats.totalTransactions);
 *   console.log("Valor total:", stats.totalAmount);
 *   console.log("Webhook:", stats.webhookStatus);
 * }
 */
export async function getPushinPayStats(): Promise<PushinPayStats | null> {
  const { data, error } = await supabase.functions.invoke("pushinpay-stats");
  
  if (error || !data) {
    return null;
  }
  
  return data;
}
