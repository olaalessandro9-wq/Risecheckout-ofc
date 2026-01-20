/**
 * User Sync - Sincronização entre auth.users e profiles
 * 
 * RISE Protocol V3 Compliant
 * 
 * Resolve inconsistências onde usuário existe em auth.users
 * mas não em profiles (causado por falhas parciais no registro).
 * 
 * @version 1.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";

const log = createLogger("UserSync");

// ============================================================================
// TYPES
// ============================================================================

interface AuthUserInfo {
  id: string;
  email: string;
  created_at: string;
}

interface SyncResult {
  success: boolean;
  profileId?: string;
  error?: string;
  wasOrphaned?: boolean;
}

// ============================================================================
// CHECK AUTH USER EXISTS
// ============================================================================

/**
 * Verifica se um email existe em auth.users
 * 
 * RISE Protocol V3 Compliant - Query direta via RPC function
 * Performance O(1) - Não depende de paginação
 * 
 * @param supabase - Cliente Supabase com acesso service_role
 * @param email - Email a verificar
 * @returns Dados do usuário ou null se não existe
 */
export async function checkAuthUserExists(
  supabase: SupabaseClient,
  email: string
): Promise<AuthUserInfo | null> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Query direta via RPC function - Performance O(1)
    const { data, error } = await supabase.rpc("get_auth_user_by_email", {
      user_email: normalizedEmail,
    });

    if (error) {
      log.error("Error querying auth user by email:", error.message);
      return null;
    }

    // RPC retorna array, pegar primeiro resultado
    const user = Array.isArray(data) ? data[0] : data;

    if (user && user.email) {
      log.debug(`Found user in auth.users: ${user.email}`);
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      };
    }

    log.debug(`User not found in auth.users: ${normalizedEmail}`);
    return null;
  } catch (err) {
    log.error("Unexpected error checking auth user:", err);
    return null;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extrai um nome amigável do email
 * 
 * Exemplos:
 * - "joao.silva@email.com" → "Joao Silva"
 * - "rdgsandro1@gmail.com" → "Rdgsandro"
 * - "maria_santos123@hotmail.com" → "Maria Santos"
 * - "123456@test.com" → "Usuário"
 * 
 * @param email - Email do usuário
 * @returns Nome extraído ou "Usuário" como fallback
 */
function extractNameFromEmail(email: string): string {
  const localPart = email.split("@")[0];

  // Remove números e caracteres especiais, substitui pontos/underscores por espaços
  const cleaned = localPart
    .replace(/[0-9]/g, "")
    .replace(/[._-]/g, " ")
    .trim();

  if (!cleaned) {
    return "Usuário";
  }

  // Capitaliza cada palavra
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// ============================================================================
// CREATE ORPHANED PROFILE
// ============================================================================

/**
 * Cria um profile para um usuário que existe em auth.users
 * mas não tem profile correspondente
 * 
 * RISE Protocol V3 Compliant:
 * - Garante que name nunca seja null (profiles.name é NOT NULL)
 * - Extrai nome do email se não fornecido via metadata
 * 
 * @param supabase - Cliente Supabase
 * @param email - Email do usuário
 * @param authUserId - ID do usuário em auth.users
 * @param metadata - Dados adicionais opcionais
 * @returns true se criou com sucesso
 */
export async function createOrphanedUserProfile(
  supabase: SupabaseClient,
  email: string,
  authUserId: string,
  metadata?: { name?: string; phone?: string }
): Promise<boolean> {
  try {
    // RISE V3: Garantir name nunca seja null (profiles.name é NOT NULL)
    const extractedName = extractNameFromEmail(email);
    const finalName = metadata?.name || extractedName;

    const { error } = await supabase.from("profiles").insert({
      id: authUserId,
      email: email.toLowerCase().trim(),
      name: finalName, // NUNCA será null
      created_at: new Date().toISOString(),
      // password_hash será null, forçando recuperação de senha
      password_hash: null,
      account_status: "pending_setup",
    });

    if (error) {
      // Ignorar se já existe (race condition)
      if (error.code === "23505") {
        log.info(`Profile already exists for: ${email}`);
        return true;
      }
      log.error("Failed to create orphaned profile:", error.message);
      return false;
    }

    log.info(`Orphaned profile created for: ${email} with name: ${finalName}`);
    return true;
  } catch (err) {
    log.error("Unexpected error creating orphaned profile:", err);
    return false;
  }
}

// ============================================================================
// SYNC ORPHANED USER
// ============================================================================

/**
 * Verifica e sincroniza um usuário que pode estar órfão
 * (existe em auth.users mas não em profiles)
 * 
 * @param supabase - Cliente Supabase
 * @param email - Email do usuário
 * @returns Resultado da sincronização
 */
export async function syncOrphanedAuthUser(
  supabase: SupabaseClient,
  email: string
): Promise<SyncResult> {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Verificar se profile já existe
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .single();

  if (existingProfile) {
    return {
      success: true,
      profileId: existingProfile.id,
      wasOrphaned: false,
    };
  }

  // 2. Verificar se existe em auth.users
  const authUser = await checkAuthUserExists(supabase, normalizedEmail);

  if (!authUser) {
    return {
      success: false,
      error: "Usuário não encontrado.",
    };
  }

  // 3. Usuário está órfão - criar profile
  log.info(`Found orphaned auth user: ${email}, syncing...`);

  const created = await createOrphanedUserProfile(
    supabase,
    normalizedEmail,
    authUser.id
  );

  if (!created) {
    return {
      success: false,
      error: "Erro ao sincronizar conta. Tente novamente.",
    };
  }

  return {
    success: true,
    profileId: authUser.id,
    wasOrphaned: true,
  };
}

// ============================================================================
// CHECK AND SYNC FOR REGISTRATION
// ============================================================================

/**
 * Verifica se um email pode ser registrado
 * Se estiver órfão, sincroniza automaticamente
 * 
 * @param supabase - Cliente Supabase
 * @param email - Email a verificar
 * @returns Resultado indicando se pode registrar ou se já existe
 */
export async function checkEmailForRegistration(
  supabase: SupabaseClient,
  email: string
): Promise<{
  canRegister: boolean;
  existsInProfiles: boolean;
  existsInAuth: boolean;
  profileId?: string;
  message?: string;
}> {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Verificar profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, password_hash")
    .eq("email", normalizedEmail)
    .single();

  if (profile) {
    return {
      canRegister: false,
      existsInProfiles: true,
      existsInAuth: true,
      profileId: profile.id,
      message: "Este email já está cadastrado. Faça login ou recupere sua senha.",
    };
  }

  // 2. Verificar auth.users (pode estar órfão)
  const authUser = await checkAuthUserExists(supabase, normalizedEmail);

  if (authUser) {
    // Usuário órfão - sincronizar
    const synced = await createOrphanedUserProfile(
      supabase,
      normalizedEmail,
      authUser.id
    );

    if (synced) {
      return {
        canRegister: false,
        existsInProfiles: true,
        existsInAuth: true,
        profileId: authUser.id,
        message: "Este email já está cadastrado. Use 'Esqueci minha senha' para definir uma nova senha.",
      };
    }
  }

  // 3. Email livre para registro
  return {
    canRegister: true,
    existsInProfiles: false,
    existsInAuth: false,
  };
}
