/**
 * Funções de logging centralizadas
 * 
 * @version 2.0.0 - RISE Protocol V2 Compliant - Zero `any`
 */

export function logInfo(message: string, data?: unknown): void {
  console.log(`[mercadopago-create-payment] [INFO] ${message}`, data ? JSON.stringify(data) : '');
}

export function logError(message: string, error?: unknown): void {
  console.error(`[mercadopago-create-payment] [ERROR] ${message}`, error);
}

export function logWarn(message: string, data?: unknown): void {
  console.warn(`[mercadopago-create-payment] [WARN] ${message}`, data ? JSON.stringify(data) : '');
}
