/**
 * Dashboard Orders Edge Function
 * 
 * Retorna pedidos para o dashboard do vendor
 * 
 * Actions:
 * - recent: Pedidos recentes (para tabela)
 * - chart: Pedidos pagos (para gráfico)
 * 
 * @version 2.0.0 - RISE Protocol V3 (Timezone Support)
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// ==========================================
// CONSTANTS
// ==========================================

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

// ==========================================
// TYPES
// ==========================================

interface OrderRecord {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_document: string | null;
  amount_cents: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  product: {
    id: string;
    name: string;
    image_url: string | null;
    user_id: string;
  } | null;
}

interface RequestBody {
  action: "recent" | "chart";
  vendorId: string;
  startDate: string;
  endDate: string;
  timezone?: string;
  limit?: number;
}

// ==========================================
// TIMEZONE HELPERS
// ==========================================

/**
 * Parse date parts from a formatted date string
 */
function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  // Parse MM/DD/YYYY format from en-US locale
  const parts = dateStr.split('/');
  return {
    month: parseInt(parts[0], 10),
    day: parseInt(parts[1], 10),
    year: parseInt(parts[2], 10),
  };
}

/**
 * Get the date string (YYYY-MM-DD) in the specified timezone
 */
function getDateInTimezone(isoDate: string, timezone: string): string {
  const date = new Date(isoDate);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const formatted = formatter.format(date);
  const { year, month, day } = parseDateParts(formatted);
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Get start of day ISO string in the specified timezone
 * 
 * Example for America/Sao_Paulo (UTC-3):
 * - Input: 2026-01-15T00:00:00.000Z (represents "Jan 15" from frontend)
 * - We want: 2026-01-15T03:00:00.000Z (00:00 São Paulo = 03:00 UTC)
 */
function getStartOfDayInTimezone(isoDate: string, timezone: string): string {
  // Get the date in the target timezone
  const dateStr = getDateInTimezone(isoDate, timezone);
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Create a date at midnight local time
  const localMidnight = new Date(year, month - 1, day, 0, 0, 0, 0);
  
  // Calculate offset for this timezone
  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // Get offset at midnight
  const utcDate = new Date(utcFormatter.format(localMidnight).replace(',', ''));
  const tzDate = new Date(tzFormatter.format(localMidnight).replace(',', ''));
  const offsetMs = tzDate.getTime() - utcDate.getTime();
  
  // Convert to UTC
  const utcMidnight = new Date(localMidnight.getTime() - offsetMs);
  return utcMidnight.toISOString();
}

/**
 * Get end of day ISO string in the specified timezone
 */
function getEndOfDayInTimezone(isoDate: string, timezone: string): string {
  // Get the date in the target timezone
  const dateStr = getDateInTimezone(isoDate, timezone);
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Create a date at end of day local time
  const localEndOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
  
  // Calculate offset
  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const utcDate = new Date(utcFormatter.format(localEndOfDay).replace(',', ''));
  const tzDate = new Date(tzFormatter.format(localEndOfDay).replace(',', ''));
  const offsetMs = tzDate.getTime() - utcDate.getTime();
  
  // Convert to UTC
  const utcEndOfDay = new Date(localEndOfDay.getTime() - offsetMs);
  return utcEndOfDay.toISOString();
}

/**
 * Adjust date range for timezone-aware queries
 */
function adjustDateRangeForTimezone(
  startDate: string,
  endDate: string,
  timezone: string
): { adjustedStart: string; adjustedEnd: string } {
  return {
    adjustedStart: getStartOfDayInTimezone(startDate, timezone),
    adjustedEnd: getEndOfDayInTimezone(endDate, timezone),
  };
}

// ==========================================
// HELPERS
// ==========================================

function jsonResponse(data: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, code: string, corsHeaders: Record<string, string>, status = 400): Response {
  return jsonResponse({ error: message, code }, corsHeaders, status);
}

const ORDER_SELECT = `
  id,
  customer_name,
  customer_email,
  customer_phone,
  customer_document,
  amount_cents,
  status,
  payment_method,
  created_at,
  product:product_id (
    id,
    name,
    image_url,
    user_id
  )
`;

// ==========================================
// HANDLERS
// ==========================================

async function handleRecentOrders(
  supabase: SupabaseClient,
  producerId: string,
  startDate: string,
  endDate: string,
  timezone: string,
  limit: number,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Adjust dates for timezone
  const { adjustedStart, adjustedEnd } = adjustDateRangeForTimezone(startDate, endDate, timezone);
  
  console.log(`[dashboard-orders] Recent: timezone=${timezone}, original=${startDate}/${endDate}, adjusted=${adjustedStart}/${adjustedEnd}`);
  
  const { data: orders, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("vendor_id", producerId)
    .gte("created_at", adjustedStart)
    .lte("created_at", adjustedEnd)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[dashboard-orders] Recent orders error:", error);
    return errorResponse("Erro ao buscar pedidos recentes", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ orders: orders || [] }, corsHeaders);
}

async function handleChartOrders(
  supabase: SupabaseClient,
  producerId: string,
  startDate: string,
  endDate: string,
  timezone: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Adjust dates for timezone
  const { adjustedStart, adjustedEnd } = adjustDateRangeForTimezone(startDate, endDate, timezone);
  
  console.log(`[dashboard-orders] Chart: timezone=${timezone}, original=${startDate}/${endDate}, adjusted=${adjustedStart}/${adjustedEnd}`);
  
  const { data: orders, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("vendor_id", producerId)
    .gte("created_at", adjustedStart)
    .lte("created_at", adjustedEnd)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[dashboard-orders] Chart orders error:", error);
    return errorResponse("Erro ao buscar pedidos para gráfico", "DB_ERROR", corsHeaders, 500);
  }

  // Filter only paid orders (case-insensitive)
  const paidOrders = (orders || []).filter(
    (order: OrderRecord) => order.status?.toLowerCase() === "paid"
  );

  return jsonResponse({ orders: paidOrders }, corsHeaders);
}

// ==========================================
// MAIN HANDLER
// ==========================================

serve(async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase: SupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authenticate using producer_session_token
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    // Validate that the vendorId matches the authenticated producer
    const body = await req.json() as RequestBody;
    const { 
      action, 
      vendorId, 
      startDate, 
      endDate, 
      timezone = DEFAULT_TIMEZONE,
      limit = 50 
    } = body;

    // Security check: Producer can only access their own data
    if (vendorId !== producer.id) {
      console.warn(`[dashboard-orders] Producer ${producer.id} tried to access vendor ${vendorId}`);
      return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
    }

    console.log(`[dashboard-orders] Action: ${action}, Producer: ${producer.id}, Timezone: ${timezone}`);

    switch (action) {
      case "recent":
        return handleRecentOrders(supabase, producer.id, startDate, endDate, timezone, limit, corsHeaders);
      
      case "chart":
        return handleChartOrders(supabase, producer.id, startDate, endDate, timezone, corsHeaders);
      
      default:
        return errorResponse(`Ação desconhecida: ${action}`, "INVALID_ACTION", corsHeaders, 400);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[dashboard-orders] Error:", errorMessage);
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", corsHeaders, 500);
  }
});
