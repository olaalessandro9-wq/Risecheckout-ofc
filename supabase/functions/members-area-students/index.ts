import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
          onConflict: "buyer_id,product_id,order_id",
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

        // 2. Grant product access
        const { error: accessError } = await supabase
          .from("buyer_product_access")
          .upsert({
            buyer_id: buyerId,
            product_id,
            order_id: "00000000-0000-0000-0000-000000000000", // Manual grant
            is_active: true,
            access_type: "manual",
            granted_at: new Date().toISOString(),
          }, {
            onConflict: "buyer_id,product_id,order_id",
          });

        if (accessError) {
          console.error("[members-area-students] Error granting access:", accessError);
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

        // Fetch students with access
        const { data: students, error } = await supabase
          .from("buyer_product_access")
          .select(`
            id,
            is_active,
            granted_at,
            expires_at,
            access_type,
            buyer_id,
            order_id
          `)
          .eq("product_id", product_id)
          .order("granted_at", { ascending: false });

        if (error) throw error;

        // Get buyer details
        const buyerIds = [...new Set(students?.map(s => s.buyer_id).filter(Boolean) || [])];
        
        const { data: buyers } = await supabase
          .from("buyer_profiles")
          .select("id, name, email, created_at")
          .in("id", buyerIds);

        const buyersMap: Record<string, { id: string; name: string | null; email: string; created_at: string }> = {};
        buyers?.forEach(b => { buyersMap[b.id] = b; });
        
        const { data: buyerGroups } = await supabase
          .from("buyer_groups")
          .select(`
            buyer_id,
            group_id
          `)
          .in("buyer_id", buyerIds)
          .eq("is_active", true);

        // Get group names
        const groupIds = [...new Set(buyerGroups?.map(bg => bg.group_id) || [])];
        const { data: groups } = await supabase
          .from("product_member_groups")
          .select("id, name")
          .in("id", groupIds);

        const groupsMap: Record<string, string> = {};
        groups?.forEach(g => { groupsMap[g.id] = g.name; });

        // Map groups by buyer
        const groupsByBuyer: Record<string, { id: string; name: string }[]> = {};
        buyerGroups?.forEach(bg => {
          if (!groupsByBuyer[bg.buyer_id]) {
            groupsByBuyer[bg.buyer_id] = [];
          }
          groupsByBuyer[bg.buyer_id].push({
            id: bg.group_id,
            name: groupsMap[bg.group_id] || "Unknown",
          });
        });

        // Add data to students
        const studentsWithGroups = students?.map(s => ({
          ...s,
          buyer: buyersMap[s.buyer_id] || null,
          groups: groupsByBuyer[s.buyer_id] || [],
        }));

        return new Response(
          JSON.stringify({ success: true, students: studentsWithGroups }),
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
            order_id: order_id || "00000000-0000-0000-0000-000000000000",
            is_active: true,
            access_type: "manual",
            granted_at: new Date().toISOString(),
          }, {
            onConflict: "buyer_id,product_id,order_id",
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
