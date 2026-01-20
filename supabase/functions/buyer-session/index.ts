/**
 * Buyer Session
 * 
 * Gerencia sessões do comprador (login, logout, validação)
 * 
 * @category Buyer
 * @status stub - migrado do deploy
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { BUYER_SESSION_DURATION_DAYS } from "../_shared/auth-constants.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("buyer-session");

serve(async (req) => {
  // Handle CORS with dynamic origin validation
  const corsResult = handleCorsV2(req);
  
  if (corsResult instanceof Response) {
    return corsResult; // Preflight or blocked origin
  }
  
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'validate';

    // Handle logout
    if (action === 'logout') {
      const buyerToken = req.headers.get('x-buyer-token');
      if (buyerToken) {
        await supabase
          .from('buyer_sessions')
          .update({ is_valid: false })
          .eq('session_token', buyerToken);
      }
      
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle validate
    if (action === 'validate') {
      const buyerToken = req.headers.get('x-buyer-token');
      if (!buyerToken) {
        return new Response(
          JSON.stringify({ valid: false, error: 'No token provided' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: session, error: sessionError } = await supabase
        .from('buyer_sessions')
        .select('buyer_id, expires_at, is_valid')
        .eq('session_token', buyerToken)
        .single();

      if (sessionError || !session || !session.is_valid) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Invalid session' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (new Date(session.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Session expired' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update last activity
      await supabase
        .from('buyer_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('session_token', buyerToken);

      return new Response(
        JSON.stringify({ valid: true, buyerId: session.buyer_id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle refresh
    if (action === 'refresh') {
      const buyerToken = req.headers.get('x-buyer-token');
      if (!buyerToken) {
        return new Response(
          JSON.stringify({ error: 'No token provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: session } = await supabase
        .from('buyer_sessions')
        .select('buyer_id, is_valid')
        .eq('session_token', buyerToken)
        .single();

      if (!session || !session.is_valid) {
        return new Response(
          JSON.stringify({ error: 'Invalid session' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate new token
      const newToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + BUYER_SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

      // Invalidate old session and create new one
      await supabase
        .from('buyer_sessions')
        .update({ is_valid: false })
        .eq('session_token', buyerToken);

      await supabase.from('buyer_sessions').insert({
        buyer_id: session.buyer_id,
        session_token: newToken,
        expires_at: expiresAt.toISOString(),
        is_valid: true,
      });

      log.info(`Session refreshed for buyer ${session.buyer_id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          token: newToken,
          expiresAt: expiresAt.toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
