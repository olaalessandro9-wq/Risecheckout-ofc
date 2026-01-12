// src/components/layout/sidebar/buildNavItems.ts

import {
  LayoutDashboard,
  Package,
  Users,
  Banknote,
  Plug,
  ShieldCheck,
  LifeBuoy,
  HelpCircle,
  Store,
  Wallet,
  Settings2,
  BarChart3,
} from "lucide-react";
import { HELP_CENTER_URL, SUPPORT_WHATSAPP_URL } from "@/lib/links";
import type { NavItem } from "./types";

interface BuildNavItemsParams {
  canAccessAdminPanel: boolean;
  isOwner: boolean;
  canHaveAffiliates: boolean;
}

/**
 * buildNavItems - Constrói itens de navegação baseado no role do usuário
 * 
 * Owner: Vê "Gateways" (não "Financeiro") - credenciais via Secrets
 * Outros: Vêm "Financeiro" para configurar suas próprias credenciais
 */
export function buildNavItems(params: BuildNavItemsParams): NavItem[] {
  const base: NavItem[] = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
    { label: "Produtos", icon: Package, to: "/dashboard/produtos" },
    { label: "Marketplace", icon: Store, to: "/dashboard/marketplace" },
    // Condicional: Owner vê "Gateways", demais veem "Financeiro"
    params.isOwner
      ? { label: "Gateways", icon: Wallet, to: "/dashboard/gateways" }
      : { label: "Financeiro", icon: Banknote, to: "/dashboard/financeiro" },
    // Menu expansível "Ferramentas"
    {
      label: "Configurações",
      icon: Settings2,
      children: [
        { label: "Pixels", icon: BarChart3, to: "/dashboard/pixels" },
        { label: "Integrações", icon: Plug, to: "/dashboard/integracoes" },
      ],
    },
    { label: "Administração", icon: ShieldCheck, to: "/dashboard/admin", requiresAdmin: true },
    { label: "Suporte pelo WhatsApp", icon: LifeBuoy, external: SUPPORT_WHATSAPP_URL },
    { label: "Ajuda", icon: HelpCircle, external: HELP_CENTER_URL },
  ];

  // Afiliados só aparece para quem pode ter afiliados (owners)
  if (params.canHaveAffiliates) {
    base.splice(3, 0, { label: "Afiliados", icon: Users, to: "/dashboard/afiliados" });
  }

  return base.filter((item) => {
    if (!item.requiresAdmin) return true;
    return params.canAccessAdminPanel;
  });
}
