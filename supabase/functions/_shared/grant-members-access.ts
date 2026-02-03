/**
 * ============================================================================
 * GRANT MEMBERS ACCESS - Helper Compartilhado
 * ============================================================================
 * 
 * Concede acesso à área de membros automaticamente após compra aprovada.
 * Usado pelos webhooks de pagamento (MercadoPago, Asaas, Stripe).
 * 
 * @version 4.0.0 - RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * SSOT: users table is the single source of truth
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";
import { buildSiteUrl } from "./site-urls.ts";

const log = createLogger("GrantMembersAccess");

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
 * RISE V3 10.0/10: users table is the ONLY SSOT
 * 
 * Fluxo:
 * 1. Verifica se produto tem members_area_enabled
 * 2. Busca ou cria user (NOT buyer_profiles)
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
  
  log.info('Iniciando concessão de acesso', { orderId, productId, customerEmail, offerId });

  // ========================================================================
  // 1. VERIFICAR SE PRODUTO TEM ÁREA DE MEMBROS
  // ========================================================================

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, members_area_enabled, user_id')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    log.warn('Produto não encontrado', { productId, error: productError });
    return { success: false, hasMembersArea: false, error: 'Produto não encontrado' };
  }

  if (!product.members_area_enabled) {
    log.info('Produto não tem área de membros habilitada', { productId });
    return { success: true, hasMembersArea: false };
  }

  log.info('Produto tem área de membros habilitada', { productId, productName: product.name });

  // ========================================================================
  // 2. RISE V3: BUSCAR OU CRIAR USER (NOT buyer_profiles)
  // ========================================================================

  const normalizedEmail = customerEmail.toLowerCase().trim();

  let { data: existingUser } = await supabase
    .from('users')
    .select('id, email, name, account_status')
    .eq('email', normalizedEmail)
    .single();

  let buyerId: string;
  let isNewBuyer = false;
  let needsPasswordSetup = false;

  if (!existingUser) {
    // RISE V3: Create new user in users table (SSOT)
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: normalizedEmail,
        name: customerName || null,
        password_hash: null,
        account_status: 'pending_setup',
        is_active: true,
      })
      .select('id, email, name')
      .single();

    if (createError) {
      log.error('Erro ao criar user', createError);
      return { success: false, hasMembersArea: true, error: 'Erro ao criar perfil do comprador' };
    }

    buyerId = newUser.id;
    isNewBuyer = true;
    needsPasswordSetup = true;
    log.info('Novo user criado (SSOT)', { buyerId, email: normalizedEmail });
  } else {
    buyerId = existingUser.id;
    // RISE V3: Use account_status instead of password_hash markers
    needsPasswordSetup = existingUser.account_status === 'pending_setup' || existingUser.account_status === 'reset_required';
    
    // Atualizar nome se não tiver
    if (customerName && !existingUser.name) {
      await supabase
        .from('users')
        .update({ name: customerName })
        .eq('id', buyerId);
    }
    
    log.info('User existente encontrado', { buyerId, needsPasswordSetup });
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
    log.error('Erro ao conceder acesso ao produto', accessError);
    // Não é erro fatal, o acesso pode já existir
  } else {
    log.info('Acesso ao produto concedido', { buyerId, productId, orderId });
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
      log.info('Grupo encontrado na oferta', { offerId, groupId: assignedGroupId });
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
      log.info('Usando grupo padrão do produto', { productId, groupId: assignedGroupId });
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
      log.warn('Erro ao atribuir buyer ao grupo', groupError);
    } else {
      log.info('Buyer atribuído ao grupo', { buyerId, groupId: assignedGroupId });
    }
  } else {
    log.warn('Nenhum grupo encontrado para atribuir', { productId, offerId });
  }

  // ========================================================================
  // 5. GERAR INVITE TOKEN (se precisar setup de senha)
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
      log.error('Erro ao criar invite token', tokenError);
      // Não é erro fatal
    } else {
      inviteToken = rawToken;
      accessUrl = buildSiteUrl(`/minha-conta/setup-acesso?token=${rawToken}`, 'members');
      log.info('Invite token criado', { buyerId, productId });
    }
  } else {
    // Buyer já tem senha, link direto para login
    accessUrl = buildSiteUrl('/minha-conta', 'members');
  }

  // ========================================================================
  // 6. RETORNAR RESULTADO
  // ========================================================================

  log.info('Acesso à área de membros concedido com sucesso', {
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
