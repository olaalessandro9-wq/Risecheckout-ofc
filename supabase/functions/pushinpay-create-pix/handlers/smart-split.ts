/**
 * Smart Split Handler
 * 
 * Determina quem cria o PIX e como montar os split_rules
 * 
 * REGRA: PIX é criado por quem tem a MAIOR parte do valor
 * - Se afiliado tem maior parte E tem credenciais → afiliado cria PIX
 * - Senão → produtor cria PIX
 * 
 * @author RiseCheckout Team
 */

import { 
  calculatePlatformFeeCents, 
  PLATFORM_PUSHINPAY_ACCOUNT_ID, 
  getVendorFeePercent,
  getGatewayCredentials,
  validateCredentials
} from "../../_shared/platform-config.ts";

// Limite máximo de split da PushinPay (50%)
export const PUSHINPAY_MAX_SPLIT_PERCENT = 0.50;

export interface SmartSplitDecision {
  pixCreatorToken: string;
  pixCreatorAccountId: string;
  pixCreatorEnvironment: 'sandbox' | 'production';
  pixCreatedBy: 'producer' | 'affiliate';
  splitRules: Array<{value: number, account_id: string}>;
  adjustedSplit: boolean;
  manualPaymentNeeded: number;
}

interface OrderData {
  vendor_id: string;
  affiliate_id: string | null;
  commission_cents: number | null;
  platform_fee_cents: number | null;
}

export async function determineSmartSplit(
  supabase: { from: (table: string) => any },
  order: OrderData,
  valueInCents: number,
  logPrefix: string
): Promise<SmartSplitDecision> {
  
  // 1. Calcular taxas
  const vendorFeePercent = await getVendorFeePercent(supabase, order.vendor_id);
  const platformFeeCents = order.platform_fee_cents || calculatePlatformFeeCents(valueInCents, vendorFeePercent);
  const affiliateCommissionCents = order.commission_cents || 0;
  
  // Valor líquido do produtor = Total - Taxa Plataforma - Comissão Afiliado
  const vendorNetCents = valueInCents - platformFeeCents - affiliateCommissionCents;
  
  console.log(`[${logPrefix}] 📊 Distribuição: Produtor=${vendorNetCents}c, Afiliado=${affiliateCommissionCents}c, Plataforma=${platformFeeCents}c`);
  
  // 2. Buscar credenciais do produtor (sempre precisamos)
  let producerCredentials;
  try {
    producerCredentials = await getGatewayCredentials(supabase, order.vendor_id, 'pushinpay');
  } catch (err: any) {
    throw new Error(`Credenciais PushinPay do produtor não configuradas: ${err.message}`);
  }
  
  const validation = validateCredentials('pushinpay', producerCredentials.credentials);
  if (!validation.valid) {
    throw new Error(`Token PushinPay do produtor não configurado`);
  }
  
  const producerToken = producerCredentials.credentials.token!;
  const producerAccountId = producerCredentials.credentials.accountId || '';
  const producerEnvironment = producerCredentials.credentials.environment || 'production';
  const isProducerOwner = producerCredentials.isOwner;
  
  // 3. Verificar se tem afiliado com maior parte
  const affiliateHasLargerShare = order.affiliate_id && affiliateCommissionCents > vendorNetCents;
  
  console.log(`[${logPrefix}] Afiliado tem maior parte? ${affiliateHasLargerShare ? 'SIM' : 'NÃO'}`);
  
  // 4. Se afiliado tem maior parte, tentar usar credenciais dele
  if (affiliateHasLargerShare && order.affiliate_id) {
    const affiliateResult = await tryAffiliatePixCreation(
      supabase, order.affiliate_id, vendorNetCents, platformFeeCents,
      producerAccountId, isProducerOwner, valueInCents, logPrefix
    );
    
    if (affiliateResult) {
      return affiliateResult;
    }
  }
  
  // 5. PADRÃO: Produtor cria PIX
  return await createProducerSplit(
    supabase, order, platformFeeCents, affiliateCommissionCents,
    isProducerOwner, producerToken, producerAccountId, producerEnvironment,
    valueInCents, logPrefix
  );
}

async function tryAffiliatePixCreation(
  supabase: { from: (table: string) => any },
  affiliateId: string,
  vendorNetCents: number,
  platformFeeCents: number,
  producerAccountId: string,
  isProducerOwner: boolean,
  valueInCents: number,
  logPrefix: string
): Promise<SmartSplitDecision | null> {
  
  console.log(`[${logPrefix}] 🔄 Tentando usar token do AFILIADO...`);
  
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('user_id')
    .eq('id', affiliateId)
    .single();
  
  if (!affiliate?.user_id) return null;
  
  const { data: affiliateSettings } = await supabase
    .from('payment_gateway_settings')
    .select('token_encrypted, pushinpay_account_id, environment')
    .eq('user_id', affiliate.user_id)
    .single();
  
  if (!affiliateSettings?.token_encrypted || !affiliateSettings?.pushinpay_account_id) {
    console.warn(`[${logPrefix}] ⚠️ Afiliado sem credenciais PushinPay - fallback para produtor`);
    return null;
  }
  
  console.log(`[${logPrefix}] ✅ Afiliado tem credenciais PushinPay - criando PIX pelo AFILIADO`);
  
  const splitRules: Array<{value: number, account_id: string}> = [];
  
  // A. Valor líquido do produtor
  if (vendorNetCents > 0 && producerAccountId) {
    splitRules.push({ value: vendorNetCents, account_id: producerAccountId });
    console.log(`[${logPrefix}] Split para produtor: ${vendorNetCents}c → ${producerAccountId}`);
  }
  
  // B. Taxa da plataforma (se não for owner)
  const platformAccountId = PLATFORM_PUSHINPAY_ACCOUNT_ID || Deno.env.get('PUSHINPAY_PLATFORM_ACCOUNT_ID');
  if (!isProducerOwner && platformFeeCents > 0 && platformAccountId) {
    splitRules.push({ value: platformFeeCents, account_id: platformAccountId });
    console.log(`[${logPrefix}] Split para plataforma: ${platformFeeCents}c → ${platformAccountId}`);
  }
  
  // Validar limite de 50%
  const totalSplitCents = splitRules.reduce((acc, r) => acc + r.value, 0);
  const maxSplitCents = Math.floor(valueInCents * PUSHINPAY_MAX_SPLIT_PERCENT);
  
  if (totalSplitCents <= maxSplitCents) {
    return {
      pixCreatorToken: affiliateSettings.token_encrypted,
      pixCreatorAccountId: affiliateSettings.pushinpay_account_id,
      pixCreatorEnvironment: (affiliateSettings.environment as 'sandbox' | 'production') || 'production',
      pixCreatedBy: 'affiliate',
      splitRules,
      adjustedSplit: false,
      manualPaymentNeeded: 0
    };
  }
  
  console.warn(`[${logPrefix}] ⚠️ Split ${totalSplitCents}c excede limite ${maxSplitCents}c mesmo com afiliado criando PIX`);
  return null; // Fallback para produtor
}

async function createProducerSplit(
  supabase: { from: (table: string) => any },
  order: OrderData,
  platformFeeCents: number,
  affiliateCommissionCents: number,
  isProducerOwner: boolean,
  producerToken: string,
  producerAccountId: string,
  producerEnvironment: 'sandbox' | 'production',
  valueInCents: number,
  logPrefix: string
): Promise<SmartSplitDecision> {
  
  console.log(`[${logPrefix}] 📌 Produtor criará o PIX`);
  
  const splitRules: Array<{value: number, account_id: string}> = [];
  const platformAccountId = PLATFORM_PUSHINPAY_ACCOUNT_ID || Deno.env.get('PUSHINPAY_PLATFORM_ACCOUNT_ID');
  
  // A. Taxa da plataforma (se não for owner)
  if (!isProducerOwner && platformFeeCents > 0 && platformAccountId) {
    splitRules.push({ value: platformFeeCents, account_id: platformAccountId });
    console.log(`[${logPrefix}] Split plataforma: ${platformFeeCents}c → ${platformAccountId}`);
  }
  
  // B. Comissão do afiliado
  if (order.affiliate_id && affiliateCommissionCents > 0) {
    const affiliateAccountId = await getAffiliateAccountId(supabase, order.affiliate_id, logPrefix);
    if (affiliateAccountId) {
      splitRules.push({ value: affiliateCommissionCents, account_id: affiliateAccountId });
      console.log(`[${logPrefix}] Split afiliado: ${affiliateCommissionCents}c → ${affiliateAccountId}`);
    }
  }
  
  // Validar e ajustar limite de 50%
  const { adjustedRules, adjustedSplit, manualPaymentNeeded } = validateAndAdjustSplit(
    splitRules, valueInCents, logPrefix
  );
  
  return {
    pixCreatorToken: producerToken,
    pixCreatorAccountId: producerAccountId,
    pixCreatorEnvironment: producerEnvironment,
    pixCreatedBy: 'producer',
    splitRules: adjustedRules,
    adjustedSplit,
    manualPaymentNeeded
  };
}

async function getAffiliateAccountId(
  supabase: { from: (table: string) => any },
  affiliateId: string,
  logPrefix: string
): Promise<string | null> {
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('user_id')
    .eq('id', affiliateId)
    .single();
  
  if (!affiliate?.user_id) return null;
  
  const { data: affiliateSettings } = await supabase
    .from('payment_gateway_settings')
    .select('pushinpay_account_id')
    .eq('user_id', affiliate.user_id)
    .single();
  
  if (!affiliateSettings?.pushinpay_account_id) {
    console.warn(`[${logPrefix}] ⚠️ Afiliado sem pushinpay_account_id, comissão manual`);
    return null;
  }
  
  return affiliateSettings.pushinpay_account_id;
}

function validateAndAdjustSplit(
  splitRules: Array<{value: number, account_id: string}>,
  valueInCents: number,
  logPrefix: string
): { adjustedRules: Array<{value: number, account_id: string}>, adjustedSplit: boolean, manualPaymentNeeded: number } {
  
  const totalSplitCents = splitRules.reduce((acc, r) => acc + r.value, 0);
  const maxSplitCents = Math.floor(valueInCents * PUSHINPAY_MAX_SPLIT_PERCENT);
  
  if (totalSplitCents <= maxSplitCents) {
    return { adjustedRules: splitRules, adjustedSplit: false, manualPaymentNeeded: 0 };
  }
  
  console.warn(`[${logPrefix}] ⚠️ Split ${totalSplitCents}c excede limite ${maxSplitCents}c - AJUSTANDO PROPORCIONALMENTE`);
  
  const manualPaymentNeeded = totalSplitCents - maxSplitCents;
  const reductionRatio = maxSplitCents / totalSplitCents;
  
  const adjustedRules = splitRules.map(rule => {
    const originalValue = rule.value;
    const adjustedValue = Math.floor(rule.value * reductionRatio);
    console.log(`[${logPrefix}] Ajustado: ${originalValue}c → ${adjustedValue}c`);
    return { value: adjustedValue, account_id: rule.account_id };
  });
  
  console.log(`[${logPrefix}] ⚠️ PAGAMENTO MANUAL NECESSÁRIO: ${manualPaymentNeeded}c`);
  
  return { adjustedRules, adjustedSplit: true, manualPaymentNeeded };
}
