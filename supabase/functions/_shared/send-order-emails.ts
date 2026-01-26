/**
 * ============================================================================
 * SEND ORDER EMAILS - Helper Centralizado
 * ============================================================================
 * 
 * Envia emails individuais para cada item do pedido (produto principal + bumps).
 * Cada produto recebe seu próprio email com seu respectivo link de acesso.
 * 
 * Suporta 3 tipos de entrega:
 * - standard: Link customizado (delivery_url)
 * - members_area: Link automático para área de membros
 * - external: Email de confirmação sem botão (vendedor faz entrega)
 * 
 * @version 3.0.0 - Suporte a delivery_type ENUM
 * ============================================================================
 */

import { SupabaseClient } from "./supabase-types.ts";
import { sendEmail } from './zeptomail.ts';
import { 
  getPurchaseConfirmationTemplate, 
  getPurchaseConfirmationTextTemplate,
  getMembersAreaConfirmationTemplate,
  getMembersAreaConfirmationTextTemplate,
  getExternalDeliveryConfirmationTemplate,
  getExternalDeliveryConfirmationTextTemplate,
  type PurchaseConfirmationData 
} from './email-templates.ts';
import { createLogger } from "./logger.ts";

const log = createLogger("SendOrderEmails");

// ============================================================================
// TYPES
// ============================================================================

export type DeliveryType = 'standard' | 'members_area' | 'external';

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
    deliveryType?: DeliveryType;
    error?: string;
  }>;
}

interface ProductDeliveryInfo {
  delivery_url: string | null;
  support_email: string | null;
  external_delivery: boolean | null;
  delivery_type: DeliveryType | null;
}

const logInfo = (message: string, data?: Record<string, unknown>) => log.info(message, data);
const logWarn = (message: string, data?: Record<string, unknown>) => log.warn(message, data);
const logError = (message: string, error?: unknown) => log.error(message, error);

// ============================================================================
// HELPER: Determinar tipo de entrega
// ============================================================================

function getDeliveryType(product: ProductDeliveryInfo | null): DeliveryType {
  // Prioridade: delivery_type ENUM > external_delivery boolean (deprecated)
  if (product?.delivery_type) {
    return product.delivery_type;
  }
  
  // Fallback para campo deprecated
  if (product?.external_delivery === true) {
    return 'external';
  }
  
  return 'standard';
}

// ============================================================================
// HELPER: Obter URL de entrega baseado no tipo
// ============================================================================

function getDeliveryUrl(
  deliveryType: DeliveryType,
  productId: string,
  deliveryUrl: string | null
): string | null {
  const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://risecheckout.com';
  
  switch (deliveryType) {
    case 'members_area':
      // Link automático para área de membros
      return `${siteUrl}/minha-conta/produtos/${productId}`;
    
    case 'external':
      // Sem link (vendedor faz entrega)
      return null;
    
    case 'standard':
    default:
      // Link customizado do produto
      return deliveryUrl;
  }
}

// ============================================================================
// HELPER: Selecionar template correto
// ============================================================================

function getEmailTemplates(deliveryType: DeliveryType): {
  html: (data: PurchaseConfirmationData) => string;
  text: (data: PurchaseConfirmationData) => string;
} {
  switch (deliveryType) {
    case 'members_area':
      return {
        html: getMembersAreaConfirmationTemplate,
        text: getMembersAreaConfirmationTextTemplate,
      };
    
    case 'external':
      return {
        html: getExternalDeliveryConfirmationTemplate,
        text: getExternalDeliveryConfirmationTextTemplate,
      };
    
    case 'standard':
    default:
      return {
        html: getPurchaseConfirmationTemplate,
        text: getPurchaseConfirmationTextTemplate,
      };
  }
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
    itemsToProcess = orderItems;
    logInfo('Usando order_items', { count: itemsToProcess.length });
  } else {
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
      // Buscar informações de entrega do produto
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('delivery_url, support_email, external_delivery, delivery_type')
        .eq('id', item.product_id)
        .single() as { data: ProductDeliveryInfo | null; error: { message: string } | null };

      if (productError) {
        logWarn('Erro ao buscar produto', { productId: item.product_id, error: productError.message });
      }

      // Determinar tipo de entrega
      const deliveryType = getDeliveryType(product);
      itemDetail.deliveryType = deliveryType;

      // Obter URL de entrega (null para external)
      const deliveryUrl = getDeliveryUrl(deliveryType, item.product_id, product?.delivery_url || null);

      // Para entrega standard, validar que existe delivery_url
      if (deliveryType === 'standard' && !deliveryUrl) {
        logWarn('Produto standard sem delivery_url - pulando envio', { 
          productId: item.product_id, 
          productName: item.product_name 
        });
        itemDetail.error = 'Produto sem link de acesso (delivery_url)';
        result.details.push(itemDetail);
        continue;
      }

      // Log do tipo de entrega
      logInfo(`📧 Enviando email (${deliveryType})`, { 
        productId: item.product_id, 
        productName: item.product_name,
        isBump: item.is_bump,
        hasDeliveryUrl: !!deliveryUrl
      });

      // Montar dados do email
      const emailData: PurchaseConfirmationData = {
        customerName: order.customer_name || 'Cliente',
        productName: item.product_name,
        amountCents: item.amount_cents,
        orderId: order.id,
        paymentMethod,
        deliveryUrl: deliveryUrl || undefined,
        supportEmail: product?.support_email || undefined,
      };

      // Selecionar templates corretos
      const templates = getEmailTemplates(deliveryType);

      // Definir assunto baseado no tipo
      let subject: string;
      if (item.is_bump) {
        subject = `🎁 Acesso Liberado - ${item.product_name} (Bônus)`;
      } else if (deliveryType === 'members_area') {
        subject = `🎓 Acesso Liberado - ${item.product_name}`;
      } else if (deliveryType === 'external') {
        subject = `✅ Pagamento Confirmado - ${item.product_name}`;
      } else {
        subject = `✅ Compra Confirmada - ${item.product_name}`;
      }

      // Enviar email
      const emailResult = await sendEmail({
        to: { email: order.customer_email!, name: order.customer_name || undefined },
        subject,
        htmlBody: templates.html(emailData),
        textBody: templates.text(emailData),
        type: 'transactional',
        clientReference: `order_${order.id}_product_${item.product_id}_${deliveryType}`,
      });

      if (emailResult.success) {
        logInfo('✅ Email enviado', { 
          productName: item.product_name, 
          deliveryType,
          isBump: item.is_bump,
          messageId: emailResult.messageId 
        });
        itemDetail.success = true;
        result.emailsSent++;
      } else {
        logWarn('⚠️ Falha ao enviar email', { 
          productName: item.product_name, 
          deliveryType,
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
