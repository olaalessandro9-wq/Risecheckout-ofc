/**
 * Shared Types & Mock Data for stripe-webhook Tests
 * 
 * @module stripe-webhook/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
// ============================================================================

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
  livemode: boolean;
}

export type StripeEventType =
  | 'checkout.session.completed'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'charge.refunded'
  | 'charge.dispute.created'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed';

export interface WebhookValidationResult {
  valid: boolean;
  error?: string;
}

export interface ProcessedEventResult {
  success: boolean;
  orderId?: string;
  newStatus?: string;
  message?: string;
  requiresAction?: boolean;
}

// ============================================================================
// VALIDATION LOGIC
// ============================================================================

export function validateWebhookEvent(event: unknown): WebhookValidationResult {
  if (!event || typeof event !== 'object') {
    return { valid: false, error: 'Evento inválido' };
  }
  const e = event as Record<string, unknown>;
  if (!e.id || typeof e.id !== 'string') {
    return { valid: false, error: 'id do evento é obrigatório' };
  }
  if (!e.type || typeof e.type !== 'string') {
    return { valid: false, error: 'type do evento é obrigatório' };
  }
  if (!e.data || typeof e.data !== 'object') {
    return { valid: false, error: 'data do evento é obrigatório' };
  }
  const data = e.data as Record<string, unknown>;
  if (!data.object || typeof data.object !== 'object') {
    return { valid: false, error: 'data.object é obrigatório' };
  }
  return { valid: true };
}

export function isHandledEventType(eventType: string): boolean {
  const handledEvents: StripeEventType[] = [
    'checkout.session.completed',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'charge.refunded',
    'charge.dispute.created',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.paid',
    'invoice.payment_failed',
  ];
  return handledEvents.includes(eventType as StripeEventType);
}

export function mapStripeEventToOrderStatus(eventType: StripeEventType): string {
  switch (eventType) {
    case 'checkout.session.completed':
    case 'payment_intent.succeeded':
    case 'invoice.paid':
      return 'approved';
    case 'payment_intent.payment_failed':
    case 'invoice.payment_failed':
      return 'failed';
    case 'charge.refunded':
      return 'refunded';
    case 'charge.dispute.created':
      return 'disputed';
    case 'customer.subscription.deleted':
      return 'cancelled';
    default:
      return 'pending';
  }
}

export function extractOrderIdFromMetadata(
  dataObject: Record<string, unknown>
): string | null {
  const metadata = dataObject.metadata as Record<string, string> | undefined;
  if (metadata?.order_id) {
    return metadata.order_id;
  }
  if (dataObject.client_reference_id) {
    return dataObject.client_reference_id as string;
  }
  return null;
}

export function extractAmountFromEvent(
  eventType: StripeEventType,
  dataObject: Record<string, unknown>
): number {
  switch (eventType) {
    case 'checkout.session.completed':
      return (dataObject.amount_total as number) || 0;
    case 'payment_intent.succeeded':
    case 'payment_intent.payment_failed':
      return (dataObject.amount as number) || 0;
    case 'charge.refunded':
      return (dataObject.amount_refunded as number) || 0;
    case 'invoice.paid':
    case 'invoice.payment_failed':
      return (dataObject.amount_paid as number) || (dataObject.amount_due as number) || 0;
    default:
      return 0;
  }
}

export function isTestEvent(event: StripeWebhookEvent): boolean {
  return !event.livemode;
}

export function shouldSkipEvent(eventType: string): boolean {
  const skipEvents = [
    'customer.created',
    'customer.updated',
    'payment_method.attached',
    'payment_method.detached',
  ];
  return skipEvents.includes(eventType);
}

export function buildProcessedResult(event: StripeWebhookEvent): ProcessedEventResult {
  if (!isHandledEventType(event.type)) {
    if (shouldSkipEvent(event.type)) {
      return { success: true, message: `Evento ignorado: ${event.type}` };
    }
    return { success: false, message: `Evento não suportado: ${event.type}` };
  }
  const dataObject = event.data.object as Record<string, unknown>;
  const orderId = extractOrderIdFromMetadata(dataObject);
  const newStatus = mapStripeEventToOrderStatus(event.type as StripeEventType);
  return {
    success: true,
    orderId: orderId || undefined,
    newStatus,
    message: `Webhook processado: ${event.type}`,
    requiresAction: event.type === 'charge.dispute.created',
  };
}
