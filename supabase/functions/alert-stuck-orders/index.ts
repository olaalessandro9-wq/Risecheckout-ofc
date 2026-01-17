/**
 * ============================================================================
 * ALERT-STUCK-ORDERS EDGE FUNCTION
 * ============================================================================
 * 
 * @version 2.0.0
 * 
 * Alerta sobre pedidos presos há mais de 15 minutos.
 * Envia notificação via Telegram para o admin.
 * 
 * ============================================================================
 * COMPORTAMENTO
 * ============================================================================
 * 
 * 1. Busca pedidos PENDING com created_at < 15 minutos
 * 2. Se encontrar, monta mensagem com detalhes
 * 3. Envia via Telegram Bot API
 * 
 * ============================================================================
 * SECRETS NECESSÁRIOS
 * ============================================================================
 * 
 * - TELEGRAM_BOT_TOKEN: Token do bot do Telegram
 * - TELEGRAM_CHAT_ID: ID do chat/grupo para enviar alertas
 * 
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";

const FUNCTION_VERSION = "2.0.0";

const CORS_HEADERS = PUBLIC_CORS_HEADERS;

// Configurações
const STUCK_THRESHOLD_MINUTES = 15;
const MAX_ORDERS_IN_ALERT = 10;

// ============================================================================
// INTERFACES
// ============================================================================

interface StuckOrder {
  id: string;
  vendor_id: string;
  customer_name: string | null;
  customer_email: string | null;
  amount_cents: number;
  gateway: string | null;
  created_at: string;
  status: string;
}

interface AlertResponse {
  success: boolean;
  message: string;
  stuck_count?: number;
  stuck_order_ids?: string[];
  duration_ms: number;
  error?: string;
}

// ============================================================================
// LOGGING
// ============================================================================

function logInfo(message: string, data?: unknown) {
  console.log(`[alert-stuck-orders] [INFO] ${message}`, data ? JSON.stringify(data) : '');
}

function logWarn(message: string, data?: unknown) {
  console.warn(`[alert-stuck-orders] [WARN] ${message}`, data ? JSON.stringify(data) : '');
}

function logError(message: string, error?: unknown) {
  console.error(`[alert-stuck-orders] [ERROR] ${message}`, error);
}

// ============================================================================
// TELEGRAM API
// ============================================================================

async function sendTelegramAlert(
  botToken: string,
  chatId: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logError('Telegram API error', { status: response.status, error });
      return false;
    }

    logInfo('Alerta enviado via Telegram');
    return true;
  } catch (error: unknown) {
    logError('Erro ao enviar Telegram', error);
    return false;
  }
}

// ============================================================================
// FORMATTING
// ============================================================================

function formatCurrency(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

function formatDuration(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }
  
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes}min`;
}

function buildAlertMessage(orders: StuckOrder[]): string {
  const lines: string[] = [
    '🚨 <b>ALERTA: Pedidos Presos</b>',
    '',
    `Encontrados <b>${orders.length}</b> pedido(s) pendente(s) há mais de ${STUCK_THRESHOLD_MINUTES} minutos:`,
    '',
  ];

  const displayOrders = orders.slice(0, MAX_ORDERS_IN_ALERT);

  for (const order of displayOrders) {
    lines.push(`━━━━━━━━━━━━━━━━━━`);
    lines.push(`📦 <b>Pedido:</b> <code>${order.id.substring(0, 8)}...</code>`);
    lines.push(`👤 <b>Cliente:</b> ${order.customer_name || 'N/A'}`);
    lines.push(`📧 <b>Email:</b> ${order.customer_email || 'N/A'}`);
    lines.push(`💰 <b>Valor:</b> ${formatCurrency(order.amount_cents)}`);
    lines.push(`🏦 <b>Gateway:</b> ${order.gateway || 'N/A'}`);
    lines.push(`⏱️ <b>Tempo preso:</b> ${formatDuration(order.created_at)}`);
  }

  if (orders.length > MAX_ORDERS_IN_ALERT) {
    lines.push('');
    lines.push(`... e mais ${orders.length - MAX_ORDERS_IN_ALERT} pedido(s)`);
  }

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('⚡ <i>Verifique o sistema imediatamente!</i>');

  return lines.join('\n');
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const startTime = Date.now();

  try {
    logInfo(`Versão ${FUNCTION_VERSION} iniciada`);

    // Validar autenticação
    const internalSecret = req.headers.get('X-Internal-Secret');
    const expectedSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');

    if (!internalSecret || internalSecret !== expectedSecret) {
      logError('Unauthorized: Invalid or missing X-Internal-Secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar secrets do Telegram
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const telegramChatId = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!telegramBotToken || !telegramChatId) {
      logWarn('TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados');
      const response: AlertResponse = {
        success: false,
        message: 'Telegram não configurado',
        duration_ms: Date.now() - startTime,
      };
      return new Response(
        JSON.stringify(response),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Setup Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Calcular threshold
    const thresholdDate = new Date();
    thresholdDate.setMinutes(thresholdDate.getMinutes() - STUCK_THRESHOLD_MINUTES);

    // Buscar pedidos presos
    const { data: stuckOrders, error: queryError } = await supabase
      .from('orders')
      .select('id, vendor_id, customer_name, customer_email, amount_cents, gateway, created_at, status')
      .eq('status', 'PENDING')
      .lt('created_at', thresholdDate.toISOString())
      .order('created_at', { ascending: true })
      .limit(50);

    if (queryError) {
      throw new Error(`Erro ao buscar pedidos: ${queryError.message}`);
    }

    if (!stuckOrders || stuckOrders.length === 0) {
      logInfo('Nenhum pedido preso encontrado');
      const response: AlertResponse = {
        success: true,
        message: 'Nenhum pedido preso',
        stuck_count: 0,
        duration_ms: Date.now() - startTime,
      };
      return new Response(
        JSON.stringify(response),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const typedOrders = stuckOrders as StuckOrder[];
    logInfo(`Encontrados ${typedOrders.length} pedidos presos`);

    // Construir e enviar alerta
    const alertMessage = buildAlertMessage(typedOrders);
    const sent = await sendTelegramAlert(telegramBotToken, telegramChatId, alertMessage);

    const response: AlertResponse = {
      success: sent,
      message: sent ? 'Alerta enviado' : 'Falha ao enviar alerta',
      stuck_count: typedOrders.length,
      stuck_order_ids: typedOrders.map(o => o.id),
      duration_ms: Date.now() - startTime,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    logError('Erro fatal', error);
    const response: AlertResponse = {
      success: false,
      message: 'Erro fatal',
      error: error instanceof Error ? error.message : String(error),
      duration_ms: Date.now() - startTime,
    };
    return new Response(
      JSON.stringify(response),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
