import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";
import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "../_shared/rate-limiter.ts";

// Use public CORS for members area (accessed by buyers)
const corsHeaders = PUBLIC_CORS_HEADERS;

interface StudentRequest {
  action: 
    | "list" 
    | "get" 
    | "add-to-group" 
    | "remove-from-group" 
    | "revoke-access" 
    | "grant-access"
    | "invite"
    | "validate-invite-token"
    | "use-invite-token"
    | "generate-purchase-access";
  product_id?: string;
  buyer_id?: string;
  group_id?: string;
  order_id?: string;
  // Invite fields
  email?: string;
  name?: string;
  group_ids?: string[];
  // Token fields
  token?: string;
  password?: string;
  // Purchase access fields
  customer_email?: string;
  // List filters
  page?: number;
  limit?: number;
  search?: string;
  access_type?: string;
  status?: string;
}

/**
 * Hash a token using SHA-256
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Hash password using bcrypt (via Deno)
 */
async function hashPassword(password: string): Promise<string> {
  const { hash } = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
  return await hash(password);
}

/**
 * Verify password against hash
 */
async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const { compare } = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
  return await compare(password, passwordHash);
}

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomUUID() + "-" + crypto.randomUUID();
}

/**
 * Generate buyer session token
 */
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(
      supabase as any,
      req,
      RATE_LIMIT_CONFIGS.MEMBERS_AREA
    );
    if (rateLimitResult) {
      console.warn(`[members-area-students] Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    const body: StudentRequest = await req.json();
    const { action } = body;

    console.log(`[members-area-students] Action: ${action}`);

    // ========================================================================
    // PUBLIC ACTIONS (no auth required) - Token validation and usage
    // ========================================================================
    if (action === "validate-invite-token") {
      const { token } = body;
      
      if (!token) {
        return new Response(
          JSON.stringify({ error: "token required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenHash = await hashToken(token);

      const { data: tokenData, error: tokenError } = await supabase
        .from("student_invite_tokens")
        .select(`
          id,
          buyer_id,
          product_id,
          is_used,
          expires_at,
          buyer:buyer_profiles(id, email, name, password_hash)
        `)
        .eq("token_hash", tokenHash)
        .single();

      if (tokenError || !tokenData) {
        console.log("[members-area-students] Token not found");
        return new Response(
          JSON.stringify({ valid: false, reason: "Token inválido ou expirado" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if already used
      if (tokenData.is_used) {
        return new Response(
          JSON.stringify({ valid: false, reason: "Este link já foi utilizado", redirect: "/minha-conta" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check expiration
      if (new Date(tokenData.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ valid: false, reason: "Este link expirou" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const buyer = tokenData.buyer as any;
      const needsPasswordSetup = !buyer?.password_hash || buyer.password_hash === "PENDING_PASSWORD_SETUP";

      // Get product info
      const { data: product } = await supabase
        .from("products")
        .select("id, name, image_url")
        .eq("id", tokenData.product_id)
        .single();

      return new Response(
        JSON.stringify({
          valid: true,
          needsPasswordSetup,
          buyer_id: tokenData.buyer_id,
          product_id: tokenData.product_id,
          product_name: product?.name || "Produto",
          product_image: product?.image_url || null,
          buyer_email: buyer?.email || "",
          buyer_name: buyer?.name || "",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "use-invite-token") {
      const { token, password } = body;
      
      if (!token) {
        return new Response(
          JSON.stringify({ error: "token required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenHash = await hashToken(token);

      // Validate token again
      const { data: tokenData, error: tokenError } = await supabase
        .from("student_invite_tokens")
        .select(`
          id,
          buyer_id,
          product_id,
          is_used,
          expires_at
        `)
        .eq("token_hash", tokenHash)
        .single();

      if (tokenError || !tokenData) {
        return new Response(
          JSON.stringify({ success: false, error: "Token inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (tokenData.is_used) {
        return new Response(
          JSON.stringify({ success: false, error: "Este link já foi utilizado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: "Este link expirou" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get buyer profile
      const { data: buyer } = await supabase
        .from("buyer_profiles")
        .select("id, email, name, password_hash")
        .eq("id", tokenData.buyer_id)
        .single();

      if (!buyer) {
        return new Response(
          JSON.stringify({ success: false, error: "Perfil não encontrado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const needsPasswordSetup = !buyer.password_hash || buyer.password_hash === "PENDING_PASSWORD_SETUP";

      // If needs password setup, require password
      if (needsPasswordSetup) {
        if (!password || password.length < 6) {
          return new Response(
            JSON.stringify({ success: false, error: "Senha deve ter pelo menos 6 caracteres" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Hash and save password
        const passwordHash = await hashPassword(password);
        
        const { error: updateError } = await supabase
          .from("buyer_profiles")
          .update({ 
            password_hash: passwordHash,
            password_hash_version: 1,
            updated_at: new Date().toISOString()
          })
          .eq("id", buyer.id);

        if (updateError) {
          console.error("[members-area-students] Error updating password:", updateError);
          return new Response(
            JSON.stringify({ success: false, error: "Erro ao salvar senha" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Mark token as used
      await supabase
        .from("student_invite_tokens")
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
        })
        .eq("id", tokenData.id);

      // Create session
      const sessionToken = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error: sessionError } = await supabase
        .from("buyer_sessions")
        .insert({
          buyer_id: buyer.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          is_valid: true,
        });

      if (sessionError) {
        console.error("[members-area-students] Error creating session:", sessionError);
      }

      // Update last login
      await supabase
        .from("buyer_profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", buyer.id);

      console.log(`[members-area-students] Token used successfully for buyer ${buyer.id}`);

      return new Response(
        JSON.stringify({
          success: true,
          sessionToken,
          buyer: {
            id: buyer.id,
            email: buyer.email,
            name: buyer.name,
          },
          product_id: tokenData.product_id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // GENERATE PURCHASE ACCESS - Gera token de acesso para página de sucesso
    // ========================================================================
    if (action === "generate-purchase-access") {
      const { order_id, customer_email, product_id } = body;

      if (!order_id || !customer_email || !product_id) {
        return new Response(
          JSON.stringify({ error: "order_id, customer_email and product_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[members-area-students] Generating purchase access for order ${order_id}`);

      // 1. Validar que a order existe e está PAID
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, status, customer_email, product_id")
        .eq("id", order_id)
        .single();

      if (orderError || !order) {
        console.log("[members-area-students] Order not found:", order_id);
        return new Response(
          JSON.stringify({ error: "Pedido não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (order.status !== "PAID") {
        return new Response(
          JSON.stringify({ error: "Pedido ainda não foi pago" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validar email
      const normalizedEmail = customer_email.toLowerCase().trim();
      if (order.customer_email?.toLowerCase().trim() !== normalizedEmail) {
        return new Response(
          JSON.stringify({ error: "Email não corresponde ao pedido" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. Verificar se produto tem área de membros
      const { data: product } = await supabase
        .from("products")
        .select("id, name, members_area_enabled, user_id")
        .eq("id", product_id)
        .single();

      if (!product?.members_area_enabled) {
        return new Response(
          JSON.stringify({ error: "Produto não tem área de membros" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 3. Buscar buyer_profile
      let { data: buyer } = await supabase
        .from("buyer_profiles")
        .select("id, email, password_hash")
        .eq("email", normalizedEmail)
        .single();

      if (!buyer) {
        // Criar buyer se não existir
        const { data: newBuyer, error: createError } = await supabase
          .from("buyer_profiles")
          .insert({
            email: normalizedEmail,
            password_hash: "PENDING_PASSWORD_SETUP",
            is_active: true,
          })
          .select("id, email, password_hash")
          .single();

        if (createError) {
          console.error("[members-area-students] Error creating buyer:", createError);
          return new Response(
            JSON.stringify({ error: "Erro ao criar perfil" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        buyer = newBuyer;
      }

      const needsPasswordSetup = !buyer.password_hash || buyer.password_hash === "PENDING_PASSWORD_SETUP";

      // 4. Garantir buyer_product_access existe
      await supabase
        .from("buyer_product_access")
        .upsert({
          buyer_id: buyer.id,
          product_id: product_id,
          order_id: order_id,
          is_active: true,
          access_type: "purchase",
          granted_at: new Date().toISOString(),
        }, {
          onConflict: "buyer_id,product_id",
        });

      const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://risecheckout.lovable.app";

      // 5. Se precisa setup de senha, gerar invite token
      if (needsPasswordSetup) {
        const rawToken = generateToken();
        const tokenHash = await hashToken(rawToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await supabase
          .from("student_invite_tokens")
          .insert({
            token_hash: tokenHash,
            buyer_id: buyer.id,
            product_id: product_id,
            invited_by: product.user_id,
            expires_at: expiresAt.toISOString(),
          });

        const accessUrl = `${baseUrl}/minha-conta/setup-acesso?token=${rawToken}`;
        
        console.log(`[members-area-students] Generated setup access URL for buyer ${buyer.id}`);

        return new Response(
          JSON.stringify({
            success: true,
            needsPasswordSetup: true,
            accessUrl,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 6. Buyer já tem senha - redirecionar para login
      console.log(`[members-area-students] Buyer ${buyer.id} already has password, redirecting to login`);
      
      return new Response(
        JSON.stringify({
          success: true,
          needsPasswordSetup: false,
          accessUrl: `${baseUrl}/minha-conta`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // AUTHENTICATED ACTIONS - Require producer login
    // ========================================================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jwtToken = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwtToken);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { product_id, buyer_id, group_id, order_id, email, name, group_ids } = body;

    // Verify product ownership
    if (product_id) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, user_id, name, image_url")
        .eq("id", product_id)
        .single();

      if (productError || !product || product.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Product not found or access denied" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ======================================================================
      // INVITE ACTION
      // ======================================================================
      if (action === "invite") {
        if (!email) {
          return new Response(
            JSON.stringify({ error: "email required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const normalizedEmail = email.toLowerCase().trim();

        console.log(`[members-area-students] Inviting ${normalizedEmail} to product ${product_id}`);

        // 1. Check if buyer_profile exists
        let { data: existingBuyer } = await supabase
          .from("buyer_profiles")
          .select("id, email, name, password_hash")
          .eq("email", normalizedEmail)
          .single();

        let buyerId: string;
        let isNewBuyer = false;

        if (!existingBuyer) {
          // Create new buyer profile with pending password
          const { data: newBuyer, error: createError } = await supabase
            .from("buyer_profiles")
            .insert({
              email: normalizedEmail,
              name: name || null,
              password_hash: "PENDING_PASSWORD_SETUP",
              is_active: true,
            })
            .select("id, email, name")
            .single();

          if (createError) {
            console.error("[members-area-students] Error creating buyer:", createError);
            return new Response(
              JSON.stringify({ error: "Erro ao criar perfil do aluno" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          buyerId = newBuyer.id;
          isNewBuyer = true;
          console.log(`[members-area-students] Created new buyer: ${buyerId}`);
        } else {
          buyerId = existingBuyer.id;
          
          // Update name if provided and buyer doesn't have one
          if (name && !existingBuyer.name) {
            await supabase
              .from("buyer_profiles")
              .update({ name })
              .eq("id", buyerId);
          }
        }

        // 2. Grant product access (order_id is NULL for invites)
        const { error: accessError } = await supabase
          .from("buyer_product_access")
          .upsert({
            buyer_id: buyerId,
            product_id,
            order_id: null, // No order for manual invites
            is_active: true,
            access_type: "invite",
            granted_at: new Date().toISOString(),
          }, {
            onConflict: "buyer_id,product_id",
          });

        if (accessError) {
          console.error("[members-area-students] Error granting access:", accessError);
          return new Response(
            JSON.stringify({ error: "Erro ao conceder acesso ao produto" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // 3. Assign groups if provided
        if (group_ids && group_ids.length > 0) {
          // First remove existing groups
          await supabase
            .from("buyer_groups")
            .delete()
            .eq("buyer_id", buyerId);

          // Insert new groups
          const groupInserts = group_ids.map(gid => ({
            buyer_id: buyerId,
            group_id: gid,
            is_active: true,
            granted_at: new Date().toISOString(),
          }));

          await supabase.from("buyer_groups").insert(groupInserts);
        }

        // 4. Generate invite token
        const rawToken = generateToken();
        const tokenHash = await hashToken(rawToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        const { error: tokenError } = await supabase
          .from("student_invite_tokens")
          .insert({
            token_hash: tokenHash,
            buyer_id: buyerId,
            product_id,
            invited_by: user.id,
            expires_at: expiresAt.toISOString(),
          });

        if (tokenError) {
          console.error("[members-area-students] Error creating token:", tokenError);
          return new Response(
            JSON.stringify({ error: "Erro ao gerar link de convite" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // 5. Build access link
        const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://risecheckout.lovable.app";
        const accessLink = `${baseUrl}/minha-conta/setup-acesso?token=${rawToken}`;

        // 6. Get producer info
        const { data: producerProfile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single();

        // 7. Send email
        const studentName = name || normalizedEmail.split("@")[0];
        const producerName = producerProfile?.name || "Produtor";
        const producerEmail = user.email || "";

        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <h1 style="color: #18181b; font-size: 24px; margin: 0 0 24px 0;">
        Oi ${studentName}, tudo certo?
      </h1>
      
      <h2 style="color: #18181b; font-size: 18px; margin: 0 0 16px 0;">
        Acessar o seu produto:
      </h2>
      
      <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Você pode acessar o seu produto através da plataforma Rise, clique abaixo:
      </p>
      
      <a href="${accessLink}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Acessar meu produto
      </a>
      
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
      
      <div style="background-color: #fafafa; border-radius: 8px; padding: 20px;">
        ${product.image_url ? `<img src="${product.image_url}" alt="${product.name}" style="width: 100%; max-width: 200px; border-radius: 8px; margin-bottom: 16px;">` : ""}
        <p style="color: #18181b; font-size: 14px; margin: 0 0 8px 0;">
          <strong>Produto:</strong> ${product.name}
        </p>
        <p style="color: #18181b; font-size: 14px; margin: 0;">
          <strong>Vendedor:</strong> ${producerName} &lt;${producerEmail}&gt;
        </p>
      </div>
      
      <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
        Se você tiver qualquer dúvida, pode entrar em contato direto com o vendedor responsável por esse produto.
      </p>
    </div>
    
    <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 24px 0 0 0;">
      Esse email foi enviado automaticamente pela Rise Checkout.
    </p>
  </div>
</body>
</html>
        `.trim();

        // Try to send email
        try {
          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              to: { email: normalizedEmail, name: studentName },
              subject: `${producerName} te enviou acesso ao produto "${product.name}"`,
              htmlBody,
              type: "transactional",
            }),
          });

          const emailResult = await emailResponse.json();
          
          if (!emailResult.success) {
            console.warn("[members-area-students] Email failed:", emailResult.error);
          } else {
            console.log(`[members-area-students] Invite email sent to ${normalizedEmail}`);
          }
        } catch (emailErr) {
          console.error("[members-area-students] Email error:", emailErr);
        }

        return new Response(
          JSON.stringify({
            success: true,
            buyer_id: buyerId,
            is_new_buyer: isNewBuyer,
            email_sent: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    switch (action) {
      case "list": {
        if (!product_id) {
          return new Response(
            JSON.stringify({ error: "product_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Parse pagination and filter params
        const pageNum = body.page ?? 1;
        const limitNum = body.limit ?? 20;
        const searchTerm = body.search?.toLowerCase().trim() || "";
        const filterAccessType = body.access_type || null;
        const filterStatus = body.status || null;
        const filterGroupId = body.group_id || null;

        console.log(`[members-area-students] List params: page=${pageNum}, limit=${limitNum}, search="${searchTerm}", accessType=${filterAccessType}, status=${filterStatus}, groupId=${filterGroupId}`);

        // 1. Fetch all active accesses for this product
        let accessQuery = supabase
          .from("buyer_product_access")
          .select("id, buyer_id, granted_at, expires_at, access_type, order_id, is_active")
          .eq("product_id", product_id)
          .eq("is_active", true);

        // Apply access_type filter at DB level if provided
        if (filterAccessType && filterAccessType !== "all") {
          accessQuery = accessQuery.eq("access_type", filterAccessType);
        }

        const { data: accessData, error: accessError } = await accessQuery.order("granted_at", { ascending: false });

        if (accessError) {
          console.error("[members-area-students] Error fetching access:", accessError);
          throw accessError;
        }

        if (!accessData || accessData.length === 0) {
          console.log("[members-area-students] No students found");
          return new Response(
            JSON.stringify({ students: [], total: 0, page: pageNum, limit: limitNum }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const buyerIds = [...new Set(accessData.map(a => a.buyer_id))];

        // 2. Fetch buyer profiles
        const { data: buyers, error: buyersError } = await supabase
          .from("buyer_profiles")
          .select("id, name, email, last_login_at, password_hash")
          .in("id", buyerIds);

        if (buyersError) {
          console.error("[members-area-students] Error fetching buyers:", buyersError);
          throw buyersError;
        }

        const buyersMap: Record<string, { id: string; name: string | null; email: string; last_login_at: string | null; password_hash: string | null }> = {};
        buyers?.forEach(b => { buyersMap[b.id] = b; });

        // 3. Fetch buyer groups
        const { data: buyerGroupsData } = await supabase
          .from("buyer_groups")
          .select("id, buyer_id, group_id, is_active, granted_at, expires_at")
          .in("buyer_id", buyerIds)
          .eq("is_active", true);

        // If filtering by group, only keep buyers in that group
        let filteredBuyerIds = buyerIds;
        if (filterGroupId) {
          const buyersInGroup = buyerGroupsData?.filter(bg => bg.group_id === filterGroupId).map(bg => bg.buyer_id) || [];
          filteredBuyerIds = buyerIds.filter(id => buyersInGroup.includes(id));
        }

        // 4. Calculate progress per buyer
        // First get modules for this product
        const { data: modules } = await supabase
          .from("product_member_modules")
          .select("id")
          .eq("product_id", product_id)
          .eq("is_active", true);

        const moduleIds = modules?.map(m => m.id) || [];
        let totalContents = 0;
        let contentIds: string[] = [];

        if (moduleIds.length > 0) {
          const { data: contents } = await supabase
            .from("product_member_content")
            .select("id")
            .in("module_id", moduleIds)
            .eq("is_active", true);
          
          contentIds = contents?.map(c => c.id) || [];
          totalContents = contentIds.length;
        }

        // Fetch progress for all buyers
        let progressMap: Record<string, number> = {};
        if (contentIds.length > 0 && filteredBuyerIds.length > 0) {
          const { data: progressData } = await supabase
            .from("buyer_content_progress")
            .select("buyer_id, progress_percent")
            .in("buyer_id", filteredBuyerIds)
            .in("content_id", contentIds);

          // Calculate average progress per buyer
          const buyerProgressTotals: Record<string, { sum: number; count: number }> = {};
          progressData?.forEach(p => {
            if (!buyerProgressTotals[p.buyer_id]) {
              buyerProgressTotals[p.buyer_id] = { sum: 0, count: 0 };
            }
            buyerProgressTotals[p.buyer_id].sum += (p.progress_percent || 0);
            buyerProgressTotals[p.buyer_id].count += 1;
          });

          Object.keys(buyerProgressTotals).forEach(buyerId => {
            // Progress = (sum of progress for tracked contents) / total contents
            progressMap[buyerId] = totalContents > 0 
              ? Math.round(buyerProgressTotals[buyerId].sum / totalContents)
              : 0;
          });
        }

        // 5. Map to BuyerWithGroups format
        let mappedStudents = accessData
          .filter(a => filteredBuyerIds.includes(a.buyer_id))
          .map(access => {
            const buyer = buyersMap[access.buyer_id];
            if (!buyer) return null;

            const isPending = !buyer.password_hash || buyer.password_hash === "PENDING_PASSWORD_SETUP";
            const groups = (buyerGroupsData || [])
              .filter(bg => bg.buyer_id === access.buyer_id)
              .map(bg => ({
                id: bg.id,
                buyer_id: bg.buyer_id,
                group_id: bg.group_id,
                is_active: bg.is_active,
                granted_at: bg.granted_at,
                expires_at: bg.expires_at,
              }));

            return {
              buyer_id: access.buyer_id,
              buyer_email: buyer.email,
              buyer_name: buyer.name,
              groups,
              access_type: access.access_type as "purchase" | "invite" | "lifetime" | "subscription" | "limited",
              last_access_at: buyer.last_login_at,
              status: isPending ? "pending" : "active",
              invited_at: access.granted_at,
              progress_percent: progressMap[access.buyer_id] || 0,
            };
          })
          .filter(Boolean) as any[];

        // 6. Apply search filter (server-side)
        if (searchTerm) {
          mappedStudents = mappedStudents.filter(s => 
            s.buyer_email.toLowerCase().includes(searchTerm) ||
            (s.buyer_name && s.buyer_name.toLowerCase().includes(searchTerm))
          );
        }

        // 7. Apply status filter (server-side)
        if (filterStatus && filterStatus !== "all") {
          mappedStudents = mappedStudents.filter(s => s.status === filterStatus);
        }

        // 8. Calculate stats before pagination
        const total = mappedStudents.length;
        let sumProgress = 0;
        let completedCount = 0;
        mappedStudents.forEach(s => {
          sumProgress += s.progress_percent;
          if (s.progress_percent >= 100) completedCount++;
        });
        const averageProgress = total > 0 ? sumProgress / total : 0;
        const completionRate = total > 0 ? (completedCount / total) * 100 : 0;

        // 9. Paginate
        const startIndex = (pageNum - 1) * limitNum;
        const paginatedStudents = mappedStudents.slice(startIndex, startIndex + limitNum);

        console.log(`[members-area-students] Returning ${paginatedStudents.length} of ${total} students`);

        return new Response(
          JSON.stringify({ 
            students: paginatedStudents, 
            total, 
            page: pageNum, 
            limit: limitNum,
            stats: {
              totalStudents: total,
              averageProgress,
              completionRate,
            }
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get": {
        if (!buyer_id || !product_id) {
          return new Response(
            JSON.stringify({ error: "buyer_id and product_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: student, error } = await supabase
          .from("buyer_profiles")
          .select(`
            *,
            access:buyer_product_access(
              id,
              is_active,
              granted_at,
              expires_at,
              order:orders(*)
            ),
            groups:buyer_groups(
              group:product_member_groups(*)
            ),
            progress:buyer_content_progress(
              content_id,
              progress_percent,
              completed_at
            )
          `)
          .eq("id", buyer_id)
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, student }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "add-to-group": {
        if (!buyer_id || !group_id) {
          return new Response(
            JSON.stringify({ error: "buyer_id and group_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("buyer_groups")
          .upsert({
            buyer_id,
            group_id,
            is_active: true,
            granted_at: new Date().toISOString(),
          }, {
            onConflict: "buyer_id,group_id",
          });

        if (error) throw error;

        console.log(`[members-area-students] Added buyer ${buyer_id} to group ${group_id}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "remove-from-group": {
        if (!buyer_id || !group_id) {
          return new Response(
            JSON.stringify({ error: "buyer_id and group_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("buyer_groups")
          .update({ is_active: false })
          .eq("buyer_id", buyer_id)
          .eq("group_id", group_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "revoke-access": {
        if (!buyer_id || !product_id) {
          return new Response(
            JSON.stringify({ error: "buyer_id and product_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("buyer_product_access")
          .update({ is_active: false })
          .eq("buyer_id", buyer_id)
          .eq("product_id", product_id);

        if (error) throw error;

        console.log(`[members-area-students] Revoked access for buyer ${buyer_id}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "grant-access": {
        if (!buyer_id || !product_id) {
          return new Response(
            JSON.stringify({ error: "buyer_id and product_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("buyer_product_access")
          .upsert({
            buyer_id,
            product_id,
            order_id: order_id || null, // NULL for manual grants
            is_active: true,
            access_type: "invite", // Manual grants use invite type
            granted_at: new Date().toISOString(),
          }, {
            onConflict: "buyer_id,product_id",
          });

        if (error) throw error;

        console.log(`[members-area-students] Granted access to buyer ${buyer_id}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("[members-area-students] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
