/**
 * Register Handler - Unified Auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Creates new user account with email verification flow.
 * User is NOT auto-logged-in; must verify email first.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { jsonResponse, errorResponse } from "../../_shared/response-helpers.ts";
import {
  hashPassword,
  type AppRole,
} from "../../_shared/unified-auth-v2.ts";
import { CURRENT_HASH_VERSION, AccountStatus } from "../../_shared/auth-constants.ts";
import { sendEmail } from "../../_shared/zeptomail.ts";
import { getEmailVerificationTemplate, getEmailVerificationTextTemplate } from "../../_shared/email-templates-verification.ts";
import { buildSiteUrl } from "../../_shared/site-urls.ts";

const log = createLogger("UnifiedAuth:Register");

/** Verification token validity in milliseconds (24 hours) */
const TOKEN_VALIDITY_MS = 24 * 60 * 60 * 1000;

interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  cpf_cnpj?: string;
  registrationType?: "producer" | "affiliate" | "buyer";
  termsAccepted?: boolean;
}

export async function handleRegister(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: RegisterRequest = await req.json();
    const { email, password, name, phone, cpf_cnpj, registrationType = "buyer", termsAccepted } = body;
    
    // Validate input
    if (!email || !password) {
      return errorResponse("Email e senha são obrigatórios", corsHeaders, 400);
    }
    
    // RISE V3: Validar aceite obrigatório de termos
    if (termsAccepted !== true) {
      return errorResponse("É obrigatório aceitar os Termos de Uso e Política de Privacidade", corsHeaders, 400);
    }
    
    if (password.length < 8) {
      return errorResponse("Senha deve ter no mínimo 8 caracteres", corsHeaders, 400);
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // RISE V3: Normalizar phone e cpf_cnpj (remover máscara)
    const normalizedPhone = phone?.replace(/\D/g, '') || null;
    const normalizedCpfCnpj = cpf_cnpj?.replace(/\D/g, '') || null;
    
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();
    
    if (existingUser) {
      return errorResponse("Este email já está cadastrado", corsHeaders, 409);
    }
    
    // RISE V3: Verificar unicidade de phone
    if (normalizedPhone) {
      const { data: existingPhone } = await supabase
        .from("users")
        .select("id")
        .eq("phone", normalizedPhone)
        .single();
      
      if (existingPhone) {
        return errorResponse("Este telefone já está cadastrado", corsHeaders, 409);
      }
    }
    
    // RISE V3: Verificar unicidade de cpf_cnpj
    if (normalizedCpfCnpj) {
      const { data: existingDoc } = await supabase
        .from("users")
        .select("id")
        .eq("cpf_cnpj", normalizedCpfCnpj)
        .single();
      
      if (existingDoc) {
        return errorResponse("Este CPF/CNPJ já está cadastrado", corsHeaders, 409);
      }
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // RISE V3: Map all registration types to their correct sources
    const registrationSourceValue = 
      registrationType === "producer" ? "organic" : 
      registrationType === "affiliate" ? "affiliate" : 
      "checkout";
    
    // Generate email verification token
    const verificationToken = crypto.randomUUID();
    const tokenExpiresAt = new Date(Date.now() + TOKEN_VALIDITY_MS).toISOString();
    
    // Create user with pending_email_verification status (NOT active)
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        password_hash_version: CURRENT_HASH_VERSION,
        name: name || null,
        phone: normalizedPhone,
        cpf_cnpj: normalizedCpfCnpj,
        account_status: AccountStatus.PENDING_EMAIL_VERIFICATION,
        is_active: true,
        email_verified: false,
        email_verification_token: verificationToken,
        email_verification_token_expires_at: tokenExpiresAt,
        registration_source: registrationSourceValue,
        terms_accepted_at: new Date().toISOString(),
      })
      .select("id, email, name")
      .single();
    
    if (createError || !newUser) {
      log.error("Error creating user:", createError?.message);
      return errorResponse("Erro ao criar conta", corsHeaders, 500);
    }
    
    // Assign roles based on registration type
    const roles: AppRole[] = ["buyer"];
    
    if (registrationType === "producer" || registrationType === "affiliate") {
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: newUser.id,
        role: "seller",
      });
      
      if (roleError) {
        log.error("Failed to assign role:", roleError.message);
        await supabase.from("users").delete().eq("id", newUser.id);
        return errorResponse("Erro ao configurar permissões", corsHeaders, 500);
      }
      
      roles.push("seller");
    }
    
    // Set active role
    const activeRole: AppRole = (registrationType === "producer" || registrationType === "affiliate") ? "seller" : "buyer";
    
    // Set initial context
    await supabase.from("user_active_context").insert({
      user_id: newUser.id,
      active_role: activeRole,
    });
    
    // Build verification URL
    const verificationUrl = buildSiteUrl(`/confirmar-email?token=${verificationToken}`);
    
    // Send verification email via ZeptoMail
    const emailResult = await sendEmail({
      to: { email: normalizedEmail, name: name || normalizedEmail },
      subject: "Confirme seu email - Rise Checkout",
      htmlBody: getEmailVerificationTemplate({
        userName: name || "Usuário",
        verificationUrl,
      }),
      textBody: getEmailVerificationTextTemplate({
        userName: name || "Usuário",
        verificationUrl,
      }),
      type: "transactional",
      trackClicks: false,
      trackOpens: false,
    });
    
    if (!emailResult.success) {
      log.error("Failed to send verification email:", emailResult.error);
      // Don't fail registration - user can resend later
    }
    
    log.info("Registration successful (pending verification)", { 
      userId: newUser.id, 
      type: registrationType,
      emailSent: emailResult.success,
    });
    
    // RISE V3: Do NOT create session. Return success with verification flag.
    return jsonResponse({
      success: true,
      requiresEmailVerification: true,
      email: normalizedEmail,
    }, corsHeaders);
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Register error:", msg);
    return errorResponse("Erro ao processar cadastro", corsHeaders, 500);
  }
}