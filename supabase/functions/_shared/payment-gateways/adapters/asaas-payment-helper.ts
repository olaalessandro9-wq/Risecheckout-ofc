/**
 * asaas-payment-helper.ts
 * 
 * Módulo auxiliar para gerenciamento de pagamentos na Asaas.
 * Separado do AsaasAdapter para manter arquivos < 300 linhas (RISE Protocol V2).
 * 
 * @version 1.0.0
 */

import { PaymentSplitRule } from "../types.ts";

// ============================================
// TYPES
// ============================================

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  value: number;
  dueDate: string;
  status: AsaasPaymentStatus;
  externalReference?: string;
  description?: string;
}

export interface AsaasPixQrCode {
  encodedImage: string;  // Base64
  payload: string;       // Copia e Cola
  expirationDate: string;
}

export interface AsaasSplitRule {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
  description?: string;
}

export type AsaasPaymentStatus = 
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'REFUND_IN_PROGRESS'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS';

// ============================================
// PAYMENT FUNCTIONS
// ============================================

/**
 * Cria cobrança na Asaas
 */
export async function createPayment(
  baseUrl: string,
  headers: HeadersInit,
  payload: Record<string, unknown>
): Promise<AsaasPayment & { error?: string } | null> {
  try {
    console.log(`[AsaasPaymentHelper] Criando cobrança:`, JSON.stringify(payload, null, 2));

    const response = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[AsaasPaymentHelper] Erro ao criar cobrança:', data);
      const asaasError = data as { errors?: Array<{ description?: string }>; message?: string };
      const errorMessage = asaasError.errors?.[0]?.description || asaasError.message || 'Erro desconhecido';
      return { error: errorMessage } as AsaasPayment & { error: string };
    }

    console.log(`[AsaasPaymentHelper] Cobrança criada: ${data.id}`);
    return data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[AsaasPaymentHelper] Exception createPayment:', errorMessage);
    return null;
  }
}

/**
 * Obtém QR Code PIX de uma cobrança
 */
export async function getPixQrCode(
  baseUrl: string,
  headers: HeadersInit,
  paymentId: string
): Promise<AsaasPixQrCode | null> {
  try {
    const response = await fetch(
      `${baseUrl}/payments/${paymentId}/pixQrCode`,
      { headers }
    );

    if (!response.ok) {
      console.error('[AsaasPaymentHelper] Erro ao obter QR Code');
      return null;
    }

    return await response.json();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[AsaasPaymentHelper] Exception getPixQrCode:', errorMessage);
    return null;
  }
}

/**
 * Consulta status de um pagamento
 */
export async function getPaymentStatus(
  baseUrl: string,
  headers: HeadersInit,
  paymentId: string
): Promise<AsaasPaymentStatus | null> {
  try {
    const response = await fetch(
      `${baseUrl}/payments/${paymentId}`,
      { headers }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.status;
  } catch {
    return null;
  }
}

// ============================================
// SPLIT MANAGEMENT
// ============================================

/**
 * Converte PaymentSplitRule[] para formato Asaas
 * 
 * Asaas usa walletId para identificar recebedores.
 * O valor restante vai automaticamente para o emissor (owner).
 */
export function buildSplitRules(rules?: PaymentSplitRule[]): AsaasSplitRule[] | undefined {
  if (!rules || rules.length === 0) return undefined;

  const asaasSplits: AsaasSplitRule[] = [];

  for (const rule of rules) {
    // Pula o produtor (owner) - resto vai automaticamente para ele
    if (rule.role === 'producer') continue;
    
    // Precisa de recipient_id (walletId na Asaas)
    if (!rule.recipient_id) {
      console.warn(`[AsaasPaymentHelper] Split ignorado para ${rule.role}: sem walletId`);
      continue;
    }

    const split: AsaasSplitRule = {
      walletId: rule.recipient_id,
      description: `Split ${rule.role}`
    };

    // Converter centavos para reais (fixedValue)
    if (rule.amount_cents > 0) {
      split.fixedValue = rule.amount_cents / 100;
    }

    asaasSplits.push(split);
  }

  if (asaasSplits.length === 0) return undefined;

  console.log(`[AsaasPaymentHelper] Split configurado com ${asaasSplits.length} recebedor(es)`);
  return asaasSplits;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Retorna data de vencimento (hoje + 1 dia)
 */
export function getDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Parseia token do cartão
 * 
 * Pode ser:
 * - String simples (creditCardToken)
 * - JSON serializado com dados do cartão
 */
export function parseCardToken(token: string): {
  creditCardToken?: string;
  creditCard?: Record<string, string>;
  creditCardHolderInfo?: Record<string, string>;
} {
  try {
    // Tentar parsear como JSON
    const parsed = JSON.parse(token);
    return parsed;
  } catch {
    // String simples = token
    return { creditCardToken: token };
  }
}

/**
 * Mapeia status Asaas para status padronizado RiseCheckout
 */
export function mapAsaasStatus(
  status: AsaasPaymentStatus
): 'pending' | 'approved' | 'refused' | 'error' | 'cancelled' | 'refunded' {
  switch (status) {
    case 'RECEIVED':
    case 'CONFIRMED':
    case 'RECEIVED_IN_CASH':
      return 'approved';
    
    case 'PENDING':
    case 'AWAITING_RISK_ANALYSIS':
      return 'pending';
    
    case 'REFUNDED':
    case 'REFUND_REQUESTED':
    case 'REFUND_IN_PROGRESS':
      return 'refunded';
    
    case 'OVERDUE':
    case 'CHARGEBACK_REQUESTED':
    case 'CHARGEBACK_DISPUTE':
    case 'AWAITING_CHARGEBACK_REVERSAL':
    case 'DUNNING_REQUESTED':
    case 'DUNNING_RECEIVED':
      return 'cancelled';
    
    default:
      return 'error';
  }
}
