/**
 * decrypt-customer-data - Descriptografa CPF/telefone para visualização
 * 
 * SECURITY:
 * - Requer autenticação via X-Producer-Session-Token (unified-auth)
 * - Auto-decrypt para o PRODUTOR do produto (product.user_id)
 * - Acesso via clique para o OWNER da plataforma
 * - Afiliados NÃO têm acesso (403)
 * - Log de auditoria para cada acesso com tipo (vendor/admin)
 * 
 * @version 3.0.0 - RISE Protocol V3 - Migrated to unified-auth
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from "../_shared/rate-limiting/index.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// === INTERFACES (Zero any) ===

interface RequestBody {
  order_id: string;
}

interface ProductRecord {
  id: string;
  user_id: string;
}

interface OrderRecord {
  id: string;
  vendor_id: string;
  customer_phone: string | null;
  customer_document: string | null;
  product: ProductRecord | ProductRecord[] | null;
}

interface SecurityAuditEntry {
  user_id: string;
  action: string;
  resource: string;
  resource_id: string;
  success: boolean;
  ip_address: string | null;
  metadata: Record<string, unknown>;
}

// === HELPER FUNCTIONS ===

/**
 * Deriva uma chave AES-256 a partir da BUYER_ENCRYPTION_KEY
 */
async function deriveKey(keyMaterial: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
  
  return crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

/**
 * Descriptografa um valor
 */
async function decryptValue(encrypted: string, key: CryptoKey): Promise<string | null> {
  if (!encrypted || encrypted.trim() === "") return null;
  
  try {
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  } catch {
    // Pode ser dado legado não criptografado
    return encrypted;
  }
}

// === MAIN HANDLER ===

serve(async (req) => {
  // SECURITY: Validar CORS no início
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult; // Retorna 403 ou preflight OK
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("BUYER_ENCRYPTION_KEY");
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Rate limiting para dados sensíveis
    const rateLimitResult = await rateLimitMiddleware(
      supabaseAdmin,
      req,
      RATE_LIMIT_CONFIGS.DECRYPT_DATA,
      corsHeaders
    );
    if (rateLimitResult) {
      console.warn(`[decrypt-customer-data] Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }
    
    if (!encryptionKey) {
      console.error("[decrypt-customer-data] BUYER_ENCRYPTION_KEY not configured");
      throw new Error("BUYER_ENCRYPTION_KEY not configured");
    }

    // AUTENTICAÇÃO via unified-auth (X-Producer-Session-Token)
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabaseAdmin, req);
    } catch {
      console.error("[decrypt-customer-data] Authentication failed");
      return unauthorizedResponse(corsHeaders);
    }

    const body: RequestBody = await req.json();
    const { order_id } = body;
    
    if (!order_id) {
      console.error("[decrypt-customer-data] Missing order_id");
      return new Response(
        JSON.stringify({ error: "order_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[decrypt-customer-data] Producer ${producer.id} requesting order ${order_id}`);

    // Buscar pedido COM dados do produto (para pegar o user_id do produto)
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(`
        id, 
        vendor_id, 
        customer_phone, 
        customer_document,
        product:product_id (
          id,
          user_id
        )
      `)
      .eq("id", order_id)
      .single() as { data: OrderRecord | null; error: Error | null };

    if (orderError || !order) {
      console.error("[decrypt-customer-data] Order not found:", order_id, orderError?.message);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extrair product_owner_id
    const product = Array.isArray(order.product) ? order.product[0] : order.product;
    const productOwnerId = product?.user_id;

    // Verificar permissão de acesso
    const isProductOwner = producer.id === productOwnerId;
    const isOwner = producer.role === "owner";

    console.log(`[decrypt-customer-data] Access check: producer=${producer.id}, productOwner=${productOwnerId}, isProductOwner=${isProductOwner}, role=${producer.role}, isOwner=${isOwner}`);

    // Regra: Só PRODUTOR do produto ou OWNER da plataforma podem acessar
    if (!isProductOwner && !isOwner) {
      console.log(`[decrypt-customer-data] ACCESS DENIED: producer=${producer.id}, productOwner=${productOwnerId}, role=${producer.role}`);
      
      // Log de tentativa de acesso negado
      const auditEntry: SecurityAuditEntry = {
        user_id: producer.id,
        action: "DECRYPT_CUSTOMER_DATA_DENIED",
        resource: "orders",
        resource_id: order_id,
        success: false,
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
        metadata: { 
          reason: "not_product_owner_or_owner",
          user_role: producer.role,
          product_owner_id: productOwnerId
        }
      };
      await supabaseAdmin.from("security_audit_log").insert(auditEntry);

      return new Response(
        JSON.stringify({ error: "Access denied: you don't have permission to view this data" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Descriptografar
    const key = await deriveKey(encryptionKey);
    const decryptedPhone = await decryptValue(order.customer_phone || '', key);
    const decryptedCpf = await decryptValue(order.customer_document || '', key);

    // Determinar tipo de acesso para auditoria
    const accessType = isProductOwner ? "vendor" : "admin";

    // Log de auditoria
    const successAudit: SecurityAuditEntry = {
      user_id: producer.id,
      action: "DECRYPT_CUSTOMER_DATA",
      resource: "orders",
      resource_id: order_id,
      success: true,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
      metadata: { 
        fields: ["customer_phone", "customer_document"],
        access_type: accessType,
        product_owner_id: productOwnerId
      }
    };
    await supabaseAdmin.from("security_audit_log").insert(successAudit);

    console.log(`[decrypt-customer-data] Producer ${producer.id} (${accessType}) accessed order ${order_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          customer_phone: decryptedPhone,
          customer_document: decryptedCpf
        },
        access_type: accessType
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[decrypt-customer-data] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
