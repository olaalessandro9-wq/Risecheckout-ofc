/**
 * MercadoPago Specific Types
 * 
 * Tipos específicos do gateway Mercado Pago extraídos do MercadoPagoAdapter
 * para manter o arquivo principal abaixo de 300 linhas.
 * 
 * @version 1.0.0 - RISE Protocol V2 Compliance
 */

export interface MercadoPagoPayload {
  transaction_amount: number;
  description?: string;
  payment_method_id?: string;
  token?: string;
  installments?: number;
  statement_descriptor?: string;
  payer: {
    email: string;
    first_name: string;
    last_name: string;
    identification: {
      type: string;
      number: string;
    };
  };
  external_reference?: string;
  notification_url?: string;
  disbursements?: MercadoPagoDisbursement[];
}

export interface MercadoPagoDisbursement {
  amount: number;
  external_reference: string;
  collector_id: string;
}

export interface MercadoPagoResponse {
  id?: number | string;
  status?: string;
  message?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code_base64?: string;
      qr_code?: string;
    };
  };
}
