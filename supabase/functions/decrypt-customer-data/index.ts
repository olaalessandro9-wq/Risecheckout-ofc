/**
 * decrypt-customer-data - Descriptografa CPF/telefone para visualização
 * 
 * SECURITY:
 * - Requer autenticação (JWT)
 * - Auto-decrypt para o PRODUTOR do produto (product.user_id)
 * - Acesso via clique para o OWNER da plataforma
 * - Afiliados NÃO têm acesso (403)
 * - Log de auditoria para cada acesso com tipo (vendor/admin)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type UserRole = "owner" | "admin" | "user" | "seller";

/**
 * Obtém o role do usuário
 */
async function getUserRole(supabase: any, userId: string): Promise<UserRole> {
  const { data, error } = await supabase.rpc("get_user_role", {
    p_user_id: userId,
  });

  if (error) {
    console.error("[decrypt-customer-data] Erro ao buscar role:", error);
    return "user";
  }

  return (data as UserRole) || "user";
}

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("BUYER_ENCRYPTION_KEY");
    
    if (!encryptionKey) {
      throw new Error("BUYER_ENCRYPTION_KEY not configured");
    }

    // Autenticação
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "order_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar pedido COM dados do produto (para pegar o user_id do produto)
    const { data: order, error: orderError } = await supabase
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
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extrair product_owner_id
    const product = Array.isArray(order.product) ? order.product[0] : order.product;
    const productOwnerId = product?.user_id;

    // Verificar permissão de acesso
    const isProductOwner = user.id === productOwnerId;
    const userRole = await getUserRole(supabase, user.id);
    const isOwner = userRole === "owner";

    // Regra: Só PRODUTOR do produto ou OWNER da plataforma podem acessar
    if (!isProductOwner && !isOwner) {
      console.log(`[decrypt-customer-data] ACCESS DENIED: user=${user.id}, productOwner=${productOwnerId}, role=${userRole}`);
      
      // Log de tentativa de acesso negado
      await supabase.from("security_audit_log").insert({
        user_id: user.id,
        action: "DECRYPT_CUSTOMER_DATA_DENIED",
        resource: "orders",
        resource_id: order_id,
        success: false,
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
        metadata: { 
          reason: "not_product_owner_or_owner",
          user_role: userRole,
          product_owner_id: productOwnerId
        }
      });

      return new Response(
        JSON.stringify({ error: "Access denied: you don't have permission to view this data" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Descriptografar
    const key = await deriveKey(encryptionKey);
    const decryptedPhone = await decryptValue(order.customer_phone, key);
    const decryptedCpf = await decryptValue(order.customer_document, key);

    // Determinar tipo de acesso para auditoria
    const accessType = isProductOwner ? "vendor" : "admin";

    // Log de auditoria
    await supabase.from("security_audit_log").insert({
      user_id: user.id,
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
    });

    console.log(`[decrypt-customer-data] User ${user.id} (${accessType}) accessed order ${order_id}`);

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

  } catch (error: any) {
    console.error("[decrypt-customer-data] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
