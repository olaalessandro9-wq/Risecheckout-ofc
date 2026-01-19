/**
 * Logger Centralizado - Rise Checkout
 * 
 * Em DESENVOLVIMENTO: Todos os níveis de log são exibidos
 * Em PRODUÇÃO: Apenas errors são exibidos (para monitoramento)
 * 
 * INTEGRAÇÃO SENTRY: Erros são enviados automaticamente para o Sentry
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 */

import * as Sentry from "@sentry/react";

const isDev = import.meta.env.DEV;
const LOG_PREFIX = '[Rise]';

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabledLevels: LogLevel[];
  prefix: string;
}

const config: LoggerConfig = {
  enabledLevels: isDev ? ['trace', 'debug', 'info', 'warn', 'error'] : ['error'],
  prefix: LOG_PREFIX,
};

/**
 * Logger principal com contexto obrigatório
 */
export const logger = {
  trace: (context: string, message: string, ...args: unknown[]) => {
    if (config.enabledLevels.includes('trace')) {
      console.debug(`🔍 ${config.prefix}[${context}] ${message}`, ...args);
    }
  },

  debug: (context: string, message: string, ...args: unknown[]) => {
    if (config.enabledLevels.includes('debug')) {
      console.debug(`🐛 ${config.prefix}[${context}] ${message}`, ...args);
    }
  },

  info: (context: string, message: string, ...args: unknown[]) => {
    if (config.enabledLevels.includes('info')) {
      console.log(`ℹ️ ${config.prefix}[${context}] ${message}`, ...args);
    }
  },

  warn: (context: string, message: string, ...args: unknown[]) => {
    if (config.enabledLevels.includes('warn')) {
      console.warn(`⚠️ ${config.prefix}[${context}] ${message}`, ...args);
    }
  },

  error: (context: string, message: string, ...args: unknown[]) => {
    // Erros SEMPRE são logados (importante para monitoramento em produção)
    console.error(`🚨 ${config.prefix}[${context}] ${message}`, ...args);
    
    // Enviar para Sentry
    const errorArg = args.find(arg => arg instanceof Error);
    if (errorArg instanceof Error) {
      Sentry.captureException(errorArg, {
        tags: { context },
        extra: { message, args: args.filter(a => !(a instanceof Error)) }
      });
    } else {
      Sentry.captureMessage(`${context}: ${message}`, {
        level: 'error',
        tags: { context },
        extra: { args }
      });
    }
  },
};

/**
 * Factory para criar logger com contexto fixo
 * 
 * @example
 * const log = createLogger('CouponField');
 * log.trace('Dados detalhados', data); // Muito verboso, apenas dev
 * log.debug('Iniciando validação');
 * log.info('Cupom validado com sucesso');
 * log.warn('Cupom próximo de expirar');
 * log.error('Falha na validação', error);
 */
export const createLogger = (context: string) => ({
  trace: (message: string, ...args: unknown[]) => logger.trace(context, message, ...args),
  debug: (message: string, ...args: unknown[]) => logger.debug(context, message, ...args),
  info: (message: string, ...args: unknown[]) => logger.info(context, message, ...args),
  warn: (message: string, ...args: unknown[]) => logger.warn(context, message, ...args),
  error: (message: string, ...args: unknown[]) => logger.error(context, message, ...args),
});

export type Logger = ReturnType<typeof createLogger>;
