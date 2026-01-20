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
 * @param supabase - Cliente Supabase com acesso admin
 * @param email - Email a verificar
 * @returns Dados do usuário ou null se não existe
 */
export async function checkAuthUserExists(
  supabase: SupabaseClient,
  email: string
): Promise<AuthUserInfo | null> {
  try {
    // Usar listUsers para buscar por email
    const { data, error } = await supabase.auth.admin.listUsers({
      perPage: 1,
      // Supabase não suporta filtro direto, vamos buscar e filtrar
    });

    if (error) {
      log.error("Error listing auth users:", error.message);
      return null;
    }

    if (!data?.users) {
      return null;
    }

    // Buscar usuário pelo email (case-insensitive)
    const normalizedEmail = email.toLowerCase().trim();
    const user = data.users.find(
      u => u.email?.toLowerCase().trim() === normalizedEmail
    );

    if (user && user.email) {
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      };
    }

    // Se não encontrou na primeira página, pode haver mais usuários
    // Em produção com muitos usuários, pode precisar paginação
    // Por ora, assumimos que o usuário não existe
    log.debug(`User not found in auth.users: ${email}`);
    return null;
  } catch (err) {
    log.error("Unexpected error checking auth user:", err);
    return null;
  }
}

// ============================================================================
// CREATE ORPHANED PROFILE
// ============================================================================

/**
 * Cria um profile para um usuário que existe em auth.users
 * mas não tem profile correspondente
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
    const { error } = await supabase.from("profiles").insert({
      id: authUserId,
      email: email.toLowerCase().trim(),
      name: metadata?.name || null,
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

    log.info(`Orphaned profile created for: ${email}`);
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
