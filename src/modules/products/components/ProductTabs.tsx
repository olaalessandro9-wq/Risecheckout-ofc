/**
 * ProductTabs - Wrapper das Abas de Edição de Produto
 * 
 * Este componente organiza todas as abas do sistema de edição,
 * permitindo fácil navegação e adição de novas abas.
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralTab } from "../tabs/GeneralTab";
import { ConfiguracoesTab } from "../tabs/ConfiguracoesTab";
import { OrderBumpTab } from "../tabs/OrderBumpTab";
import { UpsellTab } from "../tabs/UpsellTab";
import { CheckoutTab } from "../tabs/CheckoutTab";
import { CuponsTab } from "../tabs/CuponsTab";
import { AffiliatesTab } from "../tabs/AffiliatesTab";
import { LinksTab } from "../tabs/LinksTab";
import { usePermissions } from "@/hooks/usePermissions";

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
      </TabsList>
      
      {/* ABA GERAL */}
      <TabsContent 
        value="geral" 
        className={`space-y-6 ${activeTab !== "geral" ? "hidden" : ""}`}
        forceMount
      >
        <GeneralTab />
      </TabsContent>
      
      {/* ABA CONFIGURAÇÕES */}
      <TabsContent 
        value="configuracoes" 
        className={`space-y-6 ${activeTab !== "configuracoes" ? "hidden" : ""}`}
        forceMount
      >
        <ConfiguracoesTab />
      </TabsContent>
      
      {/* ABA ORDER BUMP */}
      <TabsContent 
        value="order-bump" 
        className={`space-y-6 ${activeTab !== "order-bump" ? "hidden" : ""}`}
        forceMount
      >
        <OrderBumpTab />
      </TabsContent>
      
      {/* ABA UPSELL/DOWNSELL */}
      <TabsContent 
        value="upsell" 
        className={`space-y-6 ${activeTab !== "upsell" ? "hidden" : ""}`}
        forceMount
      >
        <UpsellTab />
      </TabsContent>
      
      {/* ABA CHECKOUT */}
      <TabsContent 
        value="checkout" 
        className={`space-y-6 ${activeTab !== "checkout" ? "hidden" : ""}`}
        forceMount
      >
        <CheckoutTab />
      </TabsContent>
      
      {/* ABA CUPONS */}
      <TabsContent 
        value="cupons" 
        className={`space-y-6 ${activeTab !== "cupons" ? "hidden" : ""}`}
        forceMount
      >
        <CuponsTab />
      </TabsContent>
      
      {/* ABA AFILIADOS - só renderiza se tem permissão */}
      {canHaveAffiliates && (
        <TabsContent 
          value="afiliados" 
          className={`space-y-6 ${activeTab !== "afiliados" ? "hidden" : ""}`}
          forceMount
        >
          <AffiliatesTab />
        </TabsContent>
      )}
      
      {/* ABA LINKS */}
      <TabsContent 
        value="links" 
        className={`space-y-6 ${activeTab !== "links" ? "hidden" : ""}`}
        forceMount
      >
        <LinksTab />
      </TabsContent>
    </Tabs>
  );
}
