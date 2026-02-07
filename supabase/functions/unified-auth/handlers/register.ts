/**
 * Register Handler - Unified Auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Creates new user account with appropriate roles.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { errorResponse } from "../../_shared/response-helpers.ts";
import {
  hashPassword,
  createSession,
  createAuthResponse,
  type AppRole,
} from "../../_shared/unified-auth-v2.ts";
import { CURRENT_HASH_VERSION } from "../../_shared/auth-constants.ts";

const log = createLogger("UnifiedAuth:Register");

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
    // - producer → registration_source: "organic"
    // - affiliate → registration_source: "affiliate"
    // - buyer → registration_source: "checkout"
    // Note: role assignment is the same for producer/affiliate (both get "seller")
    const registrationSourceValue = 
      registrationType === "producer" ? "organic" : 
      registrationType === "affiliate" ? "affiliate" : 
      "checkout";
    
    // Create user
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        password_hash_version: CURRENT_HASH_VERSION,
        name: name || null,
        phone: normalizedPhone,
        cpf_cnpj: normalizedCpfCnpj,
        account_status: "active",
        is_active: true,
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
    // RISE V3: Cadastro via /cadastro = sempre recebe role "seller"
    // Origem (producer/affiliate) é apenas marcação interna
    const roles: AppRole[] = ["buyer"]; // Everyone is a buyer
    
    if (registrationType === "producer" || registrationType === "affiliate") {
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: newUser.id,
        role: "seller",
      });
      
      if (roleError) {
        log.error("Failed to assign role:", roleError.message);
        // Rollback: deletar usuário criado
        await supabase.from("users").delete().eq("id", newUser.id);
        return errorResponse("Erro ao configurar permissões", corsHeaders, 500);
      }
      
      roles.push("seller");
    }
    
    // Set active role (seller para produtores/afiliados, buyer para compradores)
    const activeRole: AppRole = (registrationType === "producer" || registrationType === "affiliate") ? "seller" : "buyer";
    
    // Set initial context
    await supabase.from("user_active_context").insert({
      user_id: newUser.id,
      active_role: activeRole,
    });
    
    // Create session
    const session = await createSession(supabase, newUser.id, activeRole, req);
    if (!session) {
      return errorResponse("Erro ao criar sessão", corsHeaders, 500);
    }
    
    log.info("Registration successful", { userId: newUser.id, type: registrationType });
    
    return createAuthResponse(session, newUser, roles, corsHeaders);
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Register error:", msg);
    return errorResponse("Erro ao processar cadastro", corsHeaders, 500);
  }
}
