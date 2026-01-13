/**
 * Buyer Profile
 * 
 * Gerencia perfil do comprador (buyer)
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const buyerToken = req.headers.get('x-buyer-token');
    if (!buyerToken) {
      return new Response(
        JSON.stringify({ error: 'Buyer token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate buyer session
    const { data: session, error: sessionError } = await supabase
      .from('buyer_sessions')
      .select('buyer_id, expires_at, is_valid')
      .eq('session_token', buyerToken)
      .single();

    if (sessionError || !session || !session.is_valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (new Date(session.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Session expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const method = req.method;
    const buyerId = session.buyer_id;

    if (method === 'GET') {
      // Get buyer profile
      const { data: profile, error: profileError } = await supabase
        .from('buyer_profiles')
        .select('id, email, name, phone, created_at')
        .eq('id', buyerId)
        .single();

      if (profileError) {
        throw profileError;
      }

      return new Response(
        JSON.stringify({ profile }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'PUT' || method === 'PATCH') {
      const updates = await req.json();
      
      // Only allow updating certain fields
      const allowedFields = ['name', 'phone'];
      const safeUpdates: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          safeUpdates[field] = updates[field];
        }
      }

      if (Object.keys(safeUpdates).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No valid fields to update' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: profile, error: updateError } = await supabase
        .from('buyer_profiles')
        .update({
          ...safeUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', buyerId)
        .select('id, email, name, phone, created_at')
        .single();

      if (updateError) {
        throw updateError;
      }

      console.log(`[buyer-profile] Profile updated for buyer ${buyerId}`);

      return new Response(
        JSON.stringify({ profile }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[buyer-profile] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
