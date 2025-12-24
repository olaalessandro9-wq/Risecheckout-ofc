import { Package, BarChart3, Info, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export type AffiliationTab = "offers" | "pixels" | "details" | "other-products";

interface AffiliationSidebarProps {
  activeTab: AffiliationTab;
  onTabChange: (tab: AffiliationTab) => void;
  hasOtherProducts: boolean;
}

const tabs = [
  {
    id: "offers" as const,
    label: "Ofertas",
    icon: Package,
    description: "Links e ofertas disponíveis",
  },
  {
    id: "pixels" as const,
    label: "Pixels de Rastreamento",
    icon: BarChart3,
    description: "Configure seus pixels",
  },
  {
    id: "details" as const,
    label: "Afiliação",
    icon: Info,
    description: "Detalhes do programa",
  },
  {
    id: "other-products" as const,
    label: "Outros Produtos",
    icon: ShoppingBag,
    description: "Do mesmo produtor",
  },
];

export function AffiliationSidebar({ activeTab, onTabChange, hasOtherProducts }: AffiliationSidebarProps) {
  return (
    <nav className="w-64 flex-shrink-0">
      <div className="bg-card border rounded-lg p-2 space-y-1">
        {tabs.map((tab) => {
          // Esconder aba "Outros Produtos" se não houver outros produtos
          if (tab.id === "other-products" && !hasOtherProducts) {
            return null;
          }

          const isActive = activeTab === tab.id;
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
              <div>
                <p className={cn(
                  "font-medium text-sm",
                  isActive ? "text-primary-foreground" : "text-foreground"
                )}>
                  {tab.label}
                </p>
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
