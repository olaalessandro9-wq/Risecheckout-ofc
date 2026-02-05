/**
 * Handler: Send invite to student (authenticated)
 * 
 * RISE Protocol V3 - 10.0/10 Compliant
 * Uses 'users' table as SSOT for producer name lookup
 * Uses standardized email template from email-templates-student-invite.ts
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hashToken } from "../helpers/hash.ts";
import { generateToken } from "../helpers/token.ts";
import { jsonResponse } from "../helpers/response.ts";
import { sendEmail } from "../../_shared/zeptomail.ts";
import { createLogger } from "../../_shared/logger.ts";
import { buildSiteUrl } from "../../_shared/site-urls.ts";
import { getStudentInviteTemplate, getStudentInviteTextTemplate } from "../../_shared/email-templates-student-invite.ts";
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

  const accessLink = buildSiteUrl(`/minha-conta/setup-acesso?token=${rawToken}`, 'members');

  // RISE V3: Use 'users' table as SSOT for producer name
  const { data: producerUser } = await supabase.from("users").select("name").eq("id", producerId).single();
  const studentName = name || normalizedEmail.split("@")[0];
  const producerName = (producerUser as { name: string } | null)?.name || "Produtor";

  // RISE V3: Use standardized email template
  const emailData = {
    studentName,
    productName: typedProduct.name,
    producerName,
    accessLink,
  };

  const emailResult = await sendEmail({
    to: { email: normalizedEmail, name: studentName },
    subject: `${producerName} te enviou acesso ao produto "${typedProduct.name}"`,
    htmlBody: getStudentInviteTemplate(emailData),
    textBody: getStudentInviteTextTemplate(emailData),
    type: "transactional",
  });

  if (!emailResult.success) {
    log.error("Failed to send invite email:", emailResult.error);
  }

  return jsonResponse({ success: true, buyer_id: userId, is_new_buyer: isNewBuyer, email_sent: emailResult.success }, 200, corsHeaders);
}
