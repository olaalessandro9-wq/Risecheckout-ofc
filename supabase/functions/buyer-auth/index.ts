import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ENCRYPTION_KEY = Deno.env.get("BUYER_ENCRYPTION_KEY")!;
const SESSION_SECRET = Deno.env.get("BUYER_SESSION_SECRET")!;

// Bcrypt-like password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordData = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordData,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, "0")).join("");
  
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) return false;
  
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordData,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const computedHashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, "0")).join("");
  
  return computedHashHex === hashHex;
}

// SHA-256 hash for document lookup
async function hashDocument(document: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(document.replace(/\D/g, ""));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, "0")).join("");
}

// AES-256-GCM encryption for document storage
async function encryptDocument(document: string): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const keyData = new Uint8Array(ENCRYPTION_KEY.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoder.encode(document.replace(/\D/g, ""))
  );
  
  const encryptedArray = new Uint8Array(encrypted);
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join("");
  const encryptedHex = Array.from(encryptedArray).map(b => b.toString(16).padStart(2, "0")).join("");
  
  return `${ivHex}:${encryptedHex}`;
}

// Generate secure session token
function generateSessionToken(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(randomBytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Check rate limiting
async function checkRateLimit(
  supabase: any,
  identifier: string,
  action: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<{ allowed: boolean; remainingAttempts: number }> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  
  // Check if blocked
  const { data: rateLimit } = await supabase
    .from("buyer_rate_limits")
    .select("*")
    .eq("identifier", identifier)
    .eq("action", action)
    .single();
  
  if (rateLimit?.blocked_until) {
    const blockedUntil = new Date(rateLimit.blocked_until);
    if (blockedUntil > new Date()) {
      return { allowed: false, remainingAttempts: 0 };
    }
  }
  
  // Count recent attempts
  const { count } = await supabase
    .from("buyer_rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("identifier", identifier)
    .eq("action", action)
    .gte("first_attempt_at", windowStart);
  
  const attempts = count || 0;
  const allowed = attempts < maxAttempts;
  
  return { allowed, remainingAttempts: Math.max(0, maxAttempts - attempts) };
}

// Record rate limit attempt
async function recordRateLimitAttempt(
  supabase: any,
  identifier: string,
  action: string,
  maxAttempts: number,
  blockMinutes: number
): Promise<void> {
  const now = new Date().toISOString();
  
  const { data: existing } = await supabase
    .from("buyer_rate_limits")
    .select("*")
    .eq("identifier", identifier)
    .eq("action", action)
    .single();
  
  if (existing) {
    const newAttempts = (existing.attempts || 0) + 1;
    const blockedUntil = newAttempts >= maxAttempts 
      ? new Date(Date.now() + blockMinutes * 60 * 1000).toISOString()
      : null;
    
    await supabase
      .from("buyer_rate_limits")
      .update({
        attempts: newAttempts,
        last_attempt_at: now,
        blocked_until: blockedUntil,
      })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("buyer_rate_limits")
      .insert({
        identifier,
        action,
        attempts: 1,
        first_attempt_at: now,
        last_attempt_at: now,
      });
  }
}

// Clear rate limit on success
async function clearRateLimit(
  supabase: any,
  identifier: string,
  action: string
): Promise<void> {
  await supabase
    .from("buyer_rate_limits")
    .delete()
    .eq("identifier", identifier)
    .eq("action", action);
}

// Log audit event
async function logAudit(
  supabase: any,
  buyerId: string | null,
  action: string,
  success: boolean,
  ipAddress: string | null,
  userAgent: string | null,
  details?: Record<string, unknown>,
  failureReason?: string
): Promise<void> {
  await supabase
    .from("buyer_audit_log")
    .insert({
      buyer_id: buyerId,
      action,
      success,
      ip_address: ipAddress,
      user_agent: userAgent,
      details,
      failure_reason: failureReason,
    });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("cf-connecting-ip");
  const userAgent = req.headers.get("user-agent");

  console.log(`[buyer-auth] Action: ${action}, IP: ${ipAddress}`);

  try {
    // ===================
    // REGISTER
    // ===================
    if (action === "register" && req.method === "POST") {
      const { email, password, name, phone, document } = await req.json();

      // Validate required fields
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email e senha são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: "Email inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate password strength (min 8 chars, 1 number, 1 letter)
      if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
        return new Response(
          JSON.stringify({ error: "Senha deve ter no mínimo 8 caracteres, incluindo letras e números" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Rate limiting: 3 registrations per IP per hour
      const rateCheck = await checkRateLimit(supabase, ipAddress || "unknown", "register", 3, 60);
      if (!rateCheck.allowed) {
        await logAudit(supabase, null, "register", false, ipAddress, userAgent, { email }, "rate_limit_exceeded");
        return new Response(
          JSON.stringify({ error: "Muitas tentativas. Tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if email already exists
      const { data: existingBuyer } = await supabase
        .from("buyer_profiles")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (existingBuyer) {
        await recordRateLimitAttempt(supabase, ipAddress || "unknown", "register", 3, 60);
        await logAudit(supabase, null, "register", false, ipAddress, userAgent, { email }, "email_already_exists");
        return new Response(
          JSON.stringify({ error: "Este email já está cadastrado" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Hash password and document
      const passwordHash = await hashPassword(password);
      const documentHash = document ? await hashDocument(document) : null;
      const documentEncrypted = document ? await encryptDocument(document) : null;

      // Create buyer profile
      const { data: newBuyer, error: createError } = await supabase
        .from("buyer_profiles")
        .insert({
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          name: name?.trim() || null,
          phone: phone?.replace(/\D/g, "") || null,
          document_hash: documentHash,
          document_encrypted: documentEncrypted,
        })
        .select("id, email, name")
        .single();

      if (createError) {
        console.error("[buyer-auth] Register error:", createError);
        await logAudit(supabase, null, "register", false, ipAddress, userAgent, { email }, createError.message);
        return new Response(
          JSON.stringify({ error: "Erro ao criar conta" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await clearRateLimit(supabase, ipAddress || "unknown", "register");
      await logAudit(supabase, newBuyer.id, "register", true, ipAddress, userAgent, { email });

      console.log(`[buyer-auth] New buyer registered: ${newBuyer.id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Conta criada com sucesso",
          buyer: { id: newBuyer.id, email: newBuyer.email, name: newBuyer.name }
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===================
    // LOGIN
    // ===================
    if (action === "login" && req.method === "POST") {
      const { email, password } = await req.json();

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email e senha são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Rate limiting: 5 attempts per 15 minutes
      const rateCheck = await checkRateLimit(supabase, email.toLowerCase(), "login", 5, 15);
      if (!rateCheck.allowed) {
        await logAudit(supabase, null, "login", false, ipAddress, userAgent, { email }, "rate_limit_exceeded");
        return new Response(
          JSON.stringify({ error: "Conta temporariamente bloqueada. Tente novamente em 15 minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find buyer by email
      const { data: buyer, error: findError } = await supabase
        .from("buyer_profiles")
        .select("id, email, name, phone, password_hash, is_active")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (findError || !buyer) {
        await recordRateLimitAttempt(supabase, email.toLowerCase(), "login", 5, 15);
        await logAudit(supabase, null, "login", false, ipAddress, userAgent, { email }, "user_not_found");
        return new Response(
          JSON.stringify({ error: "Email ou senha incorretos" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!buyer.is_active) {
        await logAudit(supabase, buyer.id, "login", false, ipAddress, userAgent, { email }, "account_inactive");
        return new Response(
          JSON.stringify({ error: "Conta desativada. Entre em contato com o suporte." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify password
      const passwordValid = await verifyPassword(password, buyer.password_hash);
      if (!passwordValid) {
        await recordRateLimitAttempt(supabase, email.toLowerCase(), "login", 5, 15);
        await logAudit(supabase, buyer.id, "login", false, ipAddress, userAgent, { email }, "invalid_password");
        return new Response(
          JSON.stringify({ error: "Email ou senha incorretos" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate session token
      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      // Create session
      const { error: sessionError } = await supabase
        .from("buyer_sessions")
        .insert({
          buyer_id: buyer.id,
          session_token: sessionToken,
          ip_address: ipAddress,
          user_agent: userAgent,
          expires_at: expiresAt.toISOString(),
        });

      if (sessionError) {
        console.error("[buyer-auth] Session creation error:", sessionError);
        await logAudit(supabase, buyer.id, "login", false, ipAddress, userAgent, { email }, sessionError.message);
        return new Response(
          JSON.stringify({ error: "Erro ao criar sessão" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update last login
      await supabase
        .from("buyer_profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", buyer.id);

      await clearRateLimit(supabase, email.toLowerCase(), "login");
      await logAudit(supabase, buyer.id, "login", true, ipAddress, userAgent, { email });

      console.log(`[buyer-auth] Buyer logged in: ${buyer.id}`);

      // Return with HttpOnly cookie
      const cookieHeader = `buyer_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 60 * 60}`;

      return new Response(
        JSON.stringify({
          success: true,
          buyer: {
            id: buyer.id,
            email: buyer.email,
            name: buyer.name,
            phone: buyer.phone,
          },
        }),
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
    // LOGOUT
    // ===================
    if (action === "logout" && req.method === "POST") {
      const cookies = req.headers.get("cookie") || "";
      const sessionToken = cookies.split(";")
        .find(c => c.trim().startsWith("buyer_session="))
        ?.split("=")[1];

      if (sessionToken) {
        // Get buyer ID for logging
        const { data: session } = await supabase
          .from("buyer_sessions")
          .select("buyer_id")
          .eq("session_token", sessionToken)
          .single();

        // Invalidate session
        await supabase
          .from("buyer_sessions")
          .update({ is_valid: false })
          .eq("session_token", sessionToken);

        if (session?.buyer_id) {
          await logAudit(supabase, session.buyer_id, "logout", true, ipAddress, userAgent);
        }

        console.log(`[buyer-auth] Buyer logged out`);
      }

      // Clear cookie
      const clearCookie = "buyer_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0";

      return new Response(
        JSON.stringify({ success: true, message: "Logout realizado com sucesso" }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Set-Cookie": clearCookie,
          },
        }
      );
    }

    // ===================
    // FORGOT PASSWORD
    // ===================
    if (action === "forgot-password" && req.method === "POST") {
      const { email } = await req.json();

      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Rate limiting: 3 per hour
      const rateCheck = await checkRateLimit(supabase, email.toLowerCase(), "forgot_password", 3, 60);
      if (!rateCheck.allowed) {
        return new Response(
          JSON.stringify({ error: "Muitas tentativas. Tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await recordRateLimitAttempt(supabase, email.toLowerCase(), "forgot_password", 3, 60);

      // Always return success to prevent email enumeration
      console.log(`[buyer-auth] Password reset requested for: ${email}`);
      
      // TODO: Implement email sending with reset token
      // For now, just log and return success

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Se o email estiver cadastrado, você receberá as instruções de recuperação." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unknown action
    return new Response(
      JSON.stringify({ error: "Ação não encontrada" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[buyer-auth] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
