/**
 * ============================================================================
 * GRANT MEMBERS ACCESS - Helper Compartilhado
 * ============================================================================
 * 
 * Concede acesso à área de membros automaticamente após compra aprovada.
 * Usado pelos webhooks de pagamento (MercadoPago, Asaas, Stripe).
 * 
 * RISE Protocol V2 Compliant - Zero `any`
 * @version 2.0.0
 * Data de Criação: 2026-01-06
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// TYPES
// ============================================================================

export interface GrantAccessInput {
  orderId: string;
  customerEmail: string;
  customerName: string | null;
  productId: string;
  productName: string | null;
  offerId?: string; // ID da oferta para buscar grupo vinculado
}

export interface GrantAccessResult {
  success: boolean;
  hasMembersArea: boolean;
  buyerId?: string;
  isNewBuyer?: boolean;
  inviteToken?: string;
  accessUrl?: string;
  assignedGroupId?: string; // Grupo atribuído ao buyer
  error?: string;
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

function logInfo(message: string, data?: unknown) {
  console.log(`[grant-members-access] [INFO] ${message}`, data ? JSON.stringify(data) : '');
}

function logWarn(message: string, data?: unknown) {
  console.warn(`[grant-members-access] [WARN] ${message}`, data ? JSON.stringify(data) : '');
}

function logError(message: string, error?: unknown) {
  console.error(`[grant-members-access] [ERROR] ${message}`, error);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomUUID() + "-" + crypto.randomUUID();
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Concede acesso à área de membros para uma compra.
 * 
 * Fluxo:
 * 1. Verifica se produto tem members_area_enabled
 * 2. Busca ou cria buyer_profile
 * 3. Cria buyer_product_access (se não existir)
 * 4. Gera invite_token para novos buyers
 * 5. Retorna URL de acesso
 * 
 * @param supabase - Cliente Supabase com service role
 * @param input - Dados do pedido
 * @returns Resultado da operação
 */
export async function grantMembersAccess(
  supabase: SupabaseClient,
  input: GrantAccessInput
): Promise<GrantAccessResult> {
  
  const { orderId, customerEmail, customerName, productId, productName, offerId } = input;
  
  logInfo('Iniciando concessão de acesso', { orderId, productId, customerEmail, offerId });

  // ========================================================================
  // 1. VERIFICAR SE PRODUTO TEM ÁREA DE MEMBROS
  // ========================================================================

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, members_area_enabled, user_id')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    logWarn('Produto não encontrado', { productId, error: productError });
    return { success: false, hasMembersArea: false, error: 'Produto não encontrado' };
  }

  if (!product.members_area_enabled) {
    logInfo('Produto não tem área de membros habilitada', { productId });
    return { success: true, hasMembersArea: false };
  }

  logInfo('Produto tem área de membros habilitada', { productId, productName: product.name });

  // ========================================================================
  // 2. BUSCAR OU CRIAR BUYER_PROFILE
  // ========================================================================

  const normalizedEmail = customerEmail.toLowerCase().trim();

  let { data: existingBuyer } = await supabase
    .from('buyer_profiles')
    .select('id, email, name, password_hash')
    .eq('email', normalizedEmail)
    .single();

  let buyerId: string;
  let isNewBuyer = false;
  let needsPasswordSetup = false;

  if (!existingBuyer) {
    // Criar novo buyer profile com senha pendente
    const { data: newBuyer, error: createError } = await supabase
      .from('buyer_profiles')
      .insert({
        email: normalizedEmail,
        name: customerName || null,
        password_hash: 'PENDING_PASSWORD_SETUP',
        is_active: true,
      })
      .select('id, email, name')
      .single();

    if (createError) {
      logError('Erro ao criar buyer profile', createError);
      return { success: false, hasMembersArea: true, error: 'Erro ao criar perfil do comprador' };
    }

    buyerId = newBuyer.id;
    isNewBuyer = true;
    needsPasswordSetup = true;
    logInfo('Novo buyer profile criado', { buyerId, email: normalizedEmail });
  } else {
    buyerId = existingBuyer.id;
    needsPasswordSetup = !existingBuyer.password_hash || existingBuyer.password_hash === 'PENDING_PASSWORD_SETUP';
    
    // Atualizar nome se não tiver
    if (customerName && !existingBuyer.name) {
      await supabase
        .from('buyer_profiles')
        .update({ name: customerName })
        .eq('id', buyerId);
    }
    
    logInfo('Buyer profile existente encontrado', { buyerId, needsPasswordSetup });
  }

  // ========================================================================
  // 3. CRIAR BUYER_PRODUCT_ACCESS
  // ========================================================================

  const { error: accessError } = await supabase
    .from('buyer_product_access')
    .upsert({
      buyer_id: buyerId,
      product_id: productId,
      order_id: orderId,
      is_active: true,
      access_type: 'purchase',
      granted_at: new Date().toISOString(),
    }, {
      onConflict: 'buyer_id,product_id',
    });

  if (accessError) {
    logError('Erro ao conceder acesso ao produto', accessError);
    // Não é erro fatal, o acesso pode já existir
  } else {
    logInfo('Acesso ao produto concedido', { buyerId, productId, orderId });
  }

  // ========================================================================
  // 4. ATRIBUIR BUYER AO GRUPO
  // ========================================================================

  let assignedGroupId: string | undefined;

  // 4.1 Buscar grupo da oferta (se houver offerId)
  if (offerId) {
    const { data: offer } = await supabase
      .from('offers')
      .select('member_group_id')
      .eq('id', offerId)
      .single();
    
    if (offer?.member_group_id) {
      assignedGroupId = offer.member_group_id;
      logInfo('Grupo encontrado na oferta', { offerId, groupId: assignedGroupId });
    }
  }

  // 4.2 Se oferta não tem grupo, buscar grupo padrão do produto
  if (!assignedGroupId) {
    const { data: defaultGroup } = await supabase
      .from('product_member_groups')
      .select('id')
      .eq('product_id', productId)
      .eq('is_default', true)
      .single();
    
    if (defaultGroup?.id) {
      assignedGroupId = defaultGroup.id;
      logInfo('Usando grupo padrão do produto', { productId, groupId: assignedGroupId });
    }
  }

  // 4.3 Atribuir buyer ao grupo
  if (assignedGroupId) {
    const { error: groupError } = await supabase
      .from('buyer_groups')
      .upsert({
        buyer_id: buyerId,
        group_id: assignedGroupId,
        is_active: true,
        granted_at: new Date().toISOString(),
      }, {
        onConflict: 'buyer_id,group_id',
      });

    if (groupError) {
      logWarn('Erro ao atribuir buyer ao grupo', groupError);
    } else {
      logInfo('Buyer atribuído ao grupo', { buyerId, groupId: assignedGroupId });
    }
  } else {
    logWarn('Nenhum grupo encontrado para atribuir', { productId, offerId });
  }

  // ========================================================================
  // 4. GERAR INVITE TOKEN (se precisar setup de senha)
  // ========================================================================

  let inviteToken: string | undefined;
  let accessUrl: string | undefined;

  if (needsPasswordSetup) {
    const rawToken = generateToken();
    const tokenHash = await hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    const { error: tokenError } = await supabase
      .from('student_invite_tokens')
      .insert({
        token_hash: tokenHash,
        buyer_id: buyerId,
        product_id: productId,
        invited_by: product.user_id, // Produtor do produto
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      logError('Erro ao criar invite token', tokenError);
      // Não é erro fatal
    } else {
      inviteToken = rawToken;
      const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://risecheckout.com';
      accessUrl = `${baseUrl}/minha-conta/setup-acesso?token=${rawToken}`;
      logInfo('Invite token criado', { buyerId, productId });
    }
  } else {
    // Buyer já tem senha, link direto para login
    const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://risecheckout.com';
    accessUrl = `${baseUrl}/minha-conta`;
  }

  // ========================================================================
  // 6. RETORNAR RESULTADO
  // ========================================================================

  logInfo('Acesso à área de membros concedido com sucesso', {
    orderId,
    buyerId,
    productId,
    isNewBuyer,
    hasInviteToken: !!inviteToken,
    assignedGroupId,
  });

  return {
    success: true,
    hasMembersArea: true,
    buyerId,
    isNewBuyer,
    inviteToken,
    accessUrl,
    assignedGroupId,
  };
}
