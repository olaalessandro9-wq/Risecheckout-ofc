/**
 * fee-calculator.ts
 * 
 * Funções de cálculo de taxas e comissões da plataforma RiseCheckout.
 * Extraído de platform-config.ts para RISE Protocol V2 (< 300 linhas).
 * 
 * @module _shared/fee-calculator
 * @version 1.1.0 - Migrated to centralized logger
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PLATFORM_FEE_PERCENT, PLATFORM_OWNER_USER_ID } from "./platform-constants.ts";
import { createLogger } from "./logger.ts";

const log = createLogger("FeeCalculator");

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

/**
 * Calcula a taxa da plataforma em centavos
 * @param amountCents Valor total em centavos
 * @param feePercent Taxa em decimal (opcional, usa padrão se não fornecido)
 * @returns Taxa da plataforma em centavos (arredondado para baixo)
 */
export function calculatePlatformFeeCents(amountCents: number, feePercent?: number): number {
  const fee = feePercent ?? PLATFORM_FEE_PERCENT;
  return Math.floor(amountCents * fee);
}

/**
 * Calcula a taxa da plataforma em reais (para APIs que usam float)
 * @param amountReais Valor total em reais
 * @param feePercent Taxa em decimal (opcional, usa padrão se não fornecido)
 * @returns Taxa da plataforma em reais
 */
export function calculatePlatformFeeReais(amountReais: number, feePercent?: number): number {
  const fee = feePercent ?? PLATFORM_FEE_PERCENT;
  return amountReais * fee;
}

/**
 * Retorna a taxa como porcentagem formatada
 * @param feePercent Taxa em decimal (opcional)
 */
export function getPlatformFeePercentFormatted(feePercent?: number): string {
  const fee = feePercent ?? PLATFORM_FEE_PERCENT;
  return `${fee * 100}%`;
}

// ========================================================================
// VENDOR FEE FUNCTIONS
// ========================================================================

interface VendorFeeProfile {
  custom_fee_percent: number | null;
}

/**
 * Busca a taxa personalizada de um vendedor no banco de dados
 * Se o vendedor não tiver taxa personalizada, retorna a taxa padrão
 * 
 * @param supabase Cliente Supabase com service role
 * @param vendorId ID do vendedor
 * @returns Taxa em decimal (ex: 0.04 = 4%)
 */
export async function getVendorFeePercent(
  supabase: SupabaseClient,
  vendorId: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("custom_fee_percent")
      .eq("id", vendorId)
      .single();

    if (error) {
      log.error("Erro ao buscar taxa do vendedor", error);
      return PLATFORM_FEE_PERCENT;
    }

    const profile = data as VendorFeeProfile | null;
    
    if (profile?.custom_fee_percent != null) {
      log.info(`Vendedor ${vendorId} tem taxa personalizada: ${profile.custom_fee_percent * 100}%`);
      return profile.custom_fee_percent;
    }

    return PLATFORM_FEE_PERCENT;
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    log.error("Erro ao buscar taxa", errMessage);
    return PLATFORM_FEE_PERCENT;
  }
}

// ========================================================================
// OWNER VERIFICATION
// ========================================================================

interface UserRoleRecord {
  role: string;
}

/**
 * Verifica se o vendedor é o Owner da plataforma
 * @param supabase Cliente Supabase
 * @param vendorId ID do vendedor
 * @returns true se for Owner
 */
export async function isVendorOwner(
  supabase: SupabaseClient,
  vendorId: string
): Promise<boolean> {
  // Fast path: comparar com ID conhecido
  if (vendorId === PLATFORM_OWNER_USER_ID) {
    log.info("🏠 OWNER detectado via ID direto");
    return true;
  }
  
  // Fallback: verificar via tabela user_roles
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", vendorId)
      .maybeSingle();
    
    const record = data as UserRoleRecord | null;
    const isOwner = record?.role === "owner";
    if (isOwner) {
      log.info("🏠 OWNER detectado via user_roles");
    }
    return isOwner;
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    log.error("Erro ao verificar owner", errMessage);
    return false;
  }
}

// ========================================================================
// AFFILIATE COMMISSION
// ========================================================================

/**
 * Calcula a comissão do afiliado usando o MODELO CAKTO
 * Taxa da plataforma é descontada primeiro, depois comissão sobre o líquido
 * 
 * @param totalCents Valor total em centavos
 * @param commissionRate Taxa de comissão do afiliado (ex: 70 = 70%)
 * @param platformFeePercent Taxa da plataforma em decimal (ex: 0.04 = 4%)
 * @returns Objeto com valores calculados
 */
export function calculateAffiliateCommission(
  totalCents: number,
  commissionRate: number,
  platformFeePercent: number = PLATFORM_FEE_PERCENT
): { 
  platformFeeCents: number; 
  netAfterFee: number; 
  commissionCents: number;
  producerCents: number;
} {
  const platformFeeCents = Math.floor(totalCents * platformFeePercent);
  const netAfterFee = totalCents - platformFeeCents;
  const commissionCents = Math.floor(netAfterFee * (commissionRate / 100));
  const producerCents = netAfterFee - commissionCents;
  
  return { 
    platformFeeCents, 
    netAfterFee, 
    commissionCents,
    producerCents
  };
}
