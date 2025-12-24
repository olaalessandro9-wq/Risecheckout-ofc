import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { rateLimitMiddleware, getIdentifier, recordAttempt } from "../_shared/rate-limit.ts";
import { 
  PLATFORM_FEE_PERCENT, 
  calculatePlatformFeeCents, 
  getVendorFeePercent,
  isVendorOwner,
  PLATFORM_OWNER_USER_ID
} from "../_shared/platform-config.ts";
// 🔒 SEGURANÇA 1: Lista de domínios permitidos
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://risecheckout.com",
  "https://www.risecheckout.com",
  "https://risecheckout-84776.lovable.app",
  "https://prime-checkout-hub.lovable.app"
];

const getCorsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
});

serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const corsHeaders = getCorsHeaders(origin);

  // 0. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 🔒 SEGURANÇA 2: Rate Limiting (10 pedidos por IP a cada 5 minutos)
  const identifier = getIdentifier(req, false); // Usar IP como identificador
  const rateLimitResponse = await rateLimitMiddleware(req, {
    maxAttempts: 10,
    windowMs: 5 * 60 * 1000, // 5 minutos
    identifier,
    action: 'create_order',
  });

  if (rateLimitResponse) {
    console.log(`🚫 [create-order] Rate limit excedido para ${identifier}`);
    return rateLimitResponse;
  }

  try {
    // 1. Setup Supabase (Service Role para ter permissão de admin)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. Parse e Log do Body
    let body;
    try {
        const text = await req.text();
        // Log de Raw Body removido por segurança (LGPD) - não logar dados sensíveis
        console.log("📥 [create-order] Request recebida");
        body = JSON.parse(text);
    } catch (e) {
        console.error("🚨 [create-order] Erro ao fazer parse do JSON:", e);
        throw new Error("Payload inválido: O corpo da requisição não é um JSON válido.");
    }

    const { 
      product_id, 
      offer_id, 
      checkout_id, 
      customer_name, 
      customer_email, 
      customer_phone, 
      customer_cpf, 
      order_bump_ids, 
      gateway,
      payment_method,
      coupon_id,
      affiliate_code // ✅ NOVO: Código de afiliado vindo do frontend
    } = body;

    // ✅ P1: Mascarar PII nos logs (LGPD compliance)
    const maskEmail = (email: string): string => {
      if (!email || !email.includes('@')) return '***@***';
      const [user, domain] = email.split('@');
      const maskedUser = user.length > 2 ? user.substring(0, 2) + '***' : '***';
      return `${maskedUser}@${domain}`;
    };

    console.log("📦 [create-order] Processando pedido:", { 
        email: maskEmail(customer_email), // ✅ PII mascarada
        product_id,
        bumps_count: order_bump_ids?.length || 0,
        affiliate_code: affiliate_code || 'N/A'
    });

    // ==========================================
    // 3. BUSCAR PRODUTO E OFERTA
    // ==========================================
    const { data: product, error: productError } = await supabaseClient
      .from("products")
      .select("id, price, name, user_id, affiliate_settings") // user_id é o Produtor
      .eq("id", product_id)
      .maybeSingle();

    if (productError || !product) {
        throw new Error("Produto principal não encontrado.");
    }

    let finalPrice = Number(product.price);
    let offerName = null;
    let validatedOfferId = null; 

    // ✅ P0-6: VALIDAR OFFER_ID (ownership + status)
    if (offer_id && offer_id !== product_id) {
        const { data: offer, error: offerError } = await supabaseClient
            .from("offers")
            .select("id, product_id, price, name, status")
            .eq("id", offer_id)
            .eq("product_id", product.id)  // ✅ VALIDAR OWNERSHIP!
            .eq("status", "active")         // ✅ VALIDAR STATUS!
            .maybeSingle();
        
        if (offerError || !offer) {
            console.error('[create-order] Invalid offer:', { offer_id, product_id: product.id });
            return new Response(
                JSON.stringify({ 
                    error: 'Invalid or inactive offer',
                    details: 'The selected offer is not available for this product'
                }),
                { 
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }
        
        console.log('[create-order] Using offer:', { 
            offer_id: offer.id, 
            name: offer.name,
            price: offer.price 
        });
        
        finalPrice = Number(offer.price);
        offerName = offer.name;
        validatedOfferId = offer.id;
    }

    const safeProductName = offerName || product.name || "Produto sem nome";

    // ==========================================
    // 4. PROCESSAR BUMPS
    // ==========================================
    let totalAmount = finalPrice;
    const allOrderItems = [];

    // Adicionar Produto Principal
    allOrderItems.push({
        product_id: product_id,
        product_name: safeProductName,
        amount_cents: Math.round(finalPrice),
        quantity: 1,
        is_bump: false
    });

    // ✅ P0-6: VALIDAR ORDER_BUMP_IDS (ownership + status)
    if (order_bump_ids && Array.isArray(order_bump_ids) && order_bump_ids.length > 0) {
      const { data: bumps, error: bumpsError } = await supabaseClient
        .from("order_bumps")
        .select("id, product_id, active, custom_title, discount_enabled, discount_price, offer_id")
        .in("id", order_bump_ids)
        .eq("checkout_id", checkout_id)
        .eq("active", true);
      
      if (bumpsError || !bumps || bumps.length !== order_bump_ids.length) {
        console.error('[create-order] Invalid order bumps:', { 
          requested: order_bump_ids.length,
          found: bumps?.length || 0
        });
        
        return new Response(
          JSON.stringify({ 
            error: 'Invalid order bumps',
            details: 'One or more selected order bumps are not available for this product'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      console.log('[create-order] Validated order bumps:', bumps.map(b => b.id));

      if (bumps) {
        for (const bump of bumps) {
            try {
                if (!bump.product_id) {
                    console.warn(`⚠️ [SKIP] Bump ignorado (ID: ${bump.id}): Sem produto vinculado.`);
                    continue; 
                }

                let bumpPriceCents = 0;
                let bumpName = bump.custom_title || "Order Bump";

                // ✅ PRIORIDADE 1: Buscar preço da OFFER vinculada (já em centavos)
                if (bump.offer_id) {
                    const { data: bumpOffer } = await supabaseClient
                        .from("offers")
                        .select("price, name")
                        .eq("id", bump.offer_id)
                        .maybeSingle();
                    
                    if (bumpOffer) {
                        bumpPriceCents = Number(bumpOffer.price); // offers.price já está em CENTAVOS
                        if (!bump.custom_title) bumpName = bumpOffer.name;
                        console.log(`✅ [Bump] Usando offer.price: ${bumpPriceCents} centavos (R$ ${(bumpPriceCents/100).toFixed(2)})`);
                    }
                }

                // ✅ PRIORIDADE 2: Fallback para PRODUCT (converter BRL → centavos)
                if (bumpPriceCents === 0) {
                    const { data: bumpProduct } = await supabaseClient
                        .from("products")
                        .select("price, name")
                        .eq("id", bump.product_id)
                        .maybeSingle();
                    
                    if (bumpProduct) {
                        bumpPriceCents = Math.round(Number(bumpProduct.price) * 100); // products.price em BRL → centavos
                        if (!bump.custom_title) bumpName = bumpProduct.name;
                        console.log(`⚠️ [Bump] Usando product.price: ${bumpPriceCents} centavos (R$ ${(bumpPriceCents/100).toFixed(2)})`);
                    } else {
                        console.warn(`⚠️ [SKIP] Bump ignorado (ID: ${bump.id}): Produto ${bump.product_id} não existe.`);
                        continue;
                    }
                }

                // ✅ PRIORIDADE 3: Override com discount_price (converter BRL → centavos)
                if (bump.discount_enabled && bump.discount_price) {
                    bumpPriceCents = Math.round(Number(bump.discount_price) * 100); // discount_price em BRL → centavos
                    console.log(`💰 [Bump] Usando discount_price: ${bumpPriceCents} centavos (R$ ${(bumpPriceCents/100).toFixed(2)})`);
                }

                totalAmount += bumpPriceCents;
                
                allOrderItems.push({
                    product_id: bump.product_id,
                    product_name: bumpName,
                    amount_cents: bumpPriceCents,
                    quantity: 1,
                    is_bump: true
                });

            } catch (e) {
                console.error(`🚨 Erro processando bump ${bump.id}:`, e);
            }
        }
      }
    }

    // ==========================================
    // 5. APLICAR CUPOM DE DESCONTO
    // ==========================================
    let discountAmount = 0;
    let couponCode = null;
    
    if (coupon_id) {
      console.log("🎫 [create-order] Validando cupom:", coupon_id);
      
      const { data: coupon, error: couponError } = await supabaseClient
        .from("coupons")
        .select("*")
        .eq("id", coupon_id)
        .eq("active", true)
        .maybeSingle();
      
      if (couponError || !coupon) {
        console.warn("⚠️ [create-order] Cupom inválido ou não encontrado:", coupon_id);
      } else {
        const { data: couponProduct } = await supabaseClient
          .from("coupon_products")
          .select("*")
          .eq("coupon_id", coupon.id)
          .eq("product_id", product_id)
          .maybeSingle();
        
        if (!couponProduct) {
          console.warn("⚠️ [create-order] Cupom não vinculado ao produto:", coupon_id);
        } else {
          const now = new Date();
          const validDate = (!coupon.start_date || new Date(coupon.start_date) < now) && 
                           (!coupon.expires_at || new Date(coupon.expires_at) > now);

          if (validDate) {
            // ✅ P0: INCREMENTO ATÔMICO com verificação de limite (race condition fix)
            // Usar UPDATE condicional ao invés de SELECT + UPDATE separados
            const { data: updatedCoupon, error: updateError } = await supabaseClient
              .from("coupons")
              .update({ 
                uses_count: (coupon.uses_count || 0) + 1,
                updated_at: new Date().toISOString()
              })
              .eq("id", coupon.id)
              .eq("active", true)
              .or(`max_uses.is.null,uses_count.lt.${coupon.max_uses || 999999}`)
              .select("id, code")
              .maybeSingle();

            if (!updatedCoupon) {
              console.warn("⚠️ [create-order] Cupom esgotado ou inválido (race condition prevenida):", coupon_id);
              // Cupom não será aplicado - continua sem desconto
            } else {
              const discountBase = coupon.apply_to_order_bumps ? totalAmount : finalPrice;
              
              if (coupon.discount_type === "percentage") {
                discountAmount = (discountBase * Number(coupon.discount_value)) / 100;
              } else {
                discountAmount = Number(coupon.discount_value);
              }
              
              discountAmount = Math.min(discountAmount, totalAmount);
              couponCode = coupon.code;
              
              console.log("✅ [create-order] Cupom aplicado (atômico):", {
                code: coupon.code,
                discount_amount: discountAmount
              });
            }
          }
        }
      }
    }
    
    // Total final com desconto
    const finalTotal = totalAmount - discountAmount;
    const amountInCents = Math.round(finalTotal);

    // ==========================================
    // 6. LÓGICA DE AFILIADOS (Split na Fonte) - MODELO CAKTO
    // ==========================================
    // 
    // MODELO CAKTO (proporcional):
    // 1. Taxa da plataforma é descontada do TOTAL primeiro
    // 2. Comissão do afiliado é calculada sobre o valor LÍQUIDO
    // 3. Produtor recebe o restante do líquido
    //
    // Exemplo R$100, taxa 4%, comissão 70%:
    //   - Taxa Plataforma: R$4,00
    //   - Líquido: R$96,00
    //   - Afiliado (70%): R$67,20
    //   - Produtor (30%): R$28,80
    // ==========================================
    
    let affiliateId = null;
    let commissionCents = 0;
    let affiliateWalletId: string | null = null;
    
    // ✅ Verificar se o vendedor é o Owner da plataforma
    const isOwner = await isVendorOwner(supabaseClient, product.user_id);
    
    // ✅ Verificar se há código de afiliado E programa habilitado
    // Isso é necessário para determinar se devemos aplicar taxa de plataforma
    const affiliateSettings = (product.affiliate_settings as any) || {};
    const affiliateProgramEnabled = affiliateSettings.enabled || false;
    const hasActiveAffiliate = !!affiliate_code && affiliateProgramEnabled;
    
    // ✅ Taxa da plataforma dinâmica por vendedor
    // REGRAS DE TAXA PARA OWNER:
    // - Owner vendendo DIRETO (sem afiliado) → Taxa 0% (não faz sentido cobrar de si mesmo)
    // - Owner vendendo COM afiliado → Taxa normal (4%) para calcular split correto
    //   A taxa "volta" para o Owner, mas precisa ser calculada para o afiliado pagar sua parte
    // - Vendedor comum → Taxa normal sempre
    const vendorFeePercent = await getVendorFeePercent(supabaseClient, product.user_id);
    
    let platformFeeCents: number;
    let netAmountCents: number;
    
    if (isOwner && !hasActiveAffiliate) {
      // 🏠 OWNER vendendo DIRETO: Taxa ZERO (100% fica com Owner)
      platformFeeCents = 0;
      netAmountCents = amountInCents;
      console.log(`🏠 [Split OWNER] Venda DIRETA - Taxa 0% (não há afiliado)`);
      console.log(`🏠 [Split OWNER] Owner recebe 100%: R$ ${(amountInCents/100).toFixed(2)}`);
    } else if (isOwner && hasActiveAffiliate) {
      // 🏠 OWNER vendendo COM AFILIADO: Taxa calculada para split correto
      // A taxa "retorna" ao Owner, mas afeta o cálculo da comissão do afiliado
      platformFeeCents = calculatePlatformFeeCents(amountInCents, vendorFeePercent);
      netAmountCents = amountInCents - platformFeeCents;
      console.log(`🏠 [Split OWNER+AFILIADO] Taxa ${vendorFeePercent * 100}%: R$ ${(platformFeeCents/100).toFixed(2)}`);
      console.log(`🏠 [Split OWNER+AFILIADO] Taxa retorna ao Owner, mas calcula split do afiliado`);
      console.log(`🏠 [Split OWNER+AFILIADO] Líquido para split: R$ ${(netAmountCents/100).toFixed(2)}`);
    } else {
      // 🏦 VENDEDOR COMUM: Taxa normal
      platformFeeCents = calculatePlatformFeeCents(amountInCents, vendorFeePercent);
      netAmountCents = amountInCents - platformFeeCents;
      console.log(`🏦 [Split] Taxa Plataforma: ${platformFeeCents} centavos (${vendorFeePercent * 100}% - ${vendorFeePercent !== PLATFORM_FEE_PERCENT ? 'PERSONALIZADA' : 'padrão'})`);
      console.log(`💰 [Split] Valor Líquido: ${netAmountCents} centavos (R$ ${(netAmountCents/100).toFixed(2)})`);
    }

    // ✅ Configurações de afiliados já carregadas acima (linha 364)
    // affiliateSettings, affiliateProgramEnabled já definidos
    let defaultRate = affiliateSettings.defaultRate || 50;
    const requireApproval = affiliateSettings.requireApproval || false;

    // 🔒 SEGURANÇA: Limite máximo de comissão (previne configurações maliciosas de 99%+)
    const MAX_COMMISSION_RATE = 90;
    if (defaultRate > MAX_COMMISSION_RATE) {
        console.warn(`⚠️ [Afiliado] Taxa padrão ${defaultRate}% excede limite. Limitando a ${MAX_COMMISSION_RATE}%`);
        defaultRate = MAX_COMMISSION_RATE;
    }

    console.log(`🎯 [Afiliado] Programa ativo: ${affiliateProgramEnabled}, Taxa padrão: ${defaultRate}%`);

    if (affiliate_code && affiliateProgramEnabled) {
        console.log(`🔍 [Afiliado] Buscando código: ${affiliate_code}`);
        
        // Buscar afiliação com asaas_wallet_id
        const { data: affiliate } = await supabaseClient
            .from("affiliates")
            .select("id, user_id, commission_rate, status, asaas_wallet_id")
            .eq("affiliate_code", affiliate_code)
            .eq("product_id", product_id) // Afiliado DESTE produto
            .maybeSingle();

        // Se afiliado não tem wallet_id próprio, buscar do profile
        let affiliateWalletFromProfile: string | null = null;
        if (affiliate && !affiliate.asaas_wallet_id) {
            const { data: affiliateProfile } = await supabaseClient
                .from("profiles")
                .select("asaas_wallet_id")
                .eq("id", affiliate.user_id)
                .maybeSingle();
            
            affiliateWalletFromProfile = affiliateProfile?.asaas_wallet_id || null;
        }

        if (affiliate) {
            // ✅ Verificar status e aprovação
            if (requireApproval && affiliate.status !== 'active') {
                console.warn(`⚠️ [Afiliado] Aguardando aprovação: ${affiliate_code}`);
            } else if (affiliate.status === 'active') {
                // Capturar walletId do afiliado (prioridade: affiliates.asaas_wallet_id → profiles.asaas_wallet_id)
                affiliateWalletId = affiliate.asaas_wallet_id || affiliateWalletFromProfile;
                
                if (affiliateWalletId) {
                    console.log(`✅ [Afiliado] Wallet ID encontrado: ${affiliateWalletId.substring(0, 10)}...`);
                } else {
                    console.warn(`⚠️ [Afiliado] Sem Wallet ID configurado - Split NÃO será aplicado`);
                }
                
                // 🚨 SEGURANÇA: Anti-Self-Referral (PII mascarada nos logs)
                const { data: affiliateUserData } = await supabaseClient.auth.admin.getUserById(affiliate.user_id);
                const affiliateEmail = affiliateUserData?.user?.email?.toLowerCase();
                const isSelfReferral = affiliateEmail === customer_email.toLowerCase();

                if (isSelfReferral) {
                    console.warn(`🚫 [Afiliado] Auto-indicação detectada para ${maskEmail(customer_email)}. Comissão zerada.`);
                } else {
                    // 💰 MODELO CAKTO: Comissão sobre valor LÍQUIDO (após taxa da plataforma)
                    affiliateId = affiliate.id;
                    
                    // 1. Definição das Regras de Comissão (com fallback para retrocompatibilidade)
                    const rules = {
                        mainProduct: true, // Produto principal sempre gera comissão
                        orderBump: affiliateSettings.commissionOnOrderBump ?? affiliateSettings.allowUpsells ?? false,
                        upsell: affiliateSettings.commissionOnUpsell ?? affiliateSettings.allowUpsells ?? false
                    };
                    
                    console.log(`📊 [Afiliado] Regras: Bump=${rules.orderBump}, Upsell=${rules.upsell}`);
                    
                    // 2. Calcular proporção de itens comissionáveis vs total
                    let commissionableGrossAmount = 0;
                    
                    for (const item of allOrderItems) {
                        let isCommissionable = false;
                        
                        if (!item.is_bump) {
                            isCommissionable = rules.mainProduct;
                        } else {
                            isCommissionable = rules.orderBump;
                        }
                        
                        if (isCommissionable) {
                            commissionableGrossAmount += item.amount_cents;
                        }
                    }
                    
                    // 3. Subtrair descontos proporcionais 
                    if (discountAmount > 0 && commissionableGrossAmount > 0) {
                        const discountRatio = discountAmount / totalAmount;
                        commissionableGrossAmount -= Math.round(commissionableGrossAmount * discountRatio);
                    }
                    
                    // 4. MODELO CAKTO: Aplicar proporção ao valor LÍQUIDO (após taxa da plataforma)
                    // Se 80% do pedido é comissionável, 80% do líquido é a base de comissão
                    const commissionableRatio = amountInCents > 0 ? commissionableGrossAmount / amountInCents : 0;
                    const commissionableNetAmount = Math.round(netAmountCents * commissionableRatio);
                    
                    // 5. Calcular Comissão Final sobre o LÍQUIDO
                    // 🔒 SEGURANÇA: Limitar comissão individual também
                    let commissionRate = affiliate.commission_rate ?? defaultRate ?? 50;
                    if (commissionRate > MAX_COMMISSION_RATE) {
                        console.warn(`⚠️ [Afiliado] Taxa individual ${commissionRate}% excede limite. Limitando a ${MAX_COMMISSION_RATE}%`);
                        commissionRate = MAX_COMMISSION_RATE;
                    }
                    commissionCents = Math.round(commissionableNetAmount * (commissionRate / 100));
                    
                    console.log(`📊 [Afiliado] MODELO CAKTO:`);
                    console.log(`   - Valor Bruto Comissionável: R$ ${(commissionableGrossAmount/100).toFixed(2)}`);
                    console.log(`   - Taxa Plataforma: R$ ${(platformFeeCents/100).toFixed(2)} (${PLATFORM_FEE_PERCENT * 100}%)`);
                    console.log(`   - Valor Líquido Comissionável: R$ ${(commissionableNetAmount/100).toFixed(2)}`);
                    console.log(`   - Comissão (${commissionRate}%): R$ ${(commissionCents/100).toFixed(2)}`);
                    console.log(`   - Produtor recebe: R$ ${((netAmountCents - commissionCents)/100).toFixed(2)}`);
                }
            } else {
                console.warn(`⚠️ [Afiliado] Status inválido: ${affiliate.status}`);
            }
        } else {
            console.warn(`⚠️ [Afiliado] Código não encontrado: ${affiliate_code}`);
        }
    } else if (affiliate_code && !affiliateProgramEnabled) {
        console.warn(`🚫 [Afiliado] Programa de afiliados desativado para este produto.`);
    }

    // ==========================================
    // 7. CRIAR PEDIDO (Com dados do Split)
    // ==========================================
    
    // 🔒 SEGURANÇA 3: Idempotência - Prevenir pedidos duplicados
    // Verificar se já existe pedido idêntico nos últimos 5 minutos
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: existingOrders } = await supabaseClient
      .from("orders")
      .select("id, status, created_at")
      .eq("customer_email", customer_email)
      .eq("offer_id", validatedOfferId || product_id)
      .eq("amount_cents", Math.round(finalTotal))
      .gte("created_at", fiveMinutesAgo)
      .limit(1);

    if (existingOrders && existingOrders.length > 0) {
      const existing = existingOrders[0];
      console.log(`⚠️ [create-order] Pedido duplicado detectado: ${existing.id}`);
      
      // Registrar tentativa (para rate limiting)
      await recordAttempt(supabaseClient, {
        identifier,
        action: 'create_order',
        maxAttempts: 10,
        windowMs: 5 * 60 * 1000
      }, false); // false = tentativa falhada
      
      return new Response(
        JSON.stringify({ 
          success: true, // Retornar sucesso para não confundir o cliente
          order_id: existing.id,
          message: 'Pedido já existe',
          duplicate: true
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const accessToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        checkout_id,
        product_id,
        offer_id: validatedOfferId,
        amount_cents: amountInCents,
        status: "pending",
        customer_name,
        customer_email,
        customer_phone,
        customer_document: customer_cpf,
        payment_method: payment_method || 'pix',
        gateway: gateway || 'pushinpay',
        product_name: safeProductName,
        vendor_id: product.user_id,
        coupon_id: coupon_id || null,
        coupon_code: couponCode,
        discount_amount_cents: Math.round(discountAmount),
        access_token: accessToken,
        
        // ✅ NOVAS COLUNAS DO SPLIT
        // REGRAS DE TAXA PARA OWNER:
        // - Owner DIRETO (sem afiliado): platform_fee_cents = 0 (não há taxa)
        // - Owner COM AFILIADO: platform_fee_cents = taxa calculada (para registro e split correto)
        // - Vendedor comum: platform_fee_cents = taxa calculada (vai para plataforma)
        affiliate_id: affiliateId,
        commission_cents: commissionCents,
        platform_fee_cents: platformFeeCents // ✅ Já calculado corretamente acima (0 se Owner direto)
      })
      .select()
      .single();

    if (orderError) {
        console.error("🚨 Erro ao criar order:", orderError);
        throw orderError;
    }

    // 8. Salvar Itens
    const itemsToInsert = allOrderItems.map(item => ({
        ...item,
        order_id: order.id
    }));
    
    await supabaseClient.from("order_items").insert(itemsToInsert);

    // 9. Atualizar contador de vendas do afiliado (UPDATE ATÔMICO - Race Condition Fix)
    // ✅ FIX: Usar await síncrono para garantir atomicidade e ordem de operações
    // Antes: SELECT + UPDATE assíncronos (fire & forget) - vulnerável a race conditions
    // Agora: await síncrono com fallback seguro
    if (affiliateId) {
        console.log(`📊 [Afiliado] Atualizando contadores para ${affiliateId}`);
        
        try {
          // Tentar usar RPC atômico primeiro (se existir)
          const { error: rpcError } = await supabaseClient.rpc('increment_affiliate_sales', {
            p_affiliate_id: affiliateId,
            p_amount_cents: amountInCents
          });

          if (rpcError) {
            // Fallback: UPDATE síncrono (melhor que fire & forget)
            console.log(`⚠️ [Afiliado] RPC não disponível, usando UPDATE síncrono`);
            
            const { data: current } = await supabaseClient
              .from("affiliates")
              .select("total_sales_count, total_sales_amount")
              .eq("id", affiliateId)
              .single();
            
            if (current) {
              const { error: updateError } = await supabaseClient
                .from("affiliates")
                .update({ 
                  total_sales_count: (current.total_sales_count || 0) + 1,
                  total_sales_amount: (current.total_sales_amount || 0) + amountInCents,
                  updated_at: new Date().toISOString()
                })
                .eq("id", affiliateId);

              if (updateError) {
                console.error("🚨 [Afiliado] Erro ao atualizar vendas:", updateError);
              } else {
                console.log(`✅ [Afiliado] Contadores atualizados: +1 venda, +R$${(amountInCents/100).toFixed(2)}`);
              }
            }
          } else {
            console.log(`✅ [Afiliado] Contadores atualizados via RPC atômico`);
          }
        } catch (err) {
          console.error("🚨 [Afiliado] Erro inesperado ao atualizar contadores:", err);
        }
    }

    // 10. Retorno Sucesso com dados de Split para o Gateway
    return new Response(
      JSON.stringify({ 
          success: true, 
          order_id: order.id, 
          amount_cents: amountInCents,
          access_token: accessToken,
          message: "Pedido criado e split calculado.",
          // ✅ DADOS DE SPLIT para o Gateway (Asaas)
          splitData: {
            platformFeeCents: platformFeeCents,
            affiliateWalletId: affiliateWalletId,
            affiliateCommissionCents: commissionCents,
            // O vendedor recebe o restante automaticamente (não precisa de walletId no split)
          }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("🔥 [create-order] Erro Fatal:", error);
    const origin = req.headers.get("origin") || "";
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );
  }
});
