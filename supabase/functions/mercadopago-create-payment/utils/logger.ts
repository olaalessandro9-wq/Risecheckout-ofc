/**
 * Funções de logging centralizadas
 */

export function logInfo(message: string, data?: any) {
  console.log(`[mercadopago-create-payment] [INFO] ${message}`, data ? JSON.stringify(data) : '');
}

export function logError(message: string, error?: any) {
  console.error(`[mercadopago-create-payment] [ERROR] ${message}`, error);
}

export function logWarn(message: string, data?: any) {
  console.warn(`[mercadopago-create-payment] [WARN] ${message}`, data ? JSON.stringify(data) : '');
}
