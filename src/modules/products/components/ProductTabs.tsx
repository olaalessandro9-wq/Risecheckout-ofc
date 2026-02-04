/**
 * ProductTabs - Wrapper das Abas de Edição de Produto
 * 
 * Este componente organiza todas as abas do sistema de edição,
 * permitindo fácil navegação e adição de novas abas.
 * 
 * Estendido para suportar:
 * - Indicadores visuais de erro por aba
 * - Navegação controlada via Context
 * - Restrição de acesso à Área de Membros por role
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Sistema de Validação Global
 */

import { lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GeneralTab } from "../tabs/GeneralTab";
import { ConfiguracoesTab } from "../tabs/ConfiguracoesTab";
import { OrderBumpTab } from "../tabs/OrderBumpTab";
import { UpsellTab } from "../tabs/UpsellTab";
import { CheckoutTab } from "../tabs/CheckoutTab";
import { CuponsTab } from "../tabs/CuponsTab";
import { LinksTab } from "../tabs/LinksTab";
import { MembersAreaTab } from "../tabs/MembersAreaTab";
import { ComingSoonPlaceholder } from "@/components/ui/coming-soon-placeholder";
import { usePermissions } from "@/hooks/usePermissions";
import { useProductContext } from "../context/ProductContext";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabValidationMap } from "../types/tabValidation.types";

// Lazy loading para AffiliatesTab (aba pesada, só carrega quando necessário)
const AffiliatesTab = lazy(() => import("../tabs/AffiliatesTab").then(m => ({ default: m.AffiliatesTab })));

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// ============================================================================
// TAB TRIGGER COM INDICADOR DE ERRO
// ============================================================================

interface TabTriggerWithErrorProps {
  value: string;
  children: React.ReactNode;
  tabErrors: TabValidationMap;
}

function TabTriggerWithError({ value, children, tabErrors }: TabTriggerWithErrorProps) {
  const hasError = tabErrors[value]?.hasError;

  return (
    <TabsTrigger 
      value={value}
      className={cn(
        "relative",
        hasError && "text-destructive border-destructive data-[state=active]:text-destructive"
      )}
    >
      {children}
      {hasError && (
        <AlertCircle className="ml-1.5 h-3.5 w-3.5 text-destructive" />
      )}
    </TabsTrigger>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProductTabs() {
  const { canHaveAffiliates, canAccessMembersArea } = usePermissions();
  
  // Consumir estado de validação do Context
  const { activeTab, setActiveTab, tabErrors } = useProductContext();

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={setActiveTab} 
      className="w-full"
    >
      <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
        <TabTriggerWithError value="geral" tabErrors={tabErrors}>
          Geral
        </TabTriggerWithError>
        
        <TabTriggerWithError value="configuracoes" tabErrors={tabErrors}>
          Configurações
        </TabTriggerWithError>
        
        <TabTriggerWithError value="order-bump" tabErrors={tabErrors}>
          Order Bump
        </TabTriggerWithError>
        
        <TabTriggerWithError value="upsell" tabErrors={tabErrors}>
          Upsell / Downsell
        </TabTriggerWithError>
        
        <TabTriggerWithError value="checkout" tabErrors={tabErrors}>
          Checkout
        </TabTriggerWithError>
        
        <TabTriggerWithError value="cupons" tabErrors={tabErrors}>
          Cupons
        </TabTriggerWithError>
        
        {canHaveAffiliates && (
          <TabTriggerWithError value="afiliados" tabErrors={tabErrors}>
            Afiliados
          </TabTriggerWithError>
        )}
        
        <TabTriggerWithError value="links" tabErrors={tabErrors}>
          Links
        </TabTriggerWithError>
        
        <TabTriggerWithError value="membros" tabErrors={tabErrors}>
          Área de Membros
          {!canAccessMembersArea && (
            <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0 h-4">
              Em Breve
            </Badge>
          )}
        </TabTriggerWithError>
      </TabsList>
      
      {/* ABA GERAL */}
      <TabsContent value="geral" className="space-y-6">
        <GeneralTab />
      </TabsContent>
      
      {/* ABA CONFIGURAÇÕES */}
      <TabsContent value="configuracoes" className="space-y-6">
        <ConfiguracoesTab />
      </TabsContent>
      
      {/* ABA ORDER BUMP */}
      <TabsContent value="order-bump" className="space-y-6">
        <OrderBumpTab />
      </TabsContent>
      
      {/* ABA UPSELL/DOWNSELL */}
      <TabsContent value="upsell" className="space-y-6">
        <UpsellTab />
      </TabsContent>
      
      {/* ABA CHECKOUT */}
      <TabsContent value="checkout" className="space-y-6">
        <CheckoutTab />
      </TabsContent>
      
      {/* ABA CUPONS */}
      <TabsContent value="cupons" className="space-y-6">
        <CuponsTab />
      </TabsContent>
      
      {/* ABA AFILIADOS (com lazy loading) */}
      {canHaveAffiliates && (
        <TabsContent value="afiliados" className="space-y-6">
          <Suspense fallback={<TabLoader />}>
            <AffiliatesTab />
          </Suspense>
        </TabsContent>
      )}
      
      {/* ABA LINKS */}
      <TabsContent value="links" className="space-y-6">
        <LinksTab />
      </TabsContent>

      {/* ABA ÁREA DE MEMBROS */}
      <TabsContent value="membros" className="space-y-6">
        {canAccessMembersArea ? (
          <MembersAreaTab />
        ) : (
          <ComingSoonPlaceholder 
            title="Área de Membros"
            description="Estamos preparando esta funcionalidade. Em breve você poderá criar cursos e conteúdos exclusivos para seus clientes."
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
