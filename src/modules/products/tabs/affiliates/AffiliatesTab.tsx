/**
 * AffiliatesTab - Aba de Configurações de Afiliados
 * 
 * MODULARIZADO seguindo Rise Architect Protocol V3.
 * Componente orquestrador que delega para sub-componentes.
 * 
 * Antes: 530 linhas → Agora: ~100 linhas
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

import { useAffiliatesTab } from "./useAffiliatesTab";
import { useProductContext } from "../../context/ProductContext";
import {
  AffiliateProgramStatus,
  AffiliateInviteLink,
  CommissionSettings,
  AdvancedRules,
  SupportContact,
} from "./components";
import { MarketplaceSettings } from "../../components/MarketplaceSettings";
import { AffiliateGatewaySettings } from "../../components/AffiliateGatewaySettings";

// ============================================================================
// COMPONENT
// ============================================================================

export function AffiliatesTab() {
  const {
    product,
    localSettings,
    gatewaySettings,
    handleChange,
    handleGatewaySettingsChange,
  } = useAffiliatesTab();
  
  const { saveAll, saving, hasUnsavedChanges } = useProductContext();

  // Loading state
  if (!product?.id) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Programa de Afiliados</CardTitle>
          <CardDescription>
            Configure e gerencie seu programa de afiliados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <AffiliateProgramStatus 
            enabled={localSettings.enabled} 
            onChange={handleChange} 
          />

          {localSettings.enabled && (
            <>
              <Separator />
              
              <AffiliateInviteLink productId={product.id} />
              
              <Separator />
              
              <MarketplaceSettings 
                productId={product.id} 
                affiliateEnabled={localSettings.enabled}
                showInMarketplace={localSettings.showInMarketplace || false}
                marketplaceDescription={localSettings.marketplaceDescription || ""}
                marketplaceCategory={localSettings.marketplaceCategory || ""}
                onChange={handleChange}
              />
              
              <Separator />
              
              <CommissionSettings 
                settings={localSettings} 
                onChange={handleChange} 
              />
              
              <Separator />
              
              <AdvancedRules 
                settings={localSettings} 
                onChange={handleChange} 
              />
              
              <Separator />
              
              <AffiliateGatewaySettings
                value={gatewaySettings}
                onChange={handleGatewaySettingsChange}
                disabled={saving}
              />
              
              <Separator />
              
              <SupportContact 
                settings={localSettings} 
                onChange={handleChange} 
              />
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={saveAll}
              disabled={saving || !hasUnsavedChanges}
              className="bg-primary hover:bg-primary/90"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {saving ? "Salvando..." : "Salvar Produto"}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
