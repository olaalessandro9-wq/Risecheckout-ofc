/**
 * API do PushinPay Gateway
 * 
 * @version 2.0.0 - RISE Protocol V3 - Zero console.log
 */

import { api } from "@/lib/api/client";
import type {
  PushinPaySettings,
  PushinPayEnvironment,
  PixChargeResponse,
  PixStatusResponse,
  PushinPayConnectionTestResponse,
  PushinPayStats,
  PushinPayAccountInfo,
} from "./types";
import { createLogger } from "@/lib/logger";

const log = createLogger("PushinPayApi");

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
      log.error("Erro ao buscar conta:", response.status, await response.text());
      return null;
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
    };
  } catch (error: unknown) {
    log.error("Erro ao buscar conta:", error);
    return null;
  }
}

interface VaultSaveResponse {
  success?: boolean;
  error?: string;
}

export async function savePushinPaySettings(
  userId: string,
  settings: PushinPaySettings
): Promise<{ ok: boolean; error?: string }> {
  if (!userId) {
    return { ok: false, error: "Usuário não autenticado" };
  }

  try {
    const { data, error } = await api.call<VaultSaveResponse>("vault-save", {
      vendor_id: userId,
      integration_type: "PUSHINPAY",
      credentials: {
        api_token: settings.pushinpay_token,
        environment: settings.environment,
        user_id: settings.pushinpay_account_id || null,
      },
      active: true,
    });

    if (error) {
      log.error("Erro ao salvar via Edge Function:", error);
      return { ok: false, error: error.message };
    }

    if (!data?.success) {
      return { ok: false, error: data?.error || "Erro ao salvar configurações" };
    }
    
    return { ok: true };
  } catch (e) {
    log.error("Erro inesperado:", e);
    return { ok: false, error: String(e) };
  }
}

interface VendorIntegrationResponse {
  integration?: {
    active: boolean;
    config: Record<string, unknown> | null;
  };
}

/**
 * Get PushinPay settings via Edge Function
 * MIGRATED: Uses api.call instead of supabase.functions.invoke
 */
export async function getPushinPaySettings(userId: string): Promise<PushinPaySettings | null> {
  if (!userId) {
    return null;
  }

  try {
    const { data, error } = await api.call<VendorIntegrationResponse>("admin-data", {
      action: "vendor-integration",
      integrationType: "PUSHINPAY",
    });

    if (error || !data?.integration) {
      return null;
    }
    
    const integration = data.integration;
    const config = integration.config;
    
    if (!config || !integration.active) {
      return null;
    }
    
    return {
      pushinpay_token: config.credentials_in_vault ? "••••••••" : "",
      pushinpay_account_id: (config.user_id as string) || "",
      environment: (config.environment as PushinPayEnvironment) || "production",
    };
  } catch (error) {
    log.error("Erro ao buscar configurações:", error);
    return null;
  }
}

export async function createPixCharge(
  orderId: string,
  valueInCents: number
): Promise<PixChargeResponse> {
  const { data, error } = await api.publicCall<PixChargeResponse>(
    "pushinpay-create-pix",
    { orderId, valueInCents }
  );

  if (error) {
    return { ok: false, error: error.message };
  }
  
  return data || { ok: false, error: "No response data" };
}

export async function getPixStatus(orderId: string): Promise<PixStatusResponse> {
  const { data, error } = await api.publicCall<PixStatusResponse>(
    "pushinpay-get-status",
    { orderId }
  );

  if (error) {
    return { ok: false, error: error.message };
  }
  
  return data || { ok: false, error: "No response data" };
}

export async function testPushinPayConnection(): Promise<PushinPayConnectionTestResponse> {
  const { data, error } = await api.call<PushinPayConnectionTestResponse>("pushinpay-validate-token");
  
  if (error) {
    return { 
      ok: false, 
      environment: "sandbox",
      message: error.message 
    };
  }
  
  return data || { ok: false, environment: "sandbox", message: "No response data" };
}

export async function getPushinPayStats(): Promise<PushinPayStats | null> {
  const { data, error } = await api.call<PushinPayStats>("pushinpay-stats");
  
  if (error || !data) {
    return null;
  }
  
  return data;
}
