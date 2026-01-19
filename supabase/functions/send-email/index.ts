/**
 * Edge Function: send-email
 * 
 * Endpoint centralizado para envio de emails via ZeptoMail.
 * Requer autenticação via producer_sessions (unified-auth).
 * 
 * @version 2.0.0 - RISE V3 Compliance (unified-auth migration)
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, type EmailType, type EmailRecipient } from '../_shared/zeptomail.ts';
import { handleCorsV2 } from '../_shared/cors-v2.ts';
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from '../_shared/rate-limiting/index.ts';
import { requireAuthenticatedProducer } from '../_shared/unified-auth.ts';
import { createLogger } from '../_shared/logger.ts';

const log = createLogger("SendEmail");

interface SendEmailRequest {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  type?: EmailType;
  trackClicks?: boolean;
  trackOpens?: boolean;
  clientReference?: string;
}

serve(async (req: Request) => {
  // SECURITY: Validar CORS no início
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult; // Retorna 403 ou preflight OK
  }
  const corsHeaders = corsResult.headers;

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Rate limiting para prevenir spam
    const rateLimitResult = await rateLimitMiddleware(
      supabase,
      req,
      RATE_LIMIT_CONFIGS.SEND_EMAIL,
      corsHeaders
    );
    if (rateLimitResult) {
      log.warn(`Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    // RISE V3: Autenticação via producer_sessions (unified-auth)
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      log.warn("Tentativa de acesso não autenticado");
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log.info(`Request from producer ${producer.id} (role: ${producer.role})`);

    const body: SendEmailRequest = await req.json();

    // Validação básica
    if (!body.to) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: to' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: subject' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.htmlBody) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: htmlBody' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Envia o email
    const result = await sendEmail({
      to: body.to,
      subject: body.subject,
      htmlBody: body.htmlBody,
      textBody: body.textBody,
      type: body.type,
      trackClicks: body.trackClicks,
      trackOpens: body.trackOpens,
      clientReference: body.clientReference,
    });

    if (!result.success) {
      log.error("Failed to send:", result.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
          details: result.details,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log.info(`Email sent successfully by producer ${producer.id}:`, result.messageId);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.messageId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    log.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
