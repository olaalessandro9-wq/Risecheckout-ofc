/**
 * decrypt-customer-data-batch - Descriptografa telefones em lote para listagem
 * 
 * SECURITY:
 * - Requer autenticação (JWT)
 * - SOMENTE para PRODUTOR do produto (product.user_id)
 * - Owner NÃO tem acesso aqui (deve usar modal individual)
 * - Limite máximo de 20 pedidos por request (anti-abuso)
 * - Log de auditoria para cada acesso
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ORDER_IDS = 20;

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("BUYER_ENCRYPTION_KEY");
    
    if (!encryptionKey) {
      console.error("[decrypt-batch] BUYER_ENCRYPTION_KEY not configured");
      throw new Error("BUYER_ENCRYPTION_KEY not configured");
    }

    // Autenticação - usar ANON_KEY para validar JWT do usuário
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("[decrypt-batch] No authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cliente para autenticação (ANON_KEY + Bearer do usuário)
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error("[decrypt-batch] Auth error:", authError?.message || "No user");
      return new Response(
        JSON.stringify({ error: "Invalid token", details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cliente admin para operações privilegiadas
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { order_ids, fields = ["customer_phone"] } = await req.json();
    
    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "order_ids array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limitar quantidade para evitar abuso
    if (order_ids.length > MAX_ORDER_IDS) {
      return new Response(
        JSON.stringify({ error: `Maximum ${MAX_ORDER_IDS} order_ids allowed` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[decrypt-batch] User ${user.id} requesting ${order_ids.length} orders`);

    // Buscar todos os pedidos de uma vez
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select(`
        id, 
        customer_phone, 
        customer_document,
        product:product_id (
          id,
          user_id
        )
      `)
      .in("id", order_ids);

    if (ordersError) {
      console.error("[decrypt-batch] Error fetching orders:", ordersError.message);
      throw new Error("Failed to fetch orders");
    }

    const key = await deriveKey(encryptionKey);
    const result: Record<string, { customer_phone?: string | null; customer_document?: string | null }> = {};
    const denied: string[] = [];
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip");

    // Processar cada pedido
    for (const order of orders || []) {
      const product = Array.isArray(order.product) ? order.product[0] : order.product;
      const productOwnerId = product?.user_id;
      
      // APENAS produtor tem acesso no batch (owner usa modal individual)
      const isProductOwner = user.id === productOwnerId;
      
      if (!isProductOwner) {
        denied.push(order.id);
        continue;
      }

      // Descriptografar campos solicitados
      const decrypted: { customer_phone?: string | null; customer_document?: string | null } = {};
      
      if (fields.includes("customer_phone") && order.customer_phone) {
        decrypted.customer_phone = await decryptValue(order.customer_phone, key);
      }
      
      if (fields.includes("customer_document") && order.customer_document) {
        decrypted.customer_document = await decryptValue(order.customer_document, key);
      }
      
      result[order.id] = decrypted;
    }

    // Log de auditoria (uma entrada por batch, não por pedido, para performance)
    const decryptedIds = Object.keys(result);
    if (decryptedIds.length > 0) {
      await supabaseAdmin.from("security_audit_log").insert({
        user_id: user.id,
        action: "DECRYPT_CUSTOMER_DATA_BATCH",
        resource: "orders",
        resource_id: decryptedIds[0], // Primeiro ID como referência
        success: true,
        ip_address: ipAddress,
        metadata: { 
          fields,
          order_count: decryptedIds.length,
          order_ids: decryptedIds,
          access_type: "vendor"
        }
      });
    }

    console.log(`[decrypt-batch] Decrypted ${decryptedIds.length} orders, denied ${denied.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        denied
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[decrypt-batch] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
