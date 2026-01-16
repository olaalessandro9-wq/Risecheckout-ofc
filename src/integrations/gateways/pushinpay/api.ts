/**
 * API do PushinPay Gateway
 * 
 * MIGRATED: Uses Edge Function instead of supabase.from()
 */

import { supabase } from "@/integrations/supabase/client";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";
import type {
  PushinPaySettings,
  PushinPayEnvironment,
  PixChargeResponse,
  PixStatusResponse,
  PushinPayConnectionTestResponse,
  PushinPayStats,
  PushinPayAccountInfo,
} from "./types";

const PUSHINPAY_API_URLS = {
  sandbox: "https://api-sandbox.pushinpay.com.br/api",
  production: "https://api.pushinpay.com.br/api",
} as const;

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
  } catch (error: unknown) {
    console.error("[PushinPay] Erro ao buscar conta:", error);
    return null;
  }
}

export async function savePushinPaySettings(
  userId: string,
  settings: PushinPaySettings
): Promise<{ ok: boolean; error?: string }> {
  if (!userId) {
    return { ok: false, error: "Usuário não autenticado" };
  }

  try {
    const sessionToken = getProducerSessionToken();

    const { data, error } = await supabase.functions.invoke("vault-save", {
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
      headers: { 'x-producer-session-token': sessionToken || '' },
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
 * Get PushinPay settings via Edge Function
 * MIGRATED: Uses supabase.functions.invoke instead of supabase.from()
 */
export async function getPushinPaySettings(userId: string): Promise<PushinPaySettings | null> {
  if (!userId) {
    return null;
  }

  try {
    const sessionToken = getProducerSessionToken();
    
    const { data, error } = await supabase.functions.invoke("admin-data", {
      body: {
        action: "vendor-integration",
        integrationType: "PUSHINPAY",
      },
      headers: { "x-producer-session-token": sessionToken || "" },
    });

    if (error || !data?.integration) {
      return null;
    }
    
    const integration = data.integration;
    const config = integration.config as Record<string, unknown> | null;
    
    if (!config || !integration.active) {
      return null;
    }
    
    return {
      pushinpay_token: config.credentials_in_vault ? "••••••••" : "",
      pushinpay_account_id: (config.user_id as string) || "",
      environment: (config.environment as PushinPayEnvironment) || "production",
    };
  } catch (error) {
    console.error("[PushinPay] Erro ao buscar configurações:", error);
    return null;
  }
}

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

export async function testPushinPayConnection(): Promise<PushinPayConnectionTestResponse> {
  const { data, error } = await supabase.functions.invoke("pushinpay-validate-token");
  
  if (error) {
    return { 
      ok: false, 
      environment: "sandbox",
      message: error.message 
    };
  }
  
  return data;
}

export async function getPushinPayStats(): Promise<PushinPayStats | null> {
  const { data, error } = await supabase.functions.invoke("pushinpay-stats");
  
  if (error || !data) {
    return null;
  }
  
  return data;
}
