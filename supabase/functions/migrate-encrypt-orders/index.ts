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
    // ========== AUTENTICAÇÃO JWT ADMIN ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[migrate-encrypt-orders] Acesso negado - token JWT ausente");
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente com token do usuário para validar claims
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validar JWT e extrair claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("[migrate-encrypt-orders] Token JWT inválido:", claimsError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log(`[migrate-encrypt-orders] Usuário autenticado: ${userId}`);

    // Verificar se é admin usando Service Role (para acessar RPC sem RLS)
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: isAdminUser, error: adminError } = await supabaseAdmin.rpc("is_admin", {
      p_user_id: userId
    });

    if (adminError) {
      console.error("[migrate-encrypt-orders] Erro ao verificar admin:", adminError);
      return new Response(
        JSON.stringify({ error: "Failed to verify admin status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isAdminUser) {
      console.error(`[migrate-encrypt-orders] Acesso negado - usuário ${userId} não é admin`);
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[migrate-encrypt-orders] Admin confirmado: ${userId}`);

    // ========== VALIDAÇÃO DA CHAVE DE CRIPTOGRAFIA ==========
    // Validar chave de criptografia
    const encryptionKey = Deno.env.get("BUYER_ENCRYPTION_KEY");
    if (!encryptionKey) {
      console.error("[migrate-encrypt-orders] BUYER_ENCRYPTION_KEY não configurada");
      return new Response(
        JSON.stringify({ error: "Encryption key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Usar supabaseAdmin (já declarado acima) para operações com service role
    const supabase = supabaseAdmin;

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

    // Log de auditoria com user_id do admin que executou
    await supabase.from("security_audit_log").insert({
      user_id: userId,
      action: "DATA_MIGRATION_ENCRYPT",
      resource: "orders",
      success: results.errors === 0,
      metadata: {
        total_checked: results.total_checked,
        migrated: results.migrated,
        already_encrypted: results.already_encrypted,
        errors: results.errors,
        executed_by: userId,
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
