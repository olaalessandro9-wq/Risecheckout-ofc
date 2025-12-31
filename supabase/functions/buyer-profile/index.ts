import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cookie",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ENCRYPTION_KEY = Deno.env.get("BUYER_ENCRYPTION_KEY")!;

// AES-256-GCM decryption
async function decryptDocument(encryptedData: string): Promise<string | null> {
  try {
    const [ivHex, encryptedHex] = encryptedData.split(":");
    if (!ivHex || !encryptedHex) return null;

    const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const encrypted = new Uint8Array(encryptedHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

    const keyData = new Uint8Array(ENCRYPTION_KEY.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("[buyer-profile] Decryption error:", error);
    return null;
  }
}

// Mask document
function maskDocument(document: string): string {
  const cleanDoc = document.replace(/\D/g, "");
  if (cleanDoc.length === 11) {
    return `***.***${cleanDoc.slice(6, 9)}-${cleanDoc.slice(9)}`;
  } else if (cleanDoc.length === 14) {
    return `**.***.***/${cleanDoc.slice(8, 12)}-${cleanDoc.slice(12)}`;
  }
  return "***";
}

// Extract session token from cookies
function getSessionToken(req: Request): string | null {
  const cookies = req.headers.get("cookie") || "";
  const match = cookies.split(";").find(c => c.trim().startsWith("buyer_session="));
  return match?.split("=")[1] || null;
}

// Validate session and get buyer ID
async function validateSession(
  supabase: any,
  req: Request
): Promise<{ valid: boolean; buyerId?: string; error?: string }> {
  const sessionToken = getSessionToken(req);

  if (!sessionToken) {
    return { valid: false, error: "No session" };
  }

  const { data: session } = await supabase
    .from("buyer_sessions")
    .select("buyer_id, expires_at, is_valid")
    .eq("session_token", sessionToken)
    .eq("is_valid", true)
    .single();

  if (!session) {
    return { valid: false, error: "Invalid session" };
  }

  if (new Date(session.expires_at) < new Date()) {
    return { valid: false, error: "Session expired" };
  }

  return { valid: true, buyerId: session.buyer_id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();

  console.log(`[buyer-profile] Action: ${action}`);

  try {
    // Validate session for all endpoints
    const sessionResult = await validateSession(supabase, req);
    if (!sessionResult.valid) {
      return new Response(
        JSON.stringify({ error: sessionResult.error }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const buyerId = sessionResult.buyerId!;

    // ===================
    // GET PROFILE
    // ===================
    if (action === "me" && req.method === "GET") {
      const { data: buyer, error: fetchError } = await supabase
        .from("buyer_profiles")
        .select("id, email, email_verified, name, phone, document_encrypted, created_at, last_login_at")
        .eq("id", buyerId)
        .single();

      if (fetchError || !buyer) {
        return new Response(
          JSON.stringify({ error: "Profile not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Decrypt and mask document
      let maskedDocument = null;
      if (buyer.document_encrypted) {
        const decrypted = await decryptDocument(buyer.document_encrypted);
        if (decrypted) {
          maskedDocument = maskDocument(decrypted);
        }
      }

      console.log(`[buyer-profile] Profile fetched for: ${buyerId}`);

      return new Response(
        JSON.stringify({
          id: buyer.id,
          email: buyer.email,
          email_verified: buyer.email_verified,
          name: buyer.name,
          phone: buyer.phone,
          document_masked: maskedDocument,
          created_at: buyer.created_at,
          last_login_at: buyer.last_login_at,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===================
    // UPDATE PROFILE
    // ===================
    if (action === "me" && req.method === "PUT") {
      const { name, phone } = await req.json();

      const updateData: Record<string, string | null> = {};
      
      if (name !== undefined) {
        updateData.name = name?.trim() || null;
      }
      
      if (phone !== undefined) {
        updateData.phone = phone?.replace(/\D/g, "") || null;
      }

      if (Object.keys(updateData).length === 0) {
        return new Response(
          JSON.stringify({ error: "No data to update" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await supabase
        .from("buyer_profiles")
        .update(updateData)
        .eq("id", buyerId);

      if (updateError) {
        console.error("[buyer-profile] Update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update profile" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[buyer-profile] Profile updated for: ${buyerId}`);

      return new Response(
        JSON.stringify({ success: true, message: "Profile updated" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===================
    // GET ORDER HISTORY
    // ===================
    if (action === "orders" && req.method === "GET") {
      // Get buyer email
      const { data: buyer } = await supabase
        .from("buyer_profiles")
        .select("email")
        .eq("id", buyerId)
        .single();

      if (!buyer) {
        return new Response(
          JSON.stringify({ error: "Profile not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get orders by email
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          product_name,
          amount_cents,
          currency,
          status,
          payment_method,
          gateway,
          created_at,
          paid_at,
          products!inner (
            image_url
          )
        `)
        .eq("customer_email", buyer.email)
        .in("status", ["paid", "completed", "pending", "refunded"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (ordersError) {
        console.error("[buyer-profile] Orders fetch error:", ordersError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch orders" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const formattedOrders = (orders || []).map((order: any) => ({
        id: order.id,
        product_name: order.product_name,
        amount: order.amount_cents / 100,
        currency: order.currency,
        status: order.status,
        payment_method: order.payment_method,
        gateway: order.gateway,
        created_at: order.created_at,
        paid_at: order.paid_at,
        product_image: order.products?.image_url,
      }));

      console.log(`[buyer-profile] Orders fetched for: ${buyerId}, count: ${formattedOrders.length}`);

      return new Response(
        JSON.stringify({ orders: formattedOrders }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===================
    // GET SAVED CARDS
    // ===================
    if (action === "cards" && req.method === "GET") {
      const { data: cards, error: cardsError } = await supabase
        .from("buyer_saved_cards")
        .select("id, gateway, last_four, brand, exp_month, exp_year, is_default, created_at")
        .eq("buyer_id", buyerId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (cardsError) {
        console.error("[buyer-profile] Cards fetch error:", cardsError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch cards" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[buyer-profile] Cards fetched for: ${buyerId}, count: ${cards?.length || 0}`);

      return new Response(
        JSON.stringify({ cards: cards || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unknown action
    return new Response(
      JSON.stringify({ error: "Action not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[buyer-profile] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
