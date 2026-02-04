/**
 * ============================================================================
 * WEBHOOK POST-PAYMENT - Ações Pós-Pagamento Compartilhadas
 * ============================================================================
 * 
 * Centraliza as ações executadas após um pagamento ser aprovado:
 * - Conceder acesso à área de membros
 * - Enviar emails de confirmação
 * - Disparar webhooks do vendedor
 * - Disparar evento UTMify (RISE V3 - Backend SSOT)
 * 
 * Versão: 2.0.0 - RISE Protocol V3
 * Data de Criação: 2026-01-11
 * Última Atualização: 2026-02-04
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendOrderConfirmationEmails, type OrderData } from './send-order-emails.ts';
import { grantMembersAccess, type GrantAccessInput } from './grant-members-access.ts';
import { type Logger } from './webhook-helpers.ts';
import { dispatchUTMifyEventForOrder } from './utmify-dispatcher.ts';

// ============================================================================
// TYPES
// ============================================================================

export interface PostPaymentInput {
  orderId: string;
  customerEmail: string | null;
  customerName: string | null;
  productId: string;
  productName: string | null;
  amountCents: number;
  offerId?: string | null;
  paymentMethod: string;
  vendorId: string;
}

export interface PostPaymentResult {
  membersAccessGranted: boolean;
  emailsSent: number;
  webhooksTriggered: boolean;
  utmifyDispatched: boolean;
  errors: string[];
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Executa todas as ações pós-pagamento aprovado
 */
export async function processPostPaymentActions(
  supabase: SupabaseClient,
  input: PostPaymentInput,
  eventType: string | null,
  logger: Logger
): Promise<PostPaymentResult> {
  
  const result: PostPaymentResult = {
    membersAccessGranted: false,
    emailsSent: 0,
    webhooksTriggered: false,
    utmifyDispatched: false,
    errors: [],
  };

  // ========================================================================
  // 1. GRANT MEMBERS AREA ACCESS
  // ========================================================================

  if (input.customerEmail) {
    logger.info('Verificando acesso à área de membros', { orderId: input.orderId });
    
    try {
      const accessInput: GrantAccessInput = {
        orderId: input.orderId,
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        productId: input.productId,
        productName: input.productName,
        offerId: input.offerId || undefined,
      };

      const accessResult = await grantMembersAccess(supabase, accessInput);

      if (accessResult.hasMembersArea) {
        result.membersAccessGranted = true;
        logger.info('✅ Acesso à área de membros concedido', {
          buyerId: accessResult.buyerId,
          isNewBuyer: accessResult.isNewBuyer,
          hasInviteToken: !!accessResult.inviteToken,
        });
      } else {
        logger.info('Produto não possui área de membros configurada');
      }
    } catch (accessError) {
      const errorMsg = accessError instanceof Error ? accessError.message : 'Erro desconhecido';
      result.errors.push(`Members access: ${errorMsg}`);
      logger.warn('⚠️ Erro ao conceder acesso à área de membros (não crítico)', accessError);
    }
  }

  // ========================================================================
  // 2. SEND CONFIRMATION EMAILS
  // ========================================================================

  if (input.customerEmail) {
    logger.info('Enviando emails de confirmação', { 
      orderId: input.orderId,
      email: input.customerEmail 
    });

    try {
      const orderData: OrderData = {
        id: input.orderId,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        amount_cents: input.amountCents,
        product_id: input.productId,
        product_name: input.productName,
      };

      const emailResult = await sendOrderConfirmationEmails(
        supabase,
        orderData,
        input.paymentMethod
      );

      result.emailsSent = emailResult.emailsSent;
      logger.info('✅ Resultado do envio de emails', {
        totalItems: emailResult.totalItems,
        emailsSent: emailResult.emailsSent,
        emailsFailed: emailResult.emailsFailed
      });
    } catch (emailError) {
      const errorMsg = emailError instanceof Error ? emailError.message : 'Erro desconhecido';
      result.errors.push(`Email: ${errorMsg}`);
      logger.warn('⚠️ Exceção ao enviar emails (não crítico)', emailError);
    }
  }

  // ========================================================================
  // 3. TRIGGER VENDOR WEBHOOKS
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
          logger.info('✅ Webhooks disparados com sucesso');
        } else {
          const errorText = await webhookResponse.text();
          result.errors.push(`Webhook trigger: ${errorText}`);
          logger.warn('Erro ao disparar webhooks', { error: errorText });
        }
      } catch (webhookError) {
        const errorMsg = webhookError instanceof Error ? webhookError.message : 'Erro desconhecido';
        result.errors.push(`Webhook trigger: ${errorMsg}`);
        logger.warn('Exceção ao disparar webhooks', webhookError);
      }
    }
  }

  // ========================================================================
  // 4. UTMIFY TRACKING (RISE V3 - Backend SSOT)
  // ========================================================================

  try {
    logger.info('Disparando evento UTMify purchase_approved', { orderId: input.orderId });
    
    const utmifyResult = await dispatchUTMifyEventForOrder(
      supabase,
      input.orderId,
      "purchase_approved",
      { approvedDate: new Date().toISOString() }
    );

    if (utmifyResult.success && !utmifyResult.skipped) {
      result.utmifyDispatched = true;
      logger.info('✅ UTMify purchase_approved disparado com sucesso');
    } else if (utmifyResult.skipped) {
      logger.info('UTMify pulado:', utmifyResult.reason);
    } else {
      result.errors.push(`UTMify: ${utmifyResult.error}`);
      logger.warn('⚠️ Erro ao disparar UTMify (não crítico)', utmifyResult.error);
    }
  } catch (utmifyError) {
    const errorMsg = utmifyError instanceof Error ? utmifyError.message : 'Erro desconhecido';
    result.errors.push(`UTMify: ${errorMsg}`);
    logger.warn('⚠️ Exceção ao disparar UTMify (não crítico)', utmifyError);
  }

  return result;
}
