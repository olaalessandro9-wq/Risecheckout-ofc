/**
 * PIX Builder Handler
 * 
 * Monta payload e chama API do PushinPay
 * 
 * @author RiseCheckout Team
 */

export const PUSHINPAY_URLS = {
  sandbox: 'https://api-sandbox.pushinpay.com.br/api/pix/cashIn',
  production: 'https://api.pushinpay.com.br/api/pix/cashIn'
};

export interface PushinPayResponse {
  id: string;
  status: string;
  value: number;
  qr_code: string;
  qr_code_base64: string;
  pix_key: string;
  external_reference?: string;
  created_at: string;
  expires_at: string;
}

interface PixPayloadParams {
  valueInCents: number;
  webhookUrl?: string;
  supabaseUrl: string;
  splitRules: Array<{value: number, account_id: string}>;
}

export function buildPixPayload(params: PixPayloadParams): Record<string, unknown> {
  const { valueInCents, webhookUrl, supabaseUrl, splitRules } = params;
  
  const payload: Record<string, unknown> = {
    value: valueInCents,
    webhook_url: webhookUrl || `${supabaseUrl}/functions/v1/pushinpay-webhook`
  };
  
  if (splitRules.length > 0) {
    payload.split_rules = splitRules;
  }
  
  return payload;
}

interface CallPushinPayParams {
  environment: 'sandbox' | 'production';
  token: string;
  payload: Record<string, unknown>;
  orderId: string;
  supabase: { from: (table: string) => any };
  logPrefix: string;
}

export async function callPushinPayApi(params: CallPushinPayParams): Promise<PushinPayResponse> {
  const { environment, token, payload, orderId, supabase, logPrefix } = params;
  
  const apiUrl = environment === 'sandbox' 
    ? PUSHINPAY_URLS.sandbox 
    : PUSHINPAY_URLS.production;

  console.log(`[${logPrefix}] Payload para PushinPay:`, JSON.stringify(payload));

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  console.log(`[${logPrefix}] Status: ${response.status}, Response: ${responseText}`);

  if (!response.ok) {
    console.error(`[${logPrefix}] Erro na API PushinPay:`, responseText);
    
    await supabase.from('edge_function_errors').insert({
      function_name: logPrefix,
      order_id: orderId,
      error_message: `PushinPay retornou ${response.status}`,
      request_payload: payload,
      error_stack: responseText
    });

    throw new Error(`PushinPay retornou erro: ${response.status} - ${responseText}`);
  }

  const pixData: PushinPayResponse = JSON.parse(responseText);
  console.log(`[${logPrefix}] PIX criado com sucesso, id=${pixData.id}`);
  
  return pixData;
}
