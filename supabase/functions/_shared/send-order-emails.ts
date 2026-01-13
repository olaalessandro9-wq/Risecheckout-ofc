/**
 * ============================================================================
 * SEND ORDER EMAILS - Helper Centralizado
 * ============================================================================
 * 
 * Envia emails individuais para cada item do pedido (produto principal + bumps).
 * Cada produto recebe seu próprio email com seu respectivo link de acesso.
 * 
 * @rise-protocol-compliant true
 * @version 2.0.0 - Zero `any` compliance
 * ============================================================================
 */

import { SupabaseClient } from "./supabase-types.ts";
import { sendEmail } from './zeptomail.ts';
import { 
  getPurchaseConfirmationTemplate, 
  getPurchaseConfirmationTextTemplate, 
  type PurchaseConfirmationData 
} from './email-templates.ts';

// ============================================================================
// TYPES
// ============================================================================

export interface OrderData {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  amount_cents: number;
  product_id: string;
  product_name: string | null;
}

export interface OrderItemData {
  product_id: string;
  product_name: string;
  amount_cents: number;
  is_bump: boolean;
}

export interface SendOrderEmailsResult {
  totalItems: number;
  emailsSent: number;
  emailsFailed: number;
  details: Array<{
    productId: string;
    productName: string;
    isBump: boolean;
    success: boolean;
    error?: string;
  }>;
}

interface ProductDeliveryInfo {
  delivery_url: string | null;
  support_email: string | null;
  external_delivery: boolean | null;
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

function logInfo(message: string, data?: Record<string, unknown>) {
  console.log(`[send-order-emails] [INFO] ${message}`, data ? JSON.stringify(data) : '');
}

function logWarn(message: string, data?: Record<string, unknown>) {
  console.warn(`[send-order-emails] [WARN] ${message}`, data ? JSON.stringify(data) : '');
}

function logError(message: string, error?: unknown) {
  console.error(`[send-order-emails] [ERROR] ${message}`, error);
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Envia emails de confirmação para cada item do pedido.
 * Se não houver order_items, faz fallback para o produto principal do order.
 * 
 * @param supabase - Cliente Supabase com service role
 * @param order - Dados do pedido
 * @param paymentMethod - Método de pagamento para exibir no email
 * @returns Resultado detalhado dos envios
 */
export async function sendOrderConfirmationEmails(
  supabase: SupabaseClient,
  order: OrderData,
  paymentMethod: string
): Promise<SendOrderEmailsResult> {
  
  const result: SendOrderEmailsResult = {
    totalItems: 0,
    emailsSent: 0,
    emailsFailed: 0,
    details: []
  };

  // Validar email do cliente
  if (!order.customer_email) {
    logWarn('Cliente sem email - nenhum email será enviado', { orderId: order.id });
    return result;
  }

  logInfo('Iniciando envio de emails para pedido', { 
    orderId: order.id, 
    customerEmail: order.customer_email 
  });

  // ========================================================================
  // 1. BUSCAR ORDER_ITEMS (produto principal + bumps)
  // ========================================================================

  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('product_id, product_name, amount_cents, is_bump')
    .eq('order_id', order.id)
    .order('is_bump', { ascending: true }) as { data: OrderItemData[] | null; error: unknown };

  if (itemsError) {
    logError('Erro ao buscar order_items', itemsError);
  }

  // ========================================================================
  // 2. DEFINIR LISTA DE ITENS PARA PROCESSAR
  // ========================================================================

  let itemsToProcess: OrderItemData[];

  if (orderItems && orderItems.length > 0) {
    // Usar order_items se existirem
    itemsToProcess = orderItems;
    logInfo('Usando order_items', { count: itemsToProcess.length });
  } else {
    // Fallback: usar dados do order (apenas produto principal)
    logWarn('Nenhum order_item encontrado - usando fallback para produto principal');
    itemsToProcess = [{
      product_id: order.product_id,
      product_name: order.product_name || 'Produto',
      amount_cents: order.amount_cents,
      is_bump: false
    }];
  }

  result.totalItems = itemsToProcess.length;

  // ========================================================================
  // 3. ENVIAR EMAIL PARA CADA ITEM
  // ========================================================================

  for (const item of itemsToProcess) {
    const itemDetail: SendOrderEmailsResult['details'][0] = {
      productId: item.product_id,
      productName: item.product_name,
      isBump: item.is_bump,
      success: false
    };

    try {
      // Buscar delivery_url e external_delivery do produto específico
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('delivery_url, support_email, external_delivery')
        .eq('id', item.product_id)
        .single() as { data: ProductDeliveryInfo | null; error: { message: string } | null };

      if (productError) {
        logWarn('Erro ao buscar produto', { productId: item.product_id, error: productError.message });
      }

      // Se produto tem entrega externa, pular envio de email (sistema próprio do vendedor)
      if (product?.external_delivery === true) {
        logInfo('🔗 Produto com entrega externa - pulando envio de email', { 
          productId: item.product_id, 
          productName: item.product_name,
          isBump: item.is_bump 
        });
        itemDetail.error = 'Entrega externa configurada';
        result.details.push(itemDetail);
        continue;
      }

      // Se produto não tem delivery_url E não é externo, pular (não faz sentido enviar email sem link)
      if (!product?.delivery_url) {
        logWarn('Produto sem delivery_url - pulando envio de email', { 
          productId: item.product_id, 
          productName: item.product_name,
          isBump: item.is_bump 
        });
        itemDetail.error = 'Produto sem link de acesso (delivery_url)';
        result.details.push(itemDetail);
        continue;
      }

      // Montar dados do email
      const emailData: PurchaseConfirmationData = {
        customerName: order.customer_name || 'Cliente',
        productName: item.product_name,
        amountCents: item.amount_cents,
        orderId: order.id,
        paymentMethod,
        deliveryUrl: product.delivery_url,
        supportEmail: product.support_email || undefined,
      };

      // Definir assunto baseado se é bump ou não
      const subject = item.is_bump
        ? `🎁 Acesso Liberado - ${item.product_name} (Bônus)`
        : `✅ Compra Confirmada - ${item.product_name}`;

      // Enviar email
      const emailResult = await sendEmail({
        to: { email: order.customer_email!, name: order.customer_name || undefined },
        subject,
        htmlBody: getPurchaseConfirmationTemplate(emailData),
        textBody: getPurchaseConfirmationTextTemplate(emailData),
        type: 'transactional',
        clientReference: `order_${order.id}_product_${item.product_id}`,
      });

      if (emailResult.success) {
        logInfo('✅ Email enviado', { 
          productName: item.product_name, 
          isBump: item.is_bump,
          messageId: emailResult.messageId 
        });
        itemDetail.success = true;
        result.emailsSent++;
      } else {
        logWarn('⚠️ Falha ao enviar email', { 
          productName: item.product_name, 
          error: emailResult.error 
        });
        itemDetail.error = emailResult.error || 'Erro desconhecido';
        result.emailsFailed++;
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Exceção ao processar item', { 
        productId: item.product_id, 
        error: errorMessage 
      });
      itemDetail.error = errorMessage;
      result.emailsFailed++;
    }

    result.details.push(itemDetail);
  }

  // ========================================================================
  // 4. LOG FINAL
  // ========================================================================

  logInfo('Envio de emails concluído', {
    orderId: order.id,
    totalItems: result.totalItems,
    emailsSent: result.emailsSent,
    emailsFailed: result.emailsFailed
  });

  return result;
}
