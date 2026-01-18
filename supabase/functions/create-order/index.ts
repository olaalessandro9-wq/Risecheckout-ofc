/**
 * create-order/index.ts - Orquestrador Principal
 * 
 * Responsabilidade ÚNICA: Orquestrar handlers modulares
 * 
 * SECURITY UPDATES:
 * - VULN-005: Validação de schema com validators.ts
 * - VULN-008: CORS com bloqueio de origens inválidas
 * 
 * Estrutura Modularizada (RISE V3):
 * - handlers/product-validator.ts (~110 linhas)
 * - handlers/bump-processor.ts (~140 linhas)
 * - handlers/coupon-processor.ts (~100 linhas)
 * - handlers/affiliate/index.ts (~290 linhas)
 * - handlers/affiliate/types.ts (~92 linhas)
 * - handlers/order-creator.ts (~180 linhas)
 * - index.ts (~260 linhas) ← VOCÊ ESTÁ AQUI
 * 
 * @version 2.1.0
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimitMiddleware, getIdentifier } from "../_shared/rate-limit.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { handleCors } from "../_shared/cors.ts";
import { validateCreateOrderInput, createValidationErrorResponse } from "../_shared/validators.ts";
import { validateProduct, type ProductValidationResult } from "./handlers/product-validator.ts";
import { processBumps, type BumpProcessingResult } from "./handlers/bump-processor.ts";
import { processCoupon } from "./handlers/coupon-processor.ts";
import { processAffiliate } from "./handlers/affiliate/index.ts";
import { createOrder } from "./handlers/order-creator.ts";
import { logSecurityEvent, SecurityAction } from "../_shared/audit-logger.ts";
import { maskEmail } from "../_shared/kernel/security/pii-masking.ts";

// === INTERFACES ===

interface ValidatedOrderData {
  product_id: string;
  offer_id?: string;
  checkout_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_cpf?: string;
  order_bump_ids?: string[];
  gateway?: string;
  payment_method?: string;
  coupon_id?: string;
  affiliate_code?: string;
}

interface ProductData {
  user_id: string;
  name: string | null;
  affiliate_settings: Record<string, unknown>;
}

// === MAIN HANDLER ===

serve(withSentry('create-order', async (req) => {
  // 0. SECURITY: Validação CORS com bloqueio de origens inválidas
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult; // Retorna 403 ou preflight response
  }
  const corsHeaders = corsResult.headers;

  // 1. Rate Limiting
  const identifier = getIdentifier(req, false);
  const rateLimitResponse = await rateLimitMiddleware(req, {
    maxAttempts: 10,
    windowMs: 5 * 60 * 1000,
    identifier,
    action: "create_order",
  });

  if (rateLimitResponse) {
    console.log(`[create-order] Rate limit excedido: ${identifier}`);
    return rateLimitResponse;
  }

  try {
    // 2. Setup Supabase
    const supabase: SupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 3. Parse Body
    let body: unknown;
    try {
      const text = await req.text();
      console.log("[create-order] Request recebida");
      body = JSON.parse(text);
    } catch (parseError: unknown) {
      const parseMessage = parseError instanceof Error ? parseError.message : String(parseError);
      console.error("[create-order] JSON inválido:", parseMessage);
      return new Response(
        JSON.stringify({ success: false, error: "Payload inválido: O corpo da requisição não é um JSON válido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. SECURITY: Validação de Schema (VULN-005)
    const validation = validateCreateOrderInput(body);
    if (!validation.success) {
      console.warn("[create-order] Validação falhou:", validation.errors);
      return createValidationErrorResponse(validation.errors || ["Dados inválidos"], corsHeaders);
    }

    const validatedData = validation.data as ValidatedOrderData;
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
      affiliate_code
    } = validatedData;

    console.log("[create-order] Processando:", {
      email: maskEmail(customer_email),
      product_id,
      bumps_count: order_bump_ids?.length || 0,
      affiliate_code: affiliate_code || "N/A"
    });

    // 4. VALIDAR PRODUTO/OFERTA/CHECKOUT
    const productResult = await validateProduct(supabase, { product_id, offer_id, checkout_id }, corsHeaders);
    if (productResult instanceof Response) return productResult;
    
    const { product, validatedOfferId, validatedCheckoutId, finalPrice, offerName } = productResult as ProductValidationResult;
    const productData = product as ProductData;
    const productName = offerName || productData.name || "Produto sem nome";

    // 5. PROCESSAR ORDER BUMPS
    const bumpResult = await processBumps(
      supabase,
      { product_id, product_name: productName, finalPrice, order_bump_ids, checkout_id },
      corsHeaders
    );
    if (bumpResult instanceof Response) return bumpResult;
    
    const { allOrderItems, totalAmount } = bumpResult as BumpProcessingResult;

    // 6. APLICAR CUPOM
    const { discountAmount, couponCode } = await processCoupon(supabase, {
      coupon_id,
      product_id,
      totalAmount,
      finalPrice
    });

    const finalTotal = totalAmount - discountAmount;
    const amountInCents = Math.round(finalTotal);

    // 7. PROCESSAR AFILIADO/SPLIT
    const affiliateResult = await processAffiliate(supabase, {
      product: {
        user_id: productData.user_id,
        affiliate_settings: productData.affiliate_settings || {}
      },
      product_id,
      affiliate_code,
      customer_email,
      amountInCents,
      discountAmount,
      totalAmount,
      allOrderItems
    });

    // 8. CRIAR PEDIDO
    const orderResult = await createOrder(
      supabase,
      {
        customer_name,
        customer_email,
        customer_phone,
        customer_cpf,
        product_id,
        product_name: productName,
        vendor_id: productData.user_id,
        validatedOfferId,
        validatedCheckoutId,
        amountInCents,
        discountAmount,
        coupon_id,
        couponCode,
        affiliateId: affiliateResult.affiliateId,
        commissionCents: affiliateResult.commissionCents,
        platformFeeCents: affiliateResult.platformFeeCents,
        gateway: gateway || 'pending',
        payment_method: payment_method || 'pending',
        allOrderItems,
        identifier
      },
      corsHeaders
    );

    if (orderResult instanceof Response) return orderResult;

    // 9. RETORNO SUCESSO
    console.log(`[create-order] ✅ Pedido criado: ${orderResult.order_id}`);
    
    // SECURITY: Log payment processing
    await logSecurityEvent(supabase, {
      userId: productData.user_id,
      action: SecurityAction.PROCESS_PAYMENT,
      resource: "orders",
      resourceId: orderResult.order_id,
      success: true,
      request: req,
      metadata: { 
        email: maskEmail(customer_email),
        amount_cents: amountInCents,
        gateway,
        payment_method,
        has_affiliate: !!affiliateResult.affiliateId
      }
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderResult.order_id,
        amount_cents: amountInCents,
        access_token: orderResult.access_token,
        message: "Pedido criado e split calculado.",
        splitData: affiliateResult.splitData
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[create-order] Erro Fatal:", errorMessage);
    
    // Enviar para Sentry manualmente (erros tratados)
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      functionName: 'create-order',
      url: req.url,
      method: req.method,
    });
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage || "Erro interno" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}));
