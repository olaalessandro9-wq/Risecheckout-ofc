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
  registrationType?: "producer" | "buyer";
}

export async function handleRegister(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: RegisterRequest = await req.json();
    const { email, password, name, phone, registrationType = "buyer" } = body;
    
    // Validate input
    if (!email || !password) {
      return errorResponse("Email e senha são obrigatórios", corsHeaders, 400);
    }
    
    if (password.length < 8) {
      return errorResponse("Senha deve ter no mínimo 8 caracteres", corsHeaders, 400);
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();
    
    if (existingUser) {
      return errorResponse("Este email já está cadastrado", corsHeaders, 409);
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        password_hash_version: CURRENT_HASH_VERSION,
        name: name || null,
        phone: phone || null,
        account_status: "active",
        is_active: true,
        registration_source: registrationType === "producer" ? "organic" : "checkout",
      })
      .select("id, email, name")
      .single();
    
    if (createError || !newUser) {
      log.error("Error creating user:", createError?.message);
      return errorResponse("Erro ao criar conta", corsHeaders, 500);
    }
    
    // Assign roles based on registration type
    const roles: AppRole[] = ["buyer"]; // Everyone is a buyer
    
    if (registrationType === "producer") {
      roles.push("user"); // Producer role
      
      // Insert producer role
      await supabase.from("user_roles").insert({
        user_id: newUser.id,
        role: "user",
      });
    }
    
    // Set active role
    const activeRole: AppRole = registrationType === "producer" ? "user" : "buyer";
    
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
