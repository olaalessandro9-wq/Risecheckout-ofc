import { Package, BarChart3, Info, ShoppingBag, CreditCard, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AffiliationTabId } from "@/modules/affiliation";

interface AffiliationSidebarProps {
  activeTab: AffiliationTabId;
  onTabChange: (tab: AffiliationTabId) => void;
  hasOtherProducts: boolean;
  tabErrors?: Partial<Record<AffiliationTabId, boolean>>;
}

const tabs: Array<{
  id: AffiliationTabId;
  label: string;
  icon: typeof CreditCard;
  description: string;
}> = [
  {
    id: "gateways",
    label: "Gateways",
    icon: CreditCard,
    description: "Configure seus gateways",
  },
  {
    id: "offers",
    label: "Ofertas",
    icon: Package,
    description: "Links e ofertas disponíveis",
  },
  {
    id: "pixels",
    label: "Pixels de Rastreamento",
    icon: BarChart3,
    description: "Configure seus pixels",
  },
  {
    id: "details",
    label: "Afiliação",
    icon: Info,
    description: "Detalhes do programa",
  },
  {
    id: "other-products",
    label: "Outros Produtos",
    icon: ShoppingBag,
    description: "Do mesmo produtor",
  },
];

export function AffiliationSidebar({ 
  activeTab, 
  onTabChange, 
  hasOtherProducts,
  tabErrors = {},
}: AffiliationSidebarProps) {
  return (
    <nav className="w-64 flex-shrink-0">
      <div className="bg-card border rounded-lg p-2 space-y-1">
        {tabs.map((tab) => {
          // Esconder aba "Outros Produtos" se não houver outros produtos
          if (tab.id === "other-products" && !hasOtherProducts) {
            return null;
          }

          const isActive = activeTab === tab.id;
          const hasError = tabErrors[tab.id] === true;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-md text-left transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 mt-0.5 flex-shrink-0",
                isActive ? "text-primary-foreground" : "text-muted-foreground"
              )} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={cn(
                    "font-medium text-sm",
                    isActive ? "text-primary-foreground" : "text-foreground"
                  )}>
                    {tab.label}
                  </p>
                  {hasError && (
                    <AlertCircle className={cn(
                      "h-3.5 w-3.5 flex-shrink-0",
                      isActive ? "text-primary-foreground" : "text-destructive"
                    )} />
                  )}
                </div>
                <p className={cn(
                  "text-xs mt-0.5",
                  isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {tab.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Re-export type for backward compatibility
export type AffiliationTab = AffiliationTabId;
