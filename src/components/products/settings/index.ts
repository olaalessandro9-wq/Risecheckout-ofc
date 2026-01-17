/**
 * Exports do módulo de configurações de produto
 * 
 * NOTA: useProductSettings (local) foi DEPRECADO.
 * O ProductSettingsPanel agora usa o ProductContext diretamente.
 */

export { RequiredFieldsSection } from "./RequiredFieldsSection";
export { PaymentMethodSection } from "./PaymentMethodSection";
export { GatewaySection } from "./GatewaySection";
export { PixelsSection } from "./PixelsSection";
export type { ProductSettings, RequiredFields, GatewayCredentials, SettingsFormProps } from "./types";
