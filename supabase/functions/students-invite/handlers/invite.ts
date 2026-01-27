/**
 * Handler: Send invite to student (authenticated)
 * RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hashToken } from "../helpers/hash.ts";
import { generateToken } from "../helpers/token.ts";
import { jsonResponse } from "../helpers/response.ts";
import { sendEmail } from "../../_shared/zeptomail.ts";
import { createLogger } from "../../_shared/logger.ts";
import type { ProductData } from "../types.ts";

const log = createLogger("students-invite-handler");

export async function handleInvite(
  supabase: SupabaseClient,
  producerId: string,
  productId: string | undefined,
  email: string | undefined,
  name: string | undefined,
  groupIds: string[] | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!productId || !email) {
    return jsonResponse({ error: "product_id and email required" }, 400, corsHeaders);
  }

  const { data: product, error: productError } = await supabase.from("products").select("id, user_id, name, image_url").eq("id", productId).single();
  const typedProduct = product as ProductData & { user_id: string } | null;
  if (productError || !typedProduct || typedProduct.user_id !== producerId) {
    return jsonResponse({ error: "Product not found or access denied" }, 403, corsHeaders);
  }

  const normalizedEmail = email.toLowerCase().trim();
  
  // RISE V3: Look up user in users table only (SSOT)
  let userId: string;
  let isNewBuyer = false;

  const { data: existingUser } = await supabase.from("users").select("id, email, name").eq("email", normalizedEmail).single();

  if (existingUser) {
    userId = existingUser.id;
    if (name && !existingUser.name) {
      await supabase.from("users").update({ name }).eq("id", userId);
    }
  } else {
    // Create new user in users table
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({ email: normalizedEmail, name: name || null, password_hash: "PENDING_PASSWORD_SETUP", account_status: "active" })
      .select("id")
      .single();
    if (createError) {
      return jsonResponse({ error: "Erro ao criar perfil do aluno" }, 500, corsHeaders);
    }
    userId = newUser.id;
    isNewBuyer = true;
  }

  // RISE V3: Use users.id for buyer_product_access
  await supabase.from("buyer_product_access").upsert({
    buyer_id: userId,
    product_id: productId,
    order_id: null,
    is_active: true,
    access_type: "invite",
    granted_at: new Date().toISOString(),
  }, { onConflict: "buyer_id,product_id" });

  // RISE V3: Use users.id for buyer_groups
  if (groupIds && groupIds.length > 0) {
    await supabase.from("buyer_groups").delete().eq("buyer_id", userId);
    const groupInserts = groupIds.map((gid: string) => ({ buyer_id: userId, group_id: gid, is_active: true, granted_at: new Date().toISOString() }));
    await supabase.from("buyer_groups").insert(groupInserts);
  }

  const rawToken = generateToken();
  const tokenHash = await hashToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // RISE V3: Use users.id for student_invite_tokens
  await supabase.from("student_invite_tokens").insert({ token_hash: tokenHash, buyer_id: userId, product_id: productId, invited_by: producerId, expires_at: expiresAt.toISOString() });

  const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://risecheckout.com";
  const accessLink = `${baseUrl}/minha-conta/setup-acesso?token=${rawToken}`;

  const { data: producerProfile } = await supabase.from("profiles").select("name").eq("id", producerId).single();
  const studentName = name || normalizedEmail.split("@")[0];
  const producerName = (producerProfile as { name: string } | null)?.name || "Produtor";

  // Send email using shared module
  const emailResult = await sendEmail({
    to: { email: normalizedEmail, name: studentName },
    subject: `${producerName} te enviou acesso ao produto "${typedProduct.name}"`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Você recebeu acesso!</h1>
        <p>Olá ${studentName},</p>
        <p>${producerName} te concedeu acesso ao produto <strong>${typedProduct.name}</strong>.</p>
        <p>Clique no botão abaixo para configurar sua senha e acessar o conteúdo:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${accessLink}" 
             style="background-color: #10B981; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Acessar Conteúdo
          </a>
        </p>
        <p style="color: #666; font-size: 12px;">
          Este link expira em 7 dias. Se você não solicitou este acesso, ignore este email.
        </p>
      </div>
    `,
    type: "transactional",
  });

  if (!emailResult.success) {
    log.error("Failed to send invite email:", emailResult.error);
  }

  return jsonResponse({ success: true, buyer_id: userId, is_new_buyer: isNewBuyer, email_sent: emailResult.success }, 200, corsHeaders);
}
