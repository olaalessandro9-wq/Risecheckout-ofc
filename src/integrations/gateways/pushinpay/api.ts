/**
 * API do PushinPay Gateway
 * Módulo: src/integrations/gateways/pushinpay
 * 
 * Este arquivo contém todas as funções para interagir com a API da PushinPay
 * via Edge Functions do Supabase.
 * 
 * Migrado de: src/services/pushinpay.ts
 */

import { supabase } from "@/integrations/supabase/client";
import type { PaymentGatewaySettings } from "@/integrations/supabase/types-payment-gateway";
import type {
  PushinPaySettings,
  PixChargeResponse,
  PixStatusResponse,
  PushinPayConnectionTestResponse,
  PushinPayStats,
} from "./types";

/**
 * Salva ou atualiza as configurações da PushinPay para o usuário atual
 * 
 * @param settings - Configurações da PushinPay (token e ambiente)
 * @returns Objeto com status de sucesso e mensagem de erro (se houver)
 * 
 * @example
 * const result = await savePushinPaySettings({
 *   pushinpay_token: "pk_test_...",
 *   environment: "sandbox"
 * });
 * 
 * if (result.ok) {
 *   console.log("Configurações salvas com sucesso!");
 * }
 */
export async function savePushinPaySettings(
  settings: PushinPaySettings
): Promise<{ ok: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return { ok: false, error: "Usuário não autenticado" };
  }

  try {
    const updateData: Record<string, any> = {
      user_id: user.id,
      pushinpay_token: settings.pushinpay_token,
      environment: settings.environment,
    };
    
    // Incluir account_id se fornecido
    if (settings.pushinpay_account_id !== undefined) {
      updateData.pushinpay_account_id = settings.pushinpay_account_id || null;
    }

    const { error } = await supabase
      .from("payment_gateway_settings")
      .upsert(updateData as any);

    if (error) {
      return { ok: false, error: error.message };
    }
    
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Recupera as configurações da PushinPay do usuário atual
 * 
 * @returns Configurações da PushinPay (com token mascarado) ou null se não encontrado
 * 
 * @example
 * const settings = await getPushinPaySettings();
 * 
 * if (settings) {
 *   console.log("Ambiente:", settings.environment);
 *   // Token sempre retorna mascarado: "••••••••"
 * }
 */
export async function getPushinPaySettings(): Promise<PushinPaySettings | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("payment_gateway_settings")
    .select("environment, pushinpay_account_id, pushinpay_token")
    .eq("user_id", user.id)
    .single() as any;

  if (error || !data) {
    return null;
  }
  
  // Retorna com token vazio (mascarado) - o token real nunca é exposto ao cliente
  return {
    pushinpay_token: data.pushinpay_token ? "••••••••" : "",
    pushinpay_account_id: data.pushinpay_account_id || "",
    environment: (data as PaymentGatewaySettings).environment,
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
