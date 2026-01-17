/**
 * ProductTabs - Wrapper das Abas de Edição de Produto
 * 
 * Este componente organiza todas as abas do sistema de edição,
 * permitindo fácil navegação e adição de novas abas.
 */

import { useState, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralTab } from "../tabs/GeneralTab";
import { ConfiguracoesTab } from "../tabs/ConfiguracoesTab";
import { OrderBumpTab } from "../tabs/OrderBumpTab";
import { UpsellTab } from "../tabs/UpsellTab";
import { CheckoutTab } from "../tabs/CheckoutTab";
import { CuponsTab } from "../tabs/CuponsTab";
import { LinksTab } from "../tabs/LinksTab";
import { MembersAreaTab } from "../tabs/MembersAreaTab";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

// Lazy loading para AffiliatesTab (aba pesada, só carrega quando necessário)
const AffiliatesTab = lazy(() => import("../tabs/AffiliatesTab").then(m => ({ default: m.AffiliatesTab })));

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function ProductTabs() {
  const [activeTab, setActiveTab] = useState("geral");
  const { canHaveAffiliates } = usePermissions();

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={setActiveTab} 
      className="w-full"
    >
      <TabsList className="bg-card border border-border">
        <TabsTrigger value="geral">Geral</TabsTrigger>
        <TabsTrigger value="configuracoes">
          Configurações
        </TabsTrigger>
        <TabsTrigger value="order-bump">
          Order Bump
        </TabsTrigger>
        <TabsTrigger value="upsell">
          Upsell / Downsell
        </TabsTrigger>
        <TabsTrigger value="checkout">
          Checkout
        </TabsTrigger>
        <TabsTrigger value="cupons">
          Cupons
        </TabsTrigger>
        {canHaveAffiliates && (
          <TabsTrigger value="afiliados">
            Afiliados
          </TabsTrigger>
        )}
        <TabsTrigger value="links">
          Links
        </TabsTrigger>
        <TabsTrigger value="membros">
          Área de Membros
        </TabsTrigger>
      </TabsList>
      
      {/* ABA GERAL - Renderiza apenas quando ativa */}
      <TabsContent value="geral" className="space-y-6">
        <GeneralTab />
      </TabsContent>
      
      {/* ABA CONFIGURAÇÕES - Renderiza apenas quando ativa */}
      <TabsContent value="configuracoes" className="space-y-6">
        <ConfiguracoesTab />
      </TabsContent>
      
      {/* ABA ORDER BUMP - Renderiza apenas quando ativa */}
      <TabsContent value="order-bump" className="space-y-6">
        <OrderBumpTab />
      </TabsContent>
      
      {/* ABA UPSELL/DOWNSELL - Renderiza apenas quando ativa */}
      <TabsContent value="upsell" className="space-y-6">
        <UpsellTab />
      </TabsContent>
      
      {/* ABA CHECKOUT - Renderiza apenas quando ativa */}
      <TabsContent value="checkout" className="space-y-6">
        <CheckoutTab />
      </TabsContent>
      
      {/* ABA CUPONS - Renderiza apenas quando ativa */}
      <TabsContent value="cupons" className="space-y-6">
        <CuponsTab />
      </TabsContent>
      
      {/* ABA AFILIADOS - Renderiza apenas quando ativa (com lazy loading) */}
      {canHaveAffiliates && (
        <TabsContent value="afiliados" className="space-y-6">
          <Suspense fallback={<TabLoader />}>
            <AffiliatesTab />
          </Suspense>
        </TabsContent>
      )}
      
      {/* ABA LINKS - Renderiza apenas quando ativa */}
      <TabsContent value="links" className="space-y-6">
        <LinksTab />
      </TabsContent>

      {/* ABA ÁREA DE MEMBROS - Renderiza apenas quando ativa */}
      <TabsContent value="membros" className="space-y-6">
        <MembersAreaTab />
      </TabsContent>
    </Tabs>
  );
}
