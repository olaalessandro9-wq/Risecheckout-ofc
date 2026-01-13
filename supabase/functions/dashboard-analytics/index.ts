/**
 * Dashboard Analytics
 * 
 * Retorna métricas e analytics para o dashboard do vendor
 * 
 * @category Tracking
 * @status stub - migrado do deploy
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const url = new URL(req.url);
    const period = url.searchParams.get('period') || '7d';
    const productId = url.searchParams.get('productId');

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default: // 7d
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build orders query
    let ordersQuery = supabase
      .from('orders')
      .select('id, amount_cents, status, payment_method, created_at')
      .eq('vendor_id', user.id)
      .gte('created_at', startDate.toISOString());

    if (productId) {
      ordersQuery = ordersQuery.eq('product_id', productId);
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error('[dashboard-analytics] Orders query error:', ordersError);
      throw ordersError;
    }

    // Calculate metrics
    const paidOrders = orders?.filter(o => o.status === 'paid') || [];
    const pendingOrders = orders?.filter(o => o.status === 'pending') || [];
    
    const analytics = {
      period,
      totalOrders: orders?.length || 0,
      paidOrders: paidOrders.length,
      pendingOrders: pendingOrders.length,
      totalRevenue: paidOrders.reduce((sum, o) => sum + (o.amount_cents || 0), 0),
      pendingRevenue: pendingOrders.reduce((sum, o) => sum + (o.amount_cents || 0), 0),
      paymentMethods: {
        pix: orders?.filter(o => o.payment_method === 'pix').length || 0,
        creditCard: orders?.filter(o => o.payment_method === 'credit_card').length || 0,
      },
      conversionRate: orders?.length 
        ? ((paidOrders.length / orders.length) * 100).toFixed(2) 
        : 0,
    };

    console.log(`[dashboard-analytics] Analytics for user ${user.id}, period ${period}`);

    return new Response(
      JSON.stringify(analytics),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[dashboard-analytics] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
