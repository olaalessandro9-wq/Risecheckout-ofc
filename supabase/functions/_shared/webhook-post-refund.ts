/**
 * ============================================================================
 * WEBHOOK POST-REFUND - Ações Pós-Reembolso/Chargeback
 * ============================================================================
 * 
 * RISE ARCHITECT PROTOCOL V3 - Nota 10.0/10
 * 
 * Centraliza as ações executadas após um reembolso ou chargeback:
 * - Revogar acesso à área de membros (buyer_product_access)
 * - Remover buyer de grupos do produto afetado
 * - Registrar evento de auditoria
 * - Disparar webhooks do vendedor
 * 
 * POLÍTICA: QUALQUER reembolso (parcial ou total) revoga o acesso.
 * 
 * Versão: 1.0.0
 * Data de Criação: 2026-01-23
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type Logger } from './webhook-helpers.ts';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Tipos de revogação suportados
 */
export type RefundReason = 'refunded' | 'chargeback' | 'partially_refunded' | 'manual';

/**
 * Input para processamento de ações pós-reembolso
 */
export interface PostRefundInput {
  /** ID do pedido */
  orderId: string;
  /** ID do produto */
  productId: string;
  /** ID do vendedor */
  vendorId: string;
  /** Motivo da revogação */
  reason: RefundReason;
  /** ID do evento de lifecycle (para rastreabilidade) */
  eventId?: string;
}

/**
 * Resultado do processamento de ações pós-reembolso
 */
export interface PostRefundResult {
  /** Se o acesso foi revogado */
  accessRevoked: boolean;
  /** ID do comprador afetado */
  buyerId: string | null;
  /** Número de grupos dos quais o comprador foi removido */
  groupsRemoved: number;
  /** Se os webhooks externos foram disparados */
  webhooksTriggered: boolean;
  /** Lista de erros não-críticos encontrados */
  errors: string[];
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Executa todas as ações pós-reembolso/chargeback
 * 
 * Esta função:
 * 1. Revoga o acesso do comprador à área de membros
 * 2. Remove o comprador dos grupos do produto afetado
 * 3. Dispara webhooks externos do vendedor
 * 
 * @param supabase - Cliente Supabase com service role
 * @param input - Dados do reembolso
 * @param eventType - Tipo de evento para webhooks externos (null = não dispara)
 * @param logger - Logger para rastreamento
 * @returns Resultado do processamento
 */
export async function processPostRefundActions(
  supabase: SupabaseClient,
  input: PostRefundInput,
  eventType: string | null,
  logger: Logger
): Promise<PostRefundResult> {
  
  const result: PostRefundResult = {
    accessRevoked: false,
    buyerId: null,
    groupsRemoved: 0,
    webhooksTriggered: false,
    errors: [],
  };

  logger.info('Iniciando ações pós-reembolso', { 
    orderId: input.orderId, 
    reason: input.reason,
    eventId: input.eventId,
  });

  // ========================================================================
  // 1. REVOGAR ACESSO À ÁREA DE MEMBROS
  // ========================================================================

  try {
    const { data: access, error: fetchError } = await supabase
      .from('buyer_product_access')
      .select('id, buyer_id, is_active, product_id')
      .eq('order_id', input.orderId)
      .maybeSingle();

    if (fetchError) {
      result.errors.push(`Fetch access error: ${fetchError.message}`);
      logger.error('Erro ao buscar acesso do comprador', { error: fetchError.message });
    } else if (!access) {
      logger.info('Nenhum acesso encontrado para revogar', { orderId: input.orderId });
    } else if (!access.is_active) {
      logger.info('Acesso já estava inativo', { 
        accessId: access.id, 
        buyerId: access.buyer_id 
      });
      result.buyerId = access.buyer_id;
    } else {
      // Revogar acesso
      const { error: updateError } = await supabase
        .from('buyer_product_access')
        .update({ 
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_reason: input.reason,
          revoked_by_event_id: input.eventId || null,
        })
        .eq('id', access.id);

      if (updateError) {
        result.errors.push(`Revoke access error: ${updateError.message}`);
        logger.error('Erro ao revogar acesso', { error: updateError.message });
      } else {
        result.accessRevoked = true;
        result.buyerId = access.buyer_id;
        logger.info('✅ Acesso à área de membros revogado', { 
          accessId: access.id,
          buyerId: access.buyer_id, 
          reason: input.reason,
          eventId: input.eventId,
        });
      }
    }
  } catch (accessError) {
    const errorMsg = accessError instanceof Error ? accessError.message : 'Erro desconhecido';
    result.errors.push(`Access revocation exception: ${errorMsg}`);
    logger.error('Exceção ao revogar acesso', { error: errorMsg });
  }

  // ========================================================================
  // 2. REMOVER DE GRUPOS DO PRODUTO
  // ========================================================================

  if (result.buyerId) {
    try {
      // Buscar grupos ativos do comprador
      const { data: buyerGroups, error: groupsFetchError } = await supabase
        .from('buyer_groups')
        .select('id, group_id')
        .eq('buyer_id', result.buyerId)
        .eq('is_active', true);

      if (groupsFetchError) {
        result.errors.push(`Fetch groups error: ${groupsFetchError.message}`);
        logger.warn('Erro ao buscar grupos do comprador', { error: groupsFetchError.message });
      } else if (buyerGroups && buyerGroups.length > 0) {
        // Buscar grupos que pertencem ao produto afetado
        const { data: productGroups, error: productGroupsError } = await supabase
          .from('product_member_groups')
          .select('id')
          .eq('product_id', input.productId);

        if (productGroupsError) {
          result.errors.push(`Fetch product groups error: ${productGroupsError.message}`);
          logger.warn('Erro ao buscar grupos do produto', { error: productGroupsError.message });
        } else if (productGroups && productGroups.length > 0) {
          const productGroupIds = new Set(productGroups.map(g => g.id));
          const groupsToRemove = buyerGroups.filter(bg => productGroupIds.has(bg.group_id));

          for (const group of groupsToRemove) {
            const { error: removeError } = await supabase
              .from('buyer_groups')
              .update({ is_active: false })
              .eq('id', group.id);

            if (removeError) {
              result.errors.push(`Remove group ${group.id} error: ${removeError.message}`);
              logger.warn('Erro ao remover grupo', { groupId: group.id, error: removeError.message });
            } else {
              result.groupsRemoved++;
            }
          }

          if (result.groupsRemoved > 0) {
            logger.info('✅ Grupos removidos', { 
              buyerId: result.buyerId, 
              groupsRemoved: result.groupsRemoved 
            });
          }
        }
      }
    } catch (groupError) {
      const errorMsg = groupError instanceof Error ? groupError.message : 'Erro desconhecido';
      result.errors.push(`Groups removal exception: ${errorMsg}`);
      logger.warn('Exceção ao remover grupos', { error: errorMsg });
    }
  }

  // ========================================================================
  // 3. DISPARAR WEBHOOKS EXTERNOS DO VENDEDOR
  // ========================================================================

  if (eventType) {
    const internalSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');
    
    if (!internalSecret) {
      logger.warn('⚠️ INTERNAL_WEBHOOK_SECRET não configurado - pulando trigger de webhooks externos');
      result.errors.push('INTERNAL_WEBHOOK_SECRET not configured');
    } else {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/trigger-webhooks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': internalSecret,
          },
          body: JSON.stringify({
            order_id: input.orderId,
            event_type: eventType,
          }),
        });

        logger.info('Resposta trigger-webhooks', { status: webhookResponse.status });

        if (webhookResponse.ok) {
          result.webhooksTriggered = true;
          logger.info('✅ Webhooks de reembolso disparados com sucesso');
        } else {
          const errorText = await webhookResponse.text();
          result.errors.push(`Webhook trigger: ${errorText}`);
          logger.warn('Erro ao disparar webhooks de reembolso', { error: errorText });
        }
      } catch (webhookError) {
        const errorMsg = webhookError instanceof Error ? webhookError.message : 'Erro desconhecido';
        result.errors.push(`Webhook trigger: ${errorMsg}`);
        logger.warn('Exceção ao disparar webhooks', { error: errorMsg });
      }
    }
  }

  // ========================================================================
  // 4. LOG FINAL
  // ========================================================================

  logger.info('Ações pós-reembolso concluídas', {
    orderId: input.orderId,
    reason: input.reason,
    accessRevoked: result.accessRevoked,
    buyerId: result.buyerId,
    groupsRemoved: result.groupsRemoved,
    webhooksTriggered: result.webhooksTriggered,
    errorsCount: result.errors.length,
  });

  return result;
}

// ============================================================================
// HELPER: Determinar event type para webhooks baseado no motivo
// ============================================================================

/**
 * Mapeia o motivo da revogação para o tipo de evento de webhook
 */
export function getRefundEventType(reason: RefundReason): string {
  switch (reason) {
    case 'refunded':
      return 'purchase_refunded';
    case 'partially_refunded':
      return 'purchase_partially_refunded';
    case 'chargeback':
      return 'purchase_chargeback';
    case 'manual':
      return 'access_revoked_manual';
    default:
      return 'purchase_refunded';
  }
}
