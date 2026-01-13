/**
 * Buyer Session
 * 
 * Gerencia sessões do comprador (login, logout, validação)
 * 
 * @category Buyer
 * @status stub - migrado do deploy
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-buyer-token',
};

const SESSION_DURATION_DAYS = 30;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
      const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

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

      console.log(`[buyer-session] Session refreshed for buyer ${session.buyer_id}`);

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
    console.error('[buyer-session] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
