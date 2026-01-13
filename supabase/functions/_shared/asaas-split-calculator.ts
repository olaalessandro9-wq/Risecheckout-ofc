/**
 * Asaas Split Calculator
 * 
 * Módulo responsável por calcular dados de split para o modelo Marketplace.
 * Extraído de asaas-create-payment para Clean Architecture.
 * 
 * MODELO MARKETPLACE:
 * - Todas cobranças na conta RiseCheckout
 * - Split BINÁRIO (nunca 3 partes)
 * - Owner vendendo direto: 100% RiseCheckout
 * - Owner + Afiliado: Afiliado recebe X% * 0.96, Owner recebe resto
 * - Vendedor comum: 96% vendedor, 4% plataforma
 * 
 * RISE Protocol Compliant - Zero `any`
 * 
 * @module _shared/asaas-split-calculator
 */

import { SupabaseClient } from "./supabase-types.ts";
import { isVendorOwner } from "./platform-config.ts";

// ============================================
// TYPES
// ============================================

/**
 * Dados de split calculados
 */
export interface CalculatedSplitData {
  isOwner: boolean;
  hasAffiliate: boolean;
  affiliateId: string | null;
  affiliateUserId: string | null;
  affiliateWalletId: string | null;
  affiliateCommissionPercent: number;
  vendorWalletId: string | null;
}

interface OrderData {
  affiliate_id: string | null;
}

interface AffiliateData {
  user_id: string;
  commission_rate: number | null;
  product_id: string;
}

interface ProductAffiliateSettings {
  affiliate_settings?: {
    defaultRate?: number;
  } | null;
}

interface ProfileData {
  asaas_wallet_id: string | null;
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Calcula os dados de split para uma ordem no modelo Marketplace.
 * 
 * @param supabase - Cliente Supabase com service role
 * @param orderId - ID da ordem
 * @param vendorId - ID do vendedor
 * @returns Dados calculados para split
 */
export async function calculateMarketplaceSplitData(
  supabase: SupabaseClient,
  orderId: string,
  vendorId: string
): Promise<CalculatedSplitData> {
  console.log('[split-calculator] orderId:', orderId, 'vendorId:', vendorId);
  
  const result: CalculatedSplitData = {
    isOwner: false,
    hasAffiliate: false,
    affiliateId: null,
    affiliateUserId: null,
    affiliateWalletId: null,
    affiliateCommissionPercent: 0,
    vendorWalletId: null
  };

  // 1. Verificar se é Owner
  result.isOwner = await isVendorOwner(supabase, vendorId);
  console.log('[split-calculator] isOwner:', result.isOwner);

  // 2. Buscar ordem para verificar afiliado
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('affiliate_id')
    .eq('id', orderId)
    .single();
  
  if (orderError) {
    console.error('[split-calculator] Erro ao buscar ordem:', orderError);
    return result;
  }

  const order = orderData as OrderData | null;

  // 3. Se tem afiliado, buscar dados
  if (order?.affiliate_id) {
    result.hasAffiliate = true;
    result.affiliateId = order.affiliate_id;
    
    const { data: affiliateData } = await supabase
      .from('affiliates')
      .select('user_id, commission_rate, product_id')
      .eq('id', order.affiliate_id)
      .single();
    
    const affiliate = affiliateData as AffiliateData | null;
    
    if (affiliate) {
      result.affiliateUserId = affiliate.user_id;
      
      // ========================================
      // FIX: Se commission_rate é null, usar defaultRate do produto
      // ========================================
      let commissionRate = affiliate.commission_rate;
      
      if (commissionRate === null || commissionRate === undefined) {
        // Buscar defaultRate das configurações do produto
        const { data: productData } = await supabase
          .from('products')
          .select('affiliate_settings')
          .eq('id', affiliate.product_id)
          .single();
        
        const product = productData as ProductAffiliateSettings | null;
        const defaultRate = product?.affiliate_settings?.defaultRate;
        commissionRate = defaultRate ?? 0;
        
        console.log('[split-calculator] commission_rate NULL, usando defaultRate do produto:', commissionRate);
      }
      
      result.affiliateCommissionPercent = commissionRate;
      
      // Wallet do afiliado: buscar em profiles (fonte única de verdade)
      if (affiliate.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('asaas_wallet_id')
          .eq('id', affiliate.user_id)
          .single();
        
        const profile = profileData as ProfileData | null;
        if (profile?.asaas_wallet_id) {
          result.affiliateWalletId = profile.asaas_wallet_id;
        }
      }
      
      console.log('[split-calculator] Afiliado:', {
        id: result.affiliateId,
        userId: result.affiliateUserId,
        walletId: result.affiliateWalletId,
        commission: result.affiliateCommissionPercent
      });
    }
  }

  // 4. Se NÃO é Owner, buscar wallet do vendedor
  if (!result.isOwner) {
    const { data: vendorProfile } = await supabase
      .from('profiles')
      .select('asaas_wallet_id')
      .eq('id', vendorId)
      .single();
    
    const vendor = vendorProfile as ProfileData | null;
    result.vendorWalletId = vendor?.asaas_wallet_id || null;
    console.log('[split-calculator] Vendor wallet:', result.vendorWalletId);
  }

  return result;
}
