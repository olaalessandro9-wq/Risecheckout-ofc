/**
 * Módulo compartilhado para integração com Sentry
 * 
 * Este módulo fornece funções utilitárias para rastreamento de erros
 * usando o Sentry em todas as Edge Functions.
 * 
 * Uso:
 * 
 * import { initSentry, captureError } from '../_shared/sentry.ts';
 * 
 * const sentry = initSentry();
 * 
 * try {
 *   // código
 * } catch (error) {
 *   await captureError(sentry, error);
 * }
 */

import * as Sentry from 'https://deno.land/x/sentry/index.mjs';

export interface SentryClient {
  captureException: (error: Error) => void;
  flush: (timeout: number) => Promise<boolean>;
}

/**
 * Inicializa o cliente Sentry
 * 
 * Configurações:
 * - SENTRY_DSN: Data Source Name do projeto Sentry (obrigatório)
 * - SENTRY_ENVIRONMENT: Ambiente (production, staging, development)
 * - SENTRY_TRACES_SAMPLE_RATE: Taxa de amostragem para performance (0.0 a 1.0)
 */
export function initSentry(): SentryClient | null {
  const sentryDsn = Deno.env.get('SENTRY_DSN');
  
  if (!sentryDsn) {
    console.warn('⚠️  SENTRY_DSN não configurado. Rastreamento de erros desabilitado.');
    return null;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: Deno.env.get('SENTRY_ENVIRONMENT') || 'production',
    defaultIntegrations: false,
    tracesSampleRate: parseFloat(Deno.env.get('SENTRY_TRACES_SAMPLE_RATE') || '1.0'),
  });

  // Define tags customizadas para contexto
  Sentry.setTag('region', Deno.env.get('SB_REGION') || 'unknown');
  Sentry.setTag('execution_id', Deno.env.get('SB_EXECUTION_ID') || 'unknown');

  console.log('✅ Sentry inicializado com sucesso');

  return Sentry as SentryClient;
}

/**
 * Captura e envia um erro para o Sentry
 * 
 * @param sentry - Cliente Sentry inicializado
 * @param error - Erro a ser capturado
 * @param context - Contexto adicional (opcional)
 */
export async function captureError(
  sentry: SentryClient | null,
  error: Error,
  context?: Record<string, unknown>
): Promise<void> {
  if (!sentry) {
    console.error('❌ Erro capturado (Sentry desabilitado):', error);
    return;
  }

  try {
    // Adiciona contexto extra se fornecido
    if (context) {
      Sentry.setContext('extra', context);
    }

    // Captura a exceção
    sentry.captureException(error);

    // Aguarda o envio para o Sentry (timeout de 2 segundos)
    await sentry.flush(2000);

    console.log('✅ Erro enviado para o Sentry');
  } catch (sentryError) {
    console.error('❌ Falha ao enviar erro para o Sentry:', sentryError);
  }
}

/**
 * Wrapper para handlers de Edge Functions com Sentry
 * 
 * Uso:
 * 
 * Deno.serve(withSentry(async (req) => {
 *   // seu código aqui
 * }));
 */
export function withSentry(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  const sentry = initSentry();

  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await captureError(sentry, err, {
        url: req.url,
        method: req.method,
        headers: Object.fromEntries(req.headers.entries()),
      });

      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: err.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
