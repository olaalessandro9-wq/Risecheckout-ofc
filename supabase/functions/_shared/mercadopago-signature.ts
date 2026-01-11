/**
 * ============================================================================
 * MERCADOPAGO SIGNATURE - Validação de Assinatura HMAC
 * ============================================================================
 * 
 * Valida assinaturas de webhooks do Mercado Pago usando HMAC-SHA256.
 * 
 * Versão: 1.0
 * Data de Criação: 2026-01-11
 * ============================================================================
 */

import { 
  generateHmacSignature, 
  ERROR_CODES, 
  SIGNATURE_MAX_AGE,
  type SignatureValidationResult,
  type Logger 
} from './webhook-helpers.ts';

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Valida assinatura do webhook do Mercado Pago
 */
export async function validateMercadoPagoSignature(
  req: Request,
  dataId: string,
  logger: Logger
): Promise<SignatureValidationResult> {
  
  // ========================================================================
  // CAMADA 1: VERIFICAR PRESENÇA DO SECRET (OBRIGATÓRIO)
  // ========================================================================
  
  const webhookSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');

  if (!webhookSecret) {
    logger.error('🔴 MERCADOPAGO_WEBHOOK_SECRET não configurado - REJEITANDO webhook');
    return { valid: false, error: ERROR_CODES.SECRET_NOT_CONFIGURED };
  }

  // ========================================================================
  // CAMADA 2: VERIFICAR PRESENÇA DOS HEADERS (OBRIGATÓRIOS)
  // ========================================================================

  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id');

  logger.info('Headers recebidos', {
    hasSignature: !!xSignature,
    hasRequestId: !!xRequestId
  });

  if (!xSignature || !xRequestId) {
    logger.error('🔴 Headers de assinatura ausentes - REJEITANDO webhook', {
      xSignature: xSignature ? 'presente' : 'ausente',
      xRequestId: xRequestId ? 'presente' : 'ausente'
    });
    return { valid: false, error: ERROR_CODES.MISSING_SIGNATURE_HEADERS };
  }

  try {
    // ========================================================================
    // CAMADA 3: VALIDAR FORMATO DA ASSINATURA
    // ========================================================================

    const parts = xSignature.split(',');
    const tsMatch = parts.find(p => p.startsWith('ts='));
    const v1Match = parts.find(p => p.startsWith('v1='));

    if (!tsMatch || !v1Match) {
      logger.error('🔴 Formato de assinatura inválido - REJEITANDO webhook', {
        signatureFormat: xSignature
      });
      return { valid: false, error: ERROR_CODES.INVALID_SIGNATURE_FORMAT };
    }

    const timestamp = tsMatch.split('=')[1];
    const receivedHash = v1Match.split('=')[1];

    // ========================================================================
    // CAMADA 4: VERIFICAR IDADE DO WEBHOOK (PROTEÇÃO CONTRA REPLAY)
    // ========================================================================

    const now = Math.floor(Date.now() / 1000);
    const age = now - parseInt(timestamp);

    logger.info('Verificando idade do webhook', { age, maxAge: SIGNATURE_MAX_AGE });

    if (age > SIGNATURE_MAX_AGE) {
      logger.error('🔴 Webhook expirado - REJEITANDO', { 
        age, 
        maxAge: SIGNATURE_MAX_AGE,
        difference: age - SIGNATURE_MAX_AGE 
      });
      return { valid: false, error: ERROR_CODES.WEBHOOK_EXPIRED };
    }

    // ========================================================================
    // CAMADA 5: VALIDAR ASSINATURA HMAC-SHA256
    // ========================================================================

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
    const expectedHash = await generateHmacSignature(webhookSecret, manifest);

    logger.info('Comparando assinaturas', {
      expected: expectedHash.substring(0, 10) + '...',
      received: receivedHash.substring(0, 10) + '...',
      manifest
    });

    if (expectedHash !== receivedHash) {
      logger.error('🔴 Assinatura não corresponde - REJEITANDO webhook', {
        expected: expectedHash.substring(0, 20) + '...',
        received: receivedHash.substring(0, 20) + '...'
      });
      return { valid: false, error: ERROR_CODES.SIGNATURE_MISMATCH };
    }

    logger.info('✅ Assinatura validada com sucesso');
    return { valid: true };

  } catch (error) {
    logger.error('🔴 Erro ao validar assinatura - REJEITANDO webhook', error);
    return { valid: false, error: ERROR_CODES.VALIDATION_ERROR };
  }
}
