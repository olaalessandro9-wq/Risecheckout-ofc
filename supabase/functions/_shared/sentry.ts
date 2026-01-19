/**
 * Módulo compartilhado para integração com Sentry via HTTP API
 * 
 * Abordagem leve sem SDK Deno - envia erros diretamente para a API do Sentry.
 * 
 * Uso:
 * 
 * import { withSentry } from '../_shared/sentry.ts';
 * 
 * Deno.serve(withSentry('function-name', async (req) => {
 *   // seu código aqui
 * }));
 */

import { createLogger } from "./logger.ts";

const log = createLogger("Sentry");

const SENTRY_INGEST_URL = 'https://o4510653305126912.ingest.us.sentry.io/api/4510653312401408/envelope/';
const SENTRY_PUBLIC_KEY = 'e765578f4626da6f4f17cb8841935ee2';

/**
 * Gera um event_id único para o Sentry (32 caracteres hex)
 */
function generateEventId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Envia exceção para o Sentry via HTTP API
 */
export async function captureException(
  error: Error,
  context: {
    functionName: string;
    url?: string;
    method?: string;
    extra?: Record<string, unknown>;
  }
): Promise<void> {
  const sentryDsn = Deno.env.get('SENTRY_DSN');
  
  // Se SENTRY_DSN não está configurado, apenas logar localmente
  if (!sentryDsn) {
    log.error(`[Local] ${context.functionName}: ${error.message}`);
    return;
  }

  const eventId = generateEventId();
  const timestamp = new Date().toISOString();

  // Envelope header
  const envelopeHeader = JSON.stringify({
    event_id: eventId,
    sent_at: timestamp,
  });

  // Event item header
  const itemHeader = JSON.stringify({
    type: 'event',
  });

  // Event payload
  const eventPayload = JSON.stringify({
    event_id: eventId,
    timestamp: timestamp,
    platform: 'node',
    level: 'error',
    environment: Deno.env.get('SENTRY_ENVIRONMENT') || 'production',
    server_name: 'supabase-edge-function',
    transaction: context.functionName,
    exception: {
      values: [
        {
          type: error.name || 'Error',
          value: error.message,
          stacktrace: error.stack ? {
            frames: parseStackTrace(error.stack),
          } : undefined,
        },
      ],
    },
    tags: {
      function_name: context.functionName,
      region: Deno.env.get('SB_REGION') || 'unknown',
    },
    request: {
      url: context.url,
      method: context.method,
    },
    extra: context.extra,
  });

  // Montar envelope (header + \n + item header + \n + payload)
  const envelope = `${envelopeHeader}\n${itemHeader}\n${eventPayload}`;

  try {
    const response = await fetch(SENTRY_INGEST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=edge-function/1.0, sentry_key=${SENTRY_PUBLIC_KEY}`,
      },
      body: envelope,
    });

    if (response.ok) {
      log.info(`✅ Erro enviado: ${eventId}`);
    } else {
      log.error(`❌ Falha ao enviar: ${response.status}`);
    }
  } catch (sendError) {
    log.error(`❌ Erro ao enviar`, sendError);
  }
}

/**
 * Parse stack trace para formato Sentry
 */
function parseStackTrace(stack: string): Array<{ filename: string; function: string; lineno?: number }> {
  const lines = stack.split('\n').slice(1); // Remove primeira linha (mensagem do erro)
  const frames: Array<{ filename: string; function: string; lineno?: number }> = [];

  for (const line of lines) {
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/) ||
                  line.match(/at\s+(.+?):(\d+):\d+/);
    
    if (match) {
      frames.push({
        function: match[1] || '<anonymous>',
        filename: match[2] || 'unknown',
        lineno: parseInt(match[3], 10) || undefined,
      });
    }
  }

  return frames.reverse(); // Sentry espera frames do mais antigo para o mais recente
}

/**
 * Wrapper para handlers de Edge Functions com Sentry
 * 
 * Uso:
 * 
 * Deno.serve(withSentry('my-function', async (req) => {
 *   // seu código aqui
 * }));
 */
export function withSentry(
  functionName: string,
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      log.error(`[${functionName}] ❌ Erro capturado: ${err.message}`);
      
      // Enviar para Sentry
      await captureException(err, {
        functionName,
        url: req.url,
        method: req.method,
        extra: {
          headers: Object.fromEntries(req.headers.entries()),
        },
      });

      // Retornar resposta de erro padrão
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
