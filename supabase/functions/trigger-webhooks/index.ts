/**
 * ============================================================================
 * TRIGGER-WEBHOOKS EDGE FUNCTION
 * ============================================================================
 * 
 * Versão: 472
 * Última Atualização: 2025-12-12
 * Status: ✅ Funcionando
 * 
 * ============================================================================
 * IMPORTANTE - LEIA ANTES DE MODIFICAR
 * ============================================================================
 * 
 * Esta função é chamada INTERNAMENTE pelo trigger PostgreSQL `order_webhooks_trigger`
 * via `pg_net.http_post`. NÃO é um endpoint público.
 * 
 * ============================================================================
 * CONFIGURAÇÃO CRÍTICA - verify_jwt = false
 * ============================================================================
 * 
 * O arquivo supabase/config.toml DEVE conter:
 * 
 *   [functions.trigger-webhooks]
 *   verify_jwt = false
 * 
 * POR QUE?
 * - O pg_net.http_post (usado pelo trigger PostgreSQL) NÃO consegue enviar
 *   headers de autenticação JWT válidos
 * - Se verify_jwt = true, o Supabase Gateway retorna 401 ANTES de chegar aqui
 * - Isso NÃO compromete segurança porque:
 *   1. A função só processa order_ids que EXISTEM no banco
 *   2. Só o trigger PostgreSQL (interno) chama esta função
 *   3. Webhooks de SAÍDA são assinados com HMAC-SHA256
 * 
 * ============================================================================
 * TROUBLESHOOTING RÁPIDO
 * ============================================================================
 * 
 * PROBLEMA: Webhooks não disparam
 * 
 * 1. Verificar versão nos logs:
 *    - Se não aparecer "Versão 472 iniciada", função não foi reimplantada
 *    - Solução: Incrementar FUNCTION_VERSION e fazer redeploy
 * 
 * 2. Verificar config.toml:
 *    - verify_jwt DEVE ser false
 *    - Se true ou ausente: erro 401 no gateway
 * 
 * 3. Verificar trigger PostgreSQL:
 *    - SELECT tgname FROM pg_trigger WHERE tgname = 'order_webhooks_trigger';
 *    - Se não existir: reinstalar via migração SQL
 * 
 * 4. Verificar app_settings:
 *    - supabase_url e service_role_key devem existir e estar corretos
 * 
 * Para documentação completa, veja: WEBHOOKS_ARCHITECTURE.md
 * 
 * ============================================================================
 * HISTÓRICO DE CORREÇÕES
 * ============================================================================
 * 
 * v472 (2025-12-12): Removida validação de auth interna - pg_net não envia
 *                    headers compatíveis. verify_jwt=false no config.toml
 *                    é suficiente para segurança.
 * 
 * v471 (2025-12-12): Tentativa de forçar redeploy com verify_jwt=false
 * 
 * v470 (anterior):   Tinha validação de authHeader que falhava com pg_net
 * 
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Versão da função - SEMPRE incrementar ao fazer mudanças significativas
const FUNCTION_VERSION = "472";

// ========================================================================
// CONFIGURATION & CONSTANTS
// ========================================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Timeout para requisições de webhook externas (30 segundos)
const DISPATCH_TIMEOUT = 30000;

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

function logInfo(message: string, data?: any) {
  console.log(`[trigger-webhooks] [INFO] ${message}`, data ? JSON.stringify(data) : '');
}

function logError(message: string, error?: any) {
  console.error(`[trigger-webhooks] [ERROR] ${message}`, error);
}

function normalizeUUID(uuid: string | null | undefined): string {
  return uuid ? uuid.toLowerCase().trim() : "";
}

// ========================================================================
// HMAC SIGNATURE GENERATION (Security Enhancement)
// ========================================================================

async function generateHmacSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ========================================================================
// 🔒 SSRF PROTECTION - URL VALIDATION
// ========================================================================

/**
 * Valida se uma URL é segura para envio de webhook
 * Bloqueia: IPs privados, localhost, metadata endpoints, non-HTTPS
 */
function isUrlSafe(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    
    // 1. Exigir HTTPS em produção
    if (url.protocol !== 'https:') {
      logError(`URL rejeitada: protocolo não-HTTPS`, { url: urlString });
      return false;
    }
    
    // 2. Bloquear IPs privados/reservados e hostnames perigosos
    const hostname = url.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,                           // Loopback IPv4
      /^10\./,                            // Private Class A
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private Class B
      /^192\.168\./,                      // Private Class C
      /^169\.254\./,                      // AWS/Cloud metadata
      /^0\./,                             // Invalid
      /^\[::1\]$/,                        // IPv6 localhost
      /^\[fc/i,                           // IPv6 private
      /^\[fd/i,                           // IPv6 private
      /^\[fe80:/i,                        // IPv6 link-local
      /^metadata\./i,                     // Cloud metadata
      /^internal\./i,                     // Internal services
    ];
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        logError(`URL rejeitada: hostname bloqueado`, { url: urlString, hostname });
        return false;
      }
    }
    
    // 3. Bloquear portas sensíveis (apenas 443 permitida para HTTPS)
    if (url.port && url.port !== '443' && url.port !== '') {
      logError(`URL rejeitada: porta não-padrão`, { url: urlString, port: url.port });
      return false;
    }
    
    return true;
  } catch (error) {
    logError(`URL rejeitada: formato inválido`, { url: urlString, error });
    return false;
  }
}

// 🚀 FUNÇÃO DE ENVIO DIRETO (Direct Delivery with HMAC)
async function sendToExternalWebhook(
  webhook: any,
  payload: any,
  productId: string,
  productName: string
): Promise<any> {
  // ✅ P0: VALIDAÇÃO SSRF ANTES DO FETCH
  if (!isUrlSafe(webhook.url)) {
    logError(`SSRF Protection: URL bloqueada`, { webhook_id: webhook.id, url: webhook.url });
    return {
      success: false,
      status: 0,
      body: null,
      error: 'URL blocked by SSRF protection'
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DISPATCH_TIMEOUT);

  try {
    logInfo(`📡 Enviando para: ${webhook.url}`, { webhook_id: webhook.id });

    const payloadString = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    
    // ✅ SEGURANÇA: Usar secret_encrypted (migrado de secret plaintext)
    const webhookSecret = webhook.secret_encrypted || webhook.secret;
    if (!webhookSecret || webhookSecret.trim() === '') {
      logError(`Webhook ${webhook.id} sem secret configurado - PULANDO`);
      return {
        success: false,
        status: 0,
        body: null,
        error: 'Webhook sem secret configurado'
      };
    }

    // Generate HMAC signature using webhook secret_encrypted (SEM fallback)
    const signatureData = `${timestamp}.${payloadString}`;
    const signature = await generateHmacSignature(signatureData, webhookSecret);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Rise-Signature": signature,
        "X-Rise-Timestamp": timestamp,
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let responseBody = "";
    try {
      const text = await response.text();
      responseBody = text.length > 1000 ? text.substring(0, 1000) + "..." : text;
    } catch (e) {
      responseBody = "[Sem corpo]";
    }

    return {
      success: response.ok,
      status: response.status,
      body: responseBody,
      error: response.ok ? null : `HTTP ${response.status}`
    };

  } catch (error: any) {
    clearTimeout(timeoutId);
    const isTimeout = error.name === 'AbortError';
    return {
      success: false,
      status: 0,
      body: null,
      error: isTimeout ? "Timeout (30s)" : error.message
    };
  }
}

// ========================================================================
// MAIN HANDLER
// ========================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    // ✅ P0-5: AUTENTICAÇÃO POR HEADER INTERNO
    const internalSecret = req.headers.get('X-Internal-Secret');
    const expectedSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');

    if (!internalSecret || internalSecret !== expectedSecret) {
      logError('Unauthorized: Invalid or missing X-Internal-Secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        }
      );
    }

    // 1. SETUP
    console.log(`[trigger-webhooks] Versão ${FUNCTION_VERSION} iniciada (P0-5 secured)`);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 2. PARSE REQUEST
    const { order_id, event_type } = await req.json();
    if (!order_id || !event_type) throw new Error("Campos obrigatórios ausentes");

    logInfo("🚀 Iniciando processamento (v110 - HMAC Signed)", { order_id, event_type });

    // 3. BUSCAR DADOS
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) throw new Error("Pedido não encontrado");

    // 4. BUSCA PROFUNDA DE ITENS
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order_id);

    if (itemsError || !items?.length) {
      logInfo("⚠️ Pedido sem itens, abortando.");
      return new Response(JSON.stringify({ message: "No items" }), { headers: CORS_HEADERS });
    }

    logInfo("📦 Itens encontrados", { count: items.length, items: items.map((i: any) => ({ name: i.product_name, is_bump: i.is_bump })) });

    // 5. BUSCAR WEBHOOKS
    // Nota: Buscamos webhooks ativos do vendedor - usando secret_encrypted (seguro)
    const { data: webhooks, error: webHooksError } = await supabase
      .from("outbound_webhooks")
      .select(`id, url, name, events, secret_encrypted, webhook_products(product_id)`)
      .eq("vendor_id", order.vendor_id)
      .eq("active", true);

    if (webHooksError) throw new Error("Erro ao buscar webhooks: " + webHooksError.message);
    
    if (!webhooks?.length) {
      logInfo("ℹ️ Nenhum webhook configurado para este vendedor.");
      return new Response(JSON.stringify({ message: "No webhooks configured" }), { headers: CORS_HEADERS });
    }

    logInfo("🔗 Webhooks encontrados", { count: webhooks.length, webhooks: webhooks.map((w: any) => ({ name: w.name, events: w.events })) });

    // 6. PROCESSAR DISPAROS (LÓGICA DE MATCH ROBUSTA)
    const results = [];

    for (const item of items) {
      logInfo(`🔍 Analisando item: ${item.product_name} (${item.product_id})`);

      // Normalizar IDs para evitar falhas de Case Sensitive
      const itemProductId = normalizeUUID(item.product_id);

      const relevantWebhooks = webhooks.filter((wh: any) => {
        // 6.1 Filtro de Evento
        const supportsEvent = wh.events?.includes(event_type);
        if (!supportsEvent) {
          logInfo(`  ❌ Webhook ${wh.name} não suporta evento ${event_type}`);
          return false;
        }

        // 6.2 Filtro de Produto
        const hasProductFilter = (wh.webhook_products && wh.webhook_products.length > 0) || wh.product_id;
        
        // Se não tem filtro, é um webhook global (envia para tudo)
        if (!hasProductFilter) {
            logInfo(`  ✅ Match GLOBAL com webhook: ${wh.name}`);
            return true;
        }

        // Verificação Legacy (coluna product_id)
        const isLegacyMatch = normalizeUUID(wh.product_id) === itemProductId;
        
        // Verificação Relacional (tabela webhook_products)
        const isRelationMatch = wh.webhook_products?.some(
            (wp: any) => normalizeUUID(wp.product_id) === itemProductId
        );

        const isMatch = isLegacyMatch || isRelationMatch;

        if (isMatch) {
            logInfo(`  ✅ Match ESPECÍFICO com webhook: ${wh.name}`);
        } else {
            logInfo(`  ❌ Webhook ${wh.name} não está configurado para produto ${item.product_name}`);
        }

        return isMatch;
      });

      if (relevantWebhooks.length === 0) {
          logInfo(`⚠️ Nenhum webhook compatível encontrado para o item ${item.product_name} no evento ${event_type}`);
      }

      // 6.3 Disparo
      for (const webhook of relevantWebhooks) {
        const payload = {
          event: event_type,
          created_at: new Date().toISOString(),
          data: {
            order: { 
                id: order.id, 
                status: order.status, 
                amount_cents: order.amount_cents,
                email: order.customer_email,
                name: order.customer_name,
                phone: order.customer_phone,
                payment_method: order.payment_method
            },
            item: {
                id: item.id,
                product_id: item.product_id,
                product_name: item.product_name,
                is_bump: item.is_bump,
                price_cents: item.amount_cents
            }
          }
        };

        const result = await sendToExternalWebhook(webhook, payload, item.product_id, item.product_name);
        
        await supabase.from("webhook_deliveries").insert({
            webhook_id: webhook.id,
            order_id: order.id,
            event_type: event_type,
            payload: payload,
            status: result.success ? "success" : "failed",
            response_status: result.status,
            attempts: 1
        });

        results.push(result);
      }
    }

    logInfo("✅ Processamento concluído", { total_webhooks_sent: results.length });

    return new Response(JSON.stringify({ success: true, results }), { 
        status: 200, 
        headers: CORS_HEADERS 
    });

  } catch (error: any) {
    logError("Erro Fatal", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: CORS_HEADERS });
  }
});
