/**
 * Buyer Profile
 * 
 * Gerencia perfil do comprador (buyer)
 * 
 * @category Buyer
 * @status RISE V3 COMPLIANT - Unified Auth
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";
import { getAuthenticatedUser } from "../_shared/unified-auth-v2.ts";

const log = createLogger("buyer-profile");

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

    // RISE V3: Use unified auth - validates via sessions table + __Secure-rise_access cookie (Domain=.risecheckout.com)
    const user = await getAuthenticatedUser(supabase, req);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const method = req.method;
    const userId = user.id;

    if (method === 'GET') {
      // Get user profile from unified users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, name, phone, created_at')
        .eq('id', userId)
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
        .from('users')
        .update({
          ...safeUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('id, email, name, phone, created_at')
        .single();

      if (updateError) {
        throw updateError;
      }

      log.info(`Profile updated for user ${userId}`);

      return new Response(
        JSON.stringify({ profile }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
