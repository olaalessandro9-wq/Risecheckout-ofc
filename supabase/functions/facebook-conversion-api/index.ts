/**
 * Facebook Conversion API
 * 
 * Envia eventos de conversão para a Facebook Conversions API
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

const FB_API_VERSION = 'v18.0';
const FB_API_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;

// Hash data for Facebook (SHA256)
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      pixelId,
      accessToken,
      eventName,
      eventData,
      userData,
      testEventCode,
    } = await req.json();

    if (!pixelId || !accessToken || !eventName) {
      return new Response(
        JSON.stringify({ error: 'pixelId, accessToken, and eventName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare user data with hashing
    const hashedUserData: Record<string, string> = {};
    if (userData?.email) {
      hashedUserData.em = await hashData(userData.email);
    }
    if (userData?.phone) {
      hashedUserData.ph = await hashData(userData.phone);
    }
    if (userData?.firstName) {
      hashedUserData.fn = await hashData(userData.firstName);
    }
    if (userData?.lastName) {
      hashedUserData.ln = await hashData(userData.lastName);
    }

    // Build event payload
    const eventPayload = {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: {
          ...hashedUserData,
          client_ip_address: userData?.ipAddress,
          client_user_agent: userData?.userAgent,
          fbc: userData?.fbc,
          fbp: userData?.fbp,
        },
        custom_data: eventData,
      }],
      ...(testEventCode && { test_event_code: testEventCode }),
    };

    // Send to Facebook
    const fbUrl = `${FB_API_BASE}/${pixelId}/events?access_token=${accessToken}`;
    const fbResponse = await fetch(fbUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventPayload),
    });

    const fbResult = await fbResponse.json();

    if (!fbResponse.ok) {
      console.error('[facebook-conversion-api] FB API error:', fbResult);
      return new Response(
        JSON.stringify({ success: false, error: fbResult }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[facebook-conversion-api] Event ${eventName} sent to pixel ${pixelId}`);

    return new Response(
      JSON.stringify({ success: true, result: fbResult }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[facebook-conversion-api] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
