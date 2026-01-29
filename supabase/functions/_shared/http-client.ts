/**
 * HTTP Client - RISE V3 Compatibility Layer
 * 
 * Re-export do módulo http/ para manter compatibilidade com imports existentes.
 * 
 * @deprecated [2026-01-29] Prefira importar diretamente de "./_shared/http/index.ts"
 * @removalDate 2026-03-01 - Migrar todos os imports antes desta data
 * @usedBy AsaasAdapter, MercadoPagoAdapter, PushinPayAdapter, asaas-create-payment, mercadopago-create-payment
 * @see docs/EDGE_FUNCTIONS_REGISTRY.md
 */

export * from "./http/index.ts";
