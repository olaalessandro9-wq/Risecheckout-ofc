/**
 * Edge Function: send-email
 * 
 * Endpoint centralizado para envio de emails via ZeptoMail.
 * Requer autenticação JWT.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, type EmailType, type EmailRecipient } from '../_shared/zeptomail.ts';
import { handleCors } from '../_shared/cors.ts';
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from '../_shared/rate-limiter.ts';

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
  const corsResult = handleCors(req);
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
      RATE_LIMIT_CONFIGS.SEND_EMAIL
    );
    if (rateLimitResult) {
      console.warn(`[send-email] Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

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
      console.error('[send-email] Failed to send:', result.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
          details: result.details,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-email] Email sent successfully:', result.messageId);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.messageId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[send-email] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
