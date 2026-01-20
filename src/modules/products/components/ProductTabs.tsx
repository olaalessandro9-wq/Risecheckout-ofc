/**
 * ProductTabs - Wrapper das Abas de Edição de Produto
 * 
 * Este componente organiza todas as abas do sistema de edição,
 * permitindo fácil navegação e adição de novas abas.
 * 
 * Estendido para suportar:
 * - Indicadores visuais de erro por aba
 * - Navegação controlada via Context
 * - Barra de ações (Excluir/Salvar) no final de cada aba
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Sistema de Validação Global
 */

import { lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralTab } from "../tabs/GeneralTab";
import { ConfiguracoesTab } from "../tabs/ConfiguracoesTab";
import { OrderBumpTab } from "../tabs/OrderBumpTab";
import { UpsellTab } from "../tabs/UpsellTab";
import { CheckoutTab } from "../tabs/CheckoutTab";
import { CuponsTab } from "../tabs/CuponsTab";
import { LinksTab } from "../tabs/LinksTab";
import { MembersAreaTab } from "../tabs/MembersAreaTab";
import { ProductTabFooter } from "./ProductTabFooter";
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
// TAB CONTENT WITH FOOTER - Wrapper que adiciona a barra de ações
// ============================================================================

interface TabContentWithFooterProps {
  value: string;
  children: React.ReactNode;
}

/**
 * Wrapper que envolve o conteúdo de cada aba e adiciona
 * automaticamente a barra de ações (ProductTabFooter) no final.
 * 
 * Isso garante consistência e evita repetição de código.
 */
function TabContentWithFooter({ value, children }: TabContentWithFooterProps) {
  return (
    <TabsContent value={value} className="space-y-6">
      {children}
      <ProductTabFooter />
    </TabsContent>
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
  const { canHaveAffiliates } = usePermissions();
  
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
        </TabTriggerWithError>
      </TabsList>
      
      {/* ABA GERAL */}
      <TabContentWithFooter value="geral">
        <GeneralTab />
      </TabContentWithFooter>
      
      {/* ABA CONFIGURAÇÕES */}
      <TabContentWithFooter value="configuracoes">
        <ConfiguracoesTab />
      </TabContentWithFooter>
      
      {/* ABA ORDER BUMP */}
      <TabContentWithFooter value="order-bump">
        <OrderBumpTab />
      </TabContentWithFooter>
      
      {/* ABA UPSELL/DOWNSELL */}
      <TabContentWithFooter value="upsell">
        <UpsellTab />
      </TabContentWithFooter>
      
      {/* ABA CHECKOUT */}
      <TabContentWithFooter value="checkout">
        <CheckoutTab />
      </TabContentWithFooter>
      
      {/* ABA CUPONS */}
      <TabContentWithFooter value="cupons">
        <CuponsTab />
      </TabContentWithFooter>
      
      {/* ABA AFILIADOS (com lazy loading) */}
      {canHaveAffiliates && (
        <TabContentWithFooter value="afiliados">
          <Suspense fallback={<TabLoader />}>
            <AffiliatesTab />
          </Suspense>
        </TabContentWithFooter>
      )}
      
      {/* ABA LINKS */}
      <TabContentWithFooter value="links">
        <LinksTab />
      </TabContentWithFooter>

      {/* ABA ÁREA DE MEMBROS */}
      <TabContentWithFooter value="membros">
        <MembersAreaTab />
      </TabContentWithFooter>
    </Tabs>
  );
}
