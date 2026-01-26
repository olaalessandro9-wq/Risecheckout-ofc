/**
 * Inicialização do SDK Brick - Mercado Pago Gateway
 * 
 * Módulo: src/integrations/gateways/mercadopago/hooks/brick-sdk-init.ts
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Encapsula a lógica de inicialização do CardForm do Mercado Pago.
 */

import { MercadoPagoInstallment } from './useMercadoPagoBrick';
import { createLogger } from '@/lib/logger';

const log = createLogger("BrickSdkInit");

export interface CardFormConfig {
  publicKey: string;
  amount: number;
  onFormMounted: (error: unknown) => void;
  onBinChange: () => void;
  onPaymentMethodsReceived: (error: unknown, methods: Array<{ id: string }>) => void;
  onInstallmentsReceived: (error: unknown, data: Array<{ payer_costs: MercadoPagoInstallment[] }>) => void;
  onFormTokenError: () => void;
}

export interface CardFormInstance {
  unmount?: () => void;
  createCardToken: (opts: { cardholderEmail: string }) => Promise<{ id?: string; token?: string }>;
}

/**
 * Inicializa o CardForm do Mercado Pago
 * 
 * @param config - Configuração do formulário
 * @returns Instância do CardForm
 */
export async function initCardForm(config: CardFormConfig): Promise<CardFormInstance> {
  const mp = new window.MercadoPago(config.publicKey, { locale: 'pt-BR' });

  // Simulação inicial de parcelas
  try {
    interface InstallmentResponse {
      payer_costs: MercadoPagoInstallment[];
    }
    const data = await mp.getInstallments({
      amount: config.amount.toString(),
      bin: '520000', 
      locale: 'pt-BR'
    });
    const installmentData = data as InstallmentResponse[];
    if (installmentData?.[0]?.payer_costs) {
      config.onInstallmentsReceived(null, installmentData);
    }
  } catch (e) {
    log.warn("Erro simul:", e);
  }

  const cardForm = mp.cardForm({
    amount: config.amount.toString(),
    iframe: true,
    form: {
      id: "form-checkout",
      cardNumber: { 
        id: "form-checkout__cardNumber",
        placeholder: "0000 0000 0000 0000",
        style: { color: '#000000', fontSize: '14px' }
      },
      expirationDate: { 
        id: "form-checkout__expirationDate",
        placeholder: "MM/AA",
        style: { color: '#000000', fontSize: '14px' }
      },
      securityCode: { 
        id: "form-checkout__securityCode",
        placeholder: "123",
        style: { color: '#000000', fontSize: '14px' }
      },
      cardholderName: { id: "form-checkout__cardholderName" },
      issuer: { id: "form-checkout__issuer" },
      installments: { id: "form-checkout__installments" },
      identificationType: { id: "form-checkout__identificationType" },
      identificationNumber: { id: "form-checkout__identificationNumber" },
      cardholderEmail: { id: "form-checkout__cardholderEmail" },
    },
    callbacks: {
      onFormMounted: config.onFormMounted,
      onBinChange: config.onBinChange,
      onPaymentMethodsReceived: config.onPaymentMethodsReceived,
      onInstallmentsReceived: config.onInstallmentsReceived,
      onFormTokenError: config.onFormTokenError,
    },
  });

  return cardForm as CardFormInstance;
}

/**
 * Recalcula parcelas para um novo valor
 * 
 * @param publicKey - Public Key do Mercado Pago
 * @param amount - Valor em reais
 * @returns Lista de parcelas ou null em caso de erro
 */
export async function recalculateInstallments(
  publicKey: string,
  amount: number
): Promise<MercadoPagoInstallment[] | null> {
  try {
    const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
    const data = await mp.getInstallments({
      amount: amount.toString(),
      bin: '520000',
      locale: 'pt-BR'
    }) as Array<{ payer_costs: MercadoPagoInstallment[] }>;
    
    return data?.[0]?.payer_costs || null;
  } catch (err) {
    log.warn('Erro ao recalcular parcelas:', err);
    return null;
  }
}
