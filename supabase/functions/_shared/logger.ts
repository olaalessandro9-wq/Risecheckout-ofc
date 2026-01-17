/**
 * Logger Centralizado - Supabase Edge Functions
 * 
 * Níveis de log controlados por variável de ambiente LOG_LEVEL:
 * - debug: Todos os logs (desenvolvimento)
 * - info: Info, warn e error (padrão)
 * - warn: Apenas warn e error
 * - error: Apenas erros críticos (produção)
 * 
 * @version 1.0.0
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

function getLogLevel(): LogLevel {
  const envLevel = Deno.env.get('LOG_LEVEL')?.toLowerCase();
  if (envLevel && envLevel in LEVELS) {
    return envLevel as LogLevel;
  }
  return 'info'; // Padrão
}

function formatMessage(level: string, context: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
}

function formatData(data: unknown): string {
  if (data === undefined || data === null) return '';
  try {
    return typeof data === 'object' ? JSON.stringify(data) : String(data);
  } catch {
    return '[Unserializable data]';
  }
}

/**
 * Logger com contexto fixo
 */
export interface Logger {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
}

/**
 * Factory para criar logger com contexto fixo
 * 
 * @example
 * const log = createLogger('PushinPayAdapter');
 * log.info('Criando PIX', { orderId: '123' });
 * log.error('Falha na API', error);
 */
export function createLogger(context: string): Logger {
  const currentLevel = LEVELS[getLogLevel()];

  return {
    debug: (message: string, data?: unknown) => {
      if (currentLevel <= LEVELS.debug) {
        console.log(formatMessage('debug', context, message), formatData(data));
      }
    },

    info: (message: string, data?: unknown) => {
      if (currentLevel <= LEVELS.info) {
        console.log(formatMessage('info', context, message), formatData(data));
      }
    },

    warn: (message: string, data?: unknown) => {
      if (currentLevel <= LEVELS.warn) {
        console.warn(formatMessage('warn', context, message), formatData(data));
      }
    },

    error: (message: string, data?: unknown) => {
      // Erros SEMPRE são logados
      console.error(formatMessage('error', context, message), formatData(data));
    }
  };
}

/**
 * Logger global (usar createLogger para contexto específico)
 */
export const logger = createLogger('Edge');
