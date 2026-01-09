import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

/**
 * Deriva chave AES-256 a partir da BUYER_ENCRYPTION_KEY
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
    ["encrypt", "decrypt"]
  );
}

/**
 * Criptografa um valor usando AES-256-GCM
 */
async function encryptValue(plaintext: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Verifica se um valor parece estar criptografado (base64 válido com tamanho mínimo)
 */
function isEncrypted(value: string | null | undefined): boolean {
  if (!value || value.trim() === "") return false;
  
  try {
    const decoded = atob(value);
    // IV (12 bytes) + pelo menos algum dado criptografado
    return decoded.length > 12;
  } catch {
    return false;
  }
}

/**
 * Verifica se parece um CPF/telefone em texto plano
 */
function isPlaintext(value: string | null | undefined): boolean {
  if (!value || value.trim() === "") return false;
  
  // CPF: 11 dígitos ou formatado (xxx.xxx.xxx-xx)
  const cpfPattern = /^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  
  // Telefone: padrões brasileiros comuns
  const phonePattern = /^\(?\d{2}\)?[\s-]?\d{4,5}[-]?\d{4}$|^\d{10,11}$/;
  
  return cpfPattern.test(value) || phonePattern.test(value);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[migrate-encrypt-orders] Iniciando migração de dados sensíveis");

  try {
    // Validar secret interno (apenas admin pode executar)
    const internalSecret = req.headers.get("x-internal-secret");
    const expectedSecret = Deno.env.get("INTERNAL_WEBHOOK_SECRET");
    
    if (!internalSecret || internalSecret !== expectedSecret) {
      console.error("[migrate-encrypt-orders] Acesso negado - secret inválido");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar chave de criptografia
    const encryptionKey = Deno.env.get("BUYER_ENCRYPTION_KEY");
    if (!encryptionKey) {
      console.error("[migrate-encrypt-orders] BUYER_ENCRYPTION_KEY não configurada");
      return new Response(
        JSON.stringify({ error: "Encryption key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Derivar chave de criptografia
    const key = await deriveKey(encryptionKey);

    // Buscar todos os pedidos com telefone ou documento
    const { data: orders, error: fetchError } = await supabase
      .from("orders")
      .select("id, customer_phone, customer_document")
      .or("customer_phone.not.is.null,customer_document.not.is.null");

    if (fetchError) {
      console.error("[migrate-encrypt-orders] Erro ao buscar pedidos:", fetchError);
      throw fetchError;
    }

    console.log(`[migrate-encrypt-orders] Encontrados ${orders?.length || 0} pedidos para verificar`);

    const results = {
      total_checked: orders?.length || 0,
      migrated: 0,
      already_encrypted: 0,
      errors: 0,
      details: [] as Array<{
        order_id: string;
        phone_action: string;
        document_action: string;
      }>
    };

    for (const order of orders || []) {
      try {
        const phoneNeedsEncryption = order.customer_phone && 
          !isEncrypted(order.customer_phone) && 
          isPlaintext(order.customer_phone);
          
        const docNeedsEncryption = order.customer_document && 
          !isEncrypted(order.customer_document) && 
          isPlaintext(order.customer_document);

        // Se ambos já estão criptografados ou vazios, pular
        if (!phoneNeedsEncryption && !docNeedsEncryption) {
          results.already_encrypted++;
          results.details.push({
            order_id: order.id,
            phone_action: order.customer_phone ? "already_encrypted" : "empty",
            document_action: order.customer_document ? "already_encrypted" : "empty"
          });
          continue;
        }

        // Preparar dados para atualização
        const updateData: Record<string, string | null> = {};

        if (phoneNeedsEncryption) {
          updateData.customer_phone = await encryptValue(order.customer_phone, key);
          console.log(`[migrate-encrypt-orders] Pedido ${order.id}: telefone criptografado`);
        }

        if (docNeedsEncryption) {
          updateData.customer_document = await encryptValue(order.customer_document, key);
          console.log(`[migrate-encrypt-orders] Pedido ${order.id}: documento criptografado`);
        }

        // Atualizar pedido
        const { error: updateError } = await supabase
          .from("orders")
          .update(updateData)
          .eq("id", order.id);

        if (updateError) {
          console.error(`[migrate-encrypt-orders] Erro ao atualizar pedido ${order.id}:`, updateError);
          results.errors++;
          results.details.push({
            order_id: order.id,
            phone_action: "error",
            document_action: "error"
          });
        } else {
          results.migrated++;
          results.details.push({
            order_id: order.id,
            phone_action: phoneNeedsEncryption ? "migrated" : "skipped",
            document_action: docNeedsEncryption ? "migrated" : "skipped"
          });
        }
      } catch (orderError) {
        console.error(`[migrate-encrypt-orders] Erro no pedido ${order.id}:`, orderError);
        results.errors++;
      }
    }

    // Log de auditoria
    await supabase.from("security_audit_log").insert({
      user_id: null,
      action: "DATA_MIGRATION_ENCRYPT",
      resource: "orders",
      success: results.errors === 0,
      metadata: {
        total_checked: results.total_checked,
        migrated: results.migrated,
        already_encrypted: results.already_encrypted,
        errors: results.errors,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`[migrate-encrypt-orders] Migração concluída: ${results.migrated} migrados, ${results.already_encrypted} já criptografados, ${results.errors} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total_orders_checked: results.total_checked,
          migrated: results.migrated,
          already_encrypted: results.already_encrypted,
          errors: results.errors
        },
        details: results.details
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[migrate-encrypt-orders] Erro fatal:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
