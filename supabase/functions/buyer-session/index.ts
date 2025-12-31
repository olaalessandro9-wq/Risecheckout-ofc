import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cookie",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ENCRYPTION_KEY = Deno.env.get("BUYER_ENCRYPTION_KEY")!;

// AES-256-GCM decryption for document display
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
    console.error("[buyer-session] Decryption error:", error);
    return null;
  }
}

// Mask document for display (e.g., ***.***.789-00)
function maskDocument(document: string): string {
  const cleanDoc = document.replace(/\D/g, "");
  if (cleanDoc.length === 11) {
    // CPF: ***.***.789-00
    return `***.***${cleanDoc.slice(6, 9)}-${cleanDoc.slice(9)}`;
  } else if (cleanDoc.length === 14) {
    // CNPJ: **.***.***/8901-23
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();

  console.log(`[buyer-session] Action: ${action}`);

  try {
    // ===================
    // VALIDATE SESSION
    // ===================
    if (action === "validate" && req.method === "GET") {
      const sessionToken = getSessionToken(req);

      if (!sessionToken) {
        return new Response(
          JSON.stringify({ authenticated: false, error: "No session" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find valid session
      const { data: session, error: sessionError } = await supabase
        .from("buyer_sessions")
        .select(`
          id,
          buyer_id,
          expires_at,
          is_valid,
          buyer_profiles!inner (
            id,
            email,
            name,
            phone,
            document_encrypted,
            is_active
          )
        `)
        .eq("session_token", sessionToken)
        .eq("is_valid", true)
        .single();

      if (sessionError || !session) {
        console.log("[buyer-session] Session not found or invalid");
        return new Response(
          JSON.stringify({ authenticated: false, error: "Invalid session" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if session is expired
      if (new Date(session.expires_at) < new Date()) {
        console.log("[buyer-session] Session expired");
        await supabase
          .from("buyer_sessions")
          .update({ is_valid: false })
          .eq("id", session.id);

        return new Response(
          JSON.stringify({ authenticated: false, error: "Session expired" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if buyer is active
      const buyerProfile = session.buyer_profiles as any;
      if (!buyerProfile?.is_active) {
        return new Response(
          JSON.stringify({ authenticated: false, error: "Account inactive" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Decrypt and mask document if exists
      let maskedDocument = null;
      if (buyerProfile.document_encrypted) {
        const decrypted = await decryptDocument(buyerProfile.document_encrypted);
        if (decrypted) {
          maskedDocument = maskDocument(decrypted);
        }
      }

      // Update last activity
      await supabase
        .from("buyer_sessions")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", session.id);

      console.log(`[buyer-session] Session validated for buyer: ${session.buyer_id}`);

      return new Response(
        JSON.stringify({
          authenticated: true,
          buyer: {
            id: buyerProfile.id,
            email: buyerProfile.email,
            name: buyerProfile.name,
            phone: buyerProfile.phone,
            document_masked: maskedDocument,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===================
    // REFRESH SESSION
    // ===================
    if (action === "refresh" && req.method === "POST") {
      const sessionToken = getSessionToken(req);

      if (!sessionToken) {
        return new Response(
          JSON.stringify({ success: false, error: "No session" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find and validate session
      const { data: session, error: sessionError } = await supabase
        .from("buyer_sessions")
        .select("id, buyer_id, is_valid")
        .eq("session_token", sessionToken)
        .eq("is_valid", true)
        .single();

      if (sessionError || !session) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid session" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extend session by 30 days
      const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await supabase
        .from("buyer_sessions")
        .update({
          expires_at: newExpiresAt.toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      console.log(`[buyer-session] Session refreshed for buyer: ${session.buyer_id}`);

      // Update cookie with new expiration
      const cookieHeader = `buyer_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 60 * 60}`;

      return new Response(
        JSON.stringify({ success: true, message: "Session refreshed" }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Set-Cookie": cookieHeader,
          },
        }
      );
    }

    // ===================
    // GET FULL PROFILE DATA (for checkout pre-fill)
    // ===================
    if (action === "checkout-data" && req.method === "GET") {
      const sessionToken = getSessionToken(req);

      if (!sessionToken) {
        return new Response(
          JSON.stringify({ authenticated: false }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find valid session
      const { data: session } = await supabase
        .from("buyer_sessions")
        .select(`
          buyer_id,
          expires_at,
          is_valid,
          buyer_profiles!inner (
            id,
            email,
            name,
            phone,
            document_encrypted,
            is_active
          )
        `)
        .eq("session_token", sessionToken)
        .eq("is_valid", true)
        .single();

      if (!session || new Date(session.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ authenticated: false }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const buyerProfile = session.buyer_profiles as any;
      if (!buyerProfile?.is_active) {
        return new Response(
          JSON.stringify({ authenticated: false }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Decrypt document for checkout (will be sent securely)
      let document = null;
      let maskedDocument = null;
      if (buyerProfile.document_encrypted) {
        const decrypted = await decryptDocument(buyerProfile.document_encrypted);
        if (decrypted) {
          document = decrypted;
          maskedDocument = maskDocument(decrypted);
        }
      }

      console.log(`[buyer-session] Checkout data requested for buyer: ${session.buyer_id}`);

      return new Response(
        JSON.stringify({
          authenticated: true,
          buyer: {
            id: buyerProfile.id,
            email: buyerProfile.email,
            name: buyerProfile.name,
            phone: buyerProfile.phone,
            document: document, // Full document for form submission
            document_masked: maskedDocument, // Masked for display
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unknown action
    return new Response(
      JSON.stringify({ error: "Action not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[buyer-session] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
