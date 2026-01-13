/**
 * Test PushinPay Connection
 * 
 * Testa conexão com a API PushinPay usando credenciais do vendor
 * 
 * @category Payments - PushinPay
 * @status stub - migrado do deploy
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PUSHINPAY_API_URL = 'https://api.pushinpay.com.br/api/pix';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { apiToken } = await req.json();
    
    if (!apiToken) {
      return new Response(
        JSON.stringify({ error: 'API token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test connection by checking balance or account info
    const testResponse = await fetch(`${PUSHINPAY_API_URL}/cashout/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!testResponse.ok) {
      const errorData = await testResponse.text();
      console.error('[test-pushinpay-connection] API error:', errorData);
      return new Response(
        JSON.stringify({ 
          connected: false, 
          error: 'Failed to connect to PushinPay' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const balanceData = await testResponse.json();

    console.log(`[test-pushinpay-connection] Success for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        connected: true,
        balance: balanceData.balance || 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[test-pushinpay-connection] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
