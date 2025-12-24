// Edge Function: trigger-webhooks
// Versão: 32
// Função: Dispara webhooks para vendedores quando eventos ocorrem

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, event_type } = await req.json();
    
    // ✅ Busca pedido com relações
    const { data: order } = await supabaseClient
      .from("orders")
      .select(`
        *,
        product:products (*),
        customer:customers (*)
      `)
      .eq("id", order_id)
      .single();

    // ✅ Busca webhooks ativos do vendedor
    const { data: webhooks } = await supabaseClient
      .from("outbound_webhooks")
      .select("*")
      .eq("vendor_id", order.vendor_id)
      .eq("active", true)
      .contains("events", [event_type])
      .or(`product_id.eq.${order.product_id},product_id.is.null`);

    // ✅ Constrói payload completo
    const payload = {
      id: order.id,
      status: order.status,
      totalAmount: order.amount_cents / 100,
      paymentMethod: order.payment_method || "pix",
      customer: {
        name: order.customer_name,
        email: order.customer_email
      },
      product: order.product,
      // ... muitos outros campos
    };

    // ✅ Envia para cada webhook configurado
    for (const webhook of webhooks) {
      const signature = createHmac("sha256", webhook.secret)
        .update(JSON.stringify(payload))
        .digest("hex");

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Rise-Signature": signature,
          "X-Rise-Event": event_type
        },
        body: JSON.stringify(payload)
      });

      // ✅ Registra entrega
      await supabaseClient.from("webhook_deliveries").insert({
        webhook_id: webhook.id,
        order_id: order.id,
        event_type,
        payload,
        status: response.ok ? "success" : "failed",
        response_status: response.status
      });
    }

    return new Response(JSON.stringify({ ok: true }));
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
});
