/**
 * Navigation Config - Configuração Declarativa de Rotas
 * 
 * Definição ESTÁTICA de todos os itens de navegação.
 * Permissões são filtradas em runtime pelo hook useNavigation.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Configuração Declarativa
 */

import {
  LayoutDashboard,
  Package,
  Store,
  Users,
  Wallet,
  Banknote,
  Settings2,
  BarChart3,
  Webhook,
  ShieldCheck,
  LifeBuoy,
  HelpCircle,
} from "lucide-react";

import type { NavItemConfig } from "../types/navigation.types";
import { SUPPORT_WHATSAPP_URL, HELP_CENTER_URL } from "@/config/links";

/**
 * Configuração completa de navegação
 * 
 * ORDEM DOS ITENS (de cima para baixo):
 * 1. Dashboard
 * 2. Produtos
 * 3. Marketplace
 * 4. Afiliados (apenas owner - quem pode TER afiliados)
 * 5. Gateways (apenas owner) OU Financeiro (não-owners)
 * 6. Configurações (grupo expansível)
 *    - Pixels
 *    - Integrações
 * 7. Administração (admin/owner)
 * 8. Suporte WhatsApp (externo)
 * 9. Ajuda (externo)
 */
export const NAVIGATION_CONFIG: readonly NavItemConfig[] = [
  // ============================================
  // SEÇÃO PRINCIPAL
  // ============================================
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    variant: {
      type: "route",
      path: "/dashboard",
      exact: true, // Apenas /dashboard, não /dashboard/*
    },
  },
  {
    id: "products",
    label: "Produtos",
    icon: Package,
    variant: {
      type: "route",
      path: "/dashboard/produtos",
    },
  },
  {
    id: "marketplace",
    label: "Marketplace",
    icon: Store,
    variant: {
      type: "route",
      path: "/dashboard/marketplace",
    },
  },

  // ============================================
  // SEÇÃO CONDICIONAL (PERMISSÕES)
  // ============================================
  {
    id: "affiliates",
    label: "Afiliados",
    icon: Users,
    variant: {
      type: "route",
      path: "/dashboard/afiliados",
    },
    permissions: {
      // Apenas Owner pode TER programa de afiliados
      requiresPermission: "canHaveAffiliates",
    },
  },
  {
    id: "gateways",
    label: "Gateways",
    icon: Wallet,
    variant: {
      type: "route",
      path: "/dashboard/gateways",
    },
    permissions: {
      // Apenas Owner vê Gateways
      requiresOwner: true,
    },
  },
  {
    id: "financial",
    label: "Financeiro",
    icon: Banknote,
    variant: {
      type: "route",
      path: "/dashboard/financeiro",
    },
    permissions: {
      // Apenas NÃO-owners veem Financeiro
      requiresOwner: false,
    },
  },

  // ============================================
  // GRUPO CONFIGURAÇÕES (EXPANSÍVEL)
  // ============================================
  {
    id: "settings-group",
    label: "Configurações",
    icon: Settings2,
    variant: {
      type: "group",
      children: [
        {
          id: "tracking",
          label: "Trackeamento",
          icon: BarChart3,
          variant: {
            type: "route",
            path: "/dashboard/rastreamento",
          },
        },
        {
          id: "webhooks",
          label: "Webhooks",
          icon: Webhook,
          variant: {
            type: "route",
            path: "/dashboard/webhooks",
          },
        },
      ],
    },
  },

  // ============================================
  // ADMINISTRAÇÃO
  // ============================================
  {
    id: "admin",
    label: "Administração",
    icon: ShieldCheck,
    variant: {
      type: "route",
      path: "/dashboard/admin",
    },
    permissions: {
      requiresAdmin: true,
    },
  },

  // ============================================
  // LINKS EXTERNOS
  // ============================================
  {
    id: "support-whatsapp",
    label: "Suporte pelo WhatsApp",
    icon: LifeBuoy,
    variant: {
      type: "external",
      url: SUPPORT_WHATSAPP_URL,
    },
  },
  {
    id: "help",
    label: "Ajuda",
    icon: HelpCircle,
    variant: {
      type: "external",
      url: HELP_CENTER_URL,
    },
  },
] as const;
