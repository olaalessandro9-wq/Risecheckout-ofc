/**
 * Barrel export para componentes de autenticação de compradores
 */

export { BuyerAuthModal } from "./BuyerAuthModal";
export { BuyerQuickLogin } from "./BuyerQuickLogin";

export type { 
  BuyerProfile, 
  BuyerSession, 
  SavedCard, 
  OrderHistory 
} from "@/hooks/checkout/useBuyerAuth";
