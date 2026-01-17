/**
 * AffiliatesTab - Aba de Configurações de Afiliados
 * 
 * Layout unificado em um único Card, como na aba Geral
 */

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, Info, Copy, ExternalLink, CheckCircle2 } from "lucide-react";
import { useProductContext } from "../context/ProductContext";
import { toast } from "sonner";
import { AffiliateSettings } from "../types/product.types";
import { MarketplaceSettings } from "../components/MarketplaceSettings";
import { AffiliateGatewaySettings, type AffiliateGatewaySettingsData } from "../components/AffiliateGatewaySettings";

export function AffiliatesTab() {
  const { 
    product, 
    affiliateSettings, 
    saveAffiliateSettings,
    updateSettingsModified,
    saving
  } = useProductContext();

  const [localSettings, setLocalSettings] = useState(affiliateSettings);
  const [gatewaySettings, setGatewaySettings] = useState<AffiliateGatewaySettingsData>({
    pix_allowed: ["asaas"],
    credit_card_allowed: ["mercadopago", "stripe"],
    require_gateway_connection: true,
  });
  
  // Referência para o snapshot inicial (para comparar mudanças)
  const snapshotRef = useRef<string>("");
  const gatewaySnapshotRef = useRef<string>("");

  // Sincronizar com Context quando mudar e atualizar snapshot
  useEffect(() => {
    if (affiliateSettings) {
      // Interface para campos legados que podem existir no banco
      interface LegacyAffiliateSettings extends AffiliateSettings {
        allowUpsells?: boolean;
      }
      const legacy = affiliateSettings as LegacyAffiliateSettings;
      const normalized = {
        ...affiliateSettings,
        commissionOnOrderBump: affiliateSettings.commissionOnOrderBump ?? legacy.allowUpsells ?? false,
        commissionOnUpsell: affiliateSettings.commissionOnUpsell ?? legacy.allowUpsells ?? false,
        supportEmail: affiliateSettings.supportEmail || "",
        publicDescription: affiliateSettings.publicDescription || "",
        // Campos de marketplace
        showInMarketplace: affiliateSettings.showInMarketplace ?? false,
        marketplaceDescription: affiliateSettings.marketplaceDescription || "",
        marketplaceCategory: affiliateSettings.marketplaceCategory || "",
      };
      setLocalSettings(normalized);
      snapshotRef.current = JSON.stringify(normalized);
    }
  }, [affiliateSettings]);

  // Carregar gateway settings do produto
  useEffect(() => {
    if (product?.id) {
      loadGatewaySettings();
    }
  }, [product?.id]);

  /**
   * Load gateway settings via Edge Function
   * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
   */
  const loadGatewaySettings = async () => {
    if (!product?.id) return;
    try {
      const { api } = await import("@/lib/api");
      
      const { data, error } = await api.call<{ success?: boolean; data?: AffiliateGatewaySettingsData }>('admin-data', { 
        action: 'affiliate-gateway-settings',
        productId: product.id,
      });
      
      if (error) throw new Error(error.message);
      
      if (data?.success && data?.data) {
        const raw = data.data;
        const settings: AffiliateGatewaySettingsData = {
          pix_allowed: raw?.pix_allowed || ["asaas"],
          credit_card_allowed: raw?.credit_card_allowed || ["mercadopago", "stripe"],
          require_gateway_connection: raw?.require_gateway_connection ?? true,
        };
        setGatewaySettings(settings);
        gatewaySnapshotRef.current = JSON.stringify(settings);
      }
    } catch (error: unknown) {
      console.error("Erro ao carregar gateway settings:", error);
    }
  };

  // Detectar mudanças comparando com snapshot
  useLayoutEffect(() => {
    const currentJson = JSON.stringify(localSettings);
    const gatewayJson = JSON.stringify(gatewaySettings);
    const hasSettingsChanges = currentJson !== snapshotRef.current;
    const hasGatewayChanges = gatewayJson !== gatewaySnapshotRef.current;
    updateSettingsModified(hasSettingsChanges || hasGatewayChanges);
  }, [localSettings, gatewaySettings, updateSettingsModified]);

  type AffiliateSettingValue = string | number | boolean;
  
  const handleChange = (field: keyof AffiliateSettings, value: AffiliateSettingValue) => {
    const newSettings = { ...localSettings, [field]: value } as AffiliateSettings;
    setLocalSettings(newSettings);
  };

  const handleGatewaySettingsChange = (settings: AffiliateGatewaySettingsData) => {
    setGatewaySettings(settings);
  };

  const handleSave = async () => {
    try {
      // Validações
      if (localSettings.defaultRate < 1 || localSettings.defaultRate > 90) {
        toast.error("A comissão deve estar entre 1% e 90%");
        return;
      }

      if (localSettings.cookieDuration < 1 || localSettings.cookieDuration > 365) {
        toast.error("A duração do cookie deve estar entre 1 e 365 dias");
        return;
      }

      // Validação de e-mail
      if (localSettings.supportEmail && localSettings.supportEmail.trim() !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(localSettings.supportEmail)) {
          toast.error("Por favor, insira um e-mail válido no formato: exemplo@dominio.com");
          return;
        }
      }

      // Validações de marketplace
      if (localSettings.showInMarketplace) {
        if (!localSettings.marketplaceDescription || localSettings.marketplaceDescription.trim() === "") {
          toast.error("Por favor, adicione uma descrição para o marketplace");
          return;
        }

        if (localSettings.marketplaceDescription.length < 50) {
          toast.error("A descrição do marketplace deve ter pelo menos 50 caracteres");
          return;
        }

        if (localSettings.marketplaceDescription.length > 500) {
          toast.error("A descrição do marketplace deve ter no máximo 500 caracteres");
          return;
        }

        if (!localSettings.marketplaceCategory) {
          toast.error("Por favor, selecione uma categoria para o marketplace");
          return;
        }
      }

      // Salvar gateway settings via Edge Function
      const { api } = await import("@/lib/api");
      
      const { data: result, error: gatewayError } = await api.call<{ success?: boolean; error?: string }>('product-settings', { 
        action: 'update-affiliate-gateway-settings',
        productId: product.id,
        gatewaySettings,
      });
      
      if (gatewayError || !result?.success) {
        throw new Error(result?.error || gatewayError?.message || "Erro ao salvar gateway settings");
      }

      await saveAffiliateSettings(localSettings);
      
      // Atualizar snapshots após salvar
      snapshotRef.current = JSON.stringify(localSettings);
      gatewaySnapshotRef.current = JSON.stringify(gatewaySettings);
      updateSettingsModified(false);
      
      toast.success("Configurações de afiliados salvas com sucesso");
    } catch (error: unknown) {
      console.error("Erro ao salvar afiliados:", error);
      toast.error("Não foi possível salvar as configurações");
    }
  };

  // Verificar se há mudanças comparando com snapshot
  const hasChanges = JSON.stringify(localSettings) !== snapshotRef.current || 
                     JSON.stringify(gatewaySettings) !== gatewaySnapshotRef.current;

  if (!product?.id) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card Único com Todas as Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Programa de Afiliados</CardTitle>
          <CardDescription>
            Configure e gerencie seu programa de afiliados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Status do Programa */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">Status do Programa</h3>
                  {localSettings?.enabled ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                      Inativo
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {localSettings?.enabled 
                    ? "Seu programa está ativo. Afiliados podem gerar vendas e receber comissões."
                    : "Ative o programa para permitir que outras pessoas vendam este produto por você."}
                </p>
              </div>
              <Switch 
                id="affiliateEnabled"
                checked={localSettings?.enabled || false}
                onCheckedChange={(checked) => handleChange('enabled', checked)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Conteúdo condicional quando ativado */}
          {localSettings?.enabled && (
            <>
              <Separator />

              {/* Link de Convite */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-base font-semibold">Link de Convite para Afiliados</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Compartilhe este link para que outras pessoas possam solicitar afiliação
                </p>
                <div className="flex gap-2">
                  <Input
                    value={`https://risecheckout.com/afiliar/${product.id}`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://risecheckout.com/afiliar/${product.id}`);
                      toast.success("Link copiado!");
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(`/afiliar/${product.id}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Marketplace Settings */}
              <MarketplaceSettings 
                productId={product.id} 
                affiliateEnabled={localSettings?.enabled || false}
                showInMarketplace={localSettings?.showInMarketplace || false}
                marketplaceDescription={localSettings?.marketplaceDescription || ""}
                marketplaceCategory={localSettings?.marketplaceCategory || ""}
                onChange={handleChange}
              />

              <Separator />

              {/* Comissão e Atribuição */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Comissão e Atribuição</h3>
                  <p className="text-sm text-muted-foreground">
                    Defina quanto e como os afiliados serão remunerados
                  </p>
                </div>

                {/* Comissão Padrão */}
                <div className="space-y-2">
                  <Label htmlFor="defaultRate">Comissão Padrão</Label>
                  <div className="relative max-w-xs">
                    <Input
                      id="defaultRate"
                      type="number"
                      min="1"
                      max="90"
                      step="1"
                      value={localSettings.defaultRate}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          handleChange('defaultRate', Math.min(90, Math.max(1, value)));
                        }
                      }}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Porcentagem que o afiliado receberá sobre cada venda (1% - 100%)
                  </p>
                </div>

                {/* Grid de Configurações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Duração do Cookie */}
                  <div className="space-y-2">
                    <Label htmlFor="cookieDuration">Duração do Cookie</Label>
                    <Select 
                      value={String(localSettings.cookieDuration)} 
                      onValueChange={(val) => handleChange('cookieDuration', Number(val))}
                    >
                      <SelectTrigger id="cookieDuration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Dia</SelectItem>
                        <SelectItem value="7">7 Dias (1 semana)</SelectItem>
                        <SelectItem value="30">30 Dias (1 mês)</SelectItem>
                        <SelectItem value="60">60 Dias (2 meses)</SelectItem>
                        <SelectItem value="90">90 Dias (3 meses)</SelectItem>
                        <SelectItem value="180">180 Dias (6 meses)</SelectItem>
                        <SelectItem value="365">365 Dias (1 ano)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Tempo de validade do link após o clique
                    </p>
                  </div>

                  {/* Modelo de Atribuição */}
                  <div className="space-y-2">
                    <Label htmlFor="attributionModel">Modelo de Atribuição</Label>
                    <Select 
                      value={localSettings.attributionModel} 
                      onValueChange={(val) => handleChange('attributionModel', val)}
                    >
                      <SelectTrigger id="attributionModel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last_click">Último Clique</SelectItem>
                        <SelectItem value="first_click">Primeiro Clique</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Qual afiliado recebe a comissão
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Regras Avançadas */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Regras Avançadas</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure comissões em produtos adicionais e aprovação de afiliados
                  </p>
                </div>

                {/* Switches */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="requireApproval">Exigir aprovação para novos afiliados</Label>
                      <p className="text-sm text-muted-foreground">
                        Você precisará aprovar manualmente cada novo afiliado
                      </p>
                    </div>
                    <Switch 
                      id="requireApproval"
                      checked={localSettings.requireApproval || false}
                      onCheckedChange={(checked) => handleChange('requireApproval', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="commissionOnOrderBump">Comissão sobre Order Bumps</Label>
                      <p className="text-sm text-muted-foreground">
                        Afiliado recebe comissão sobre order bumps vendidos
                      </p>
                    </div>
                    <Switch 
                      id="commissionOnOrderBump"
                      checked={localSettings.commissionOnOrderBump || false}
                      onCheckedChange={(checked) => handleChange('commissionOnOrderBump', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="commissionOnUpsell">Comissão sobre Upsells</Label>
                      <p className="text-sm text-muted-foreground">
                        Afiliado recebe comissão sobre upsells vendidos
                      </p>
                    </div>
                    <Switch 
                      id="commissionOnUpsell"
                      checked={localSettings.commissionOnUpsell || false}
                      onCheckedChange={(checked) => handleChange('commissionOnUpsell', checked)}
                    />
                  </div>
                </div>

                {/* Alert sobre Split Payment */}
                <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Importante:</strong> Para que os afiliados recebam suas comissões automaticamente, 
                    eles precisam conectar suas contas do Mercado Pago. O split de pagamento é feito na fonte, 
                    garantindo zero risco de dívidas pendentes.
                  </AlertDescription>
                </Alert>
              </div>

              <Separator />

              {/* Gateways para Afiliados - NOVA SEÇÃO */}
              <AffiliateGatewaySettings
                value={gatewaySettings}
                onChange={handleGatewaySettingsChange}
                disabled={saving}
              />

              <Separator />

              {/* Informações para Afiliados */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Informações para Afiliados</h3>
                  <p className="text-sm text-muted-foreground">
                    Dados que serão exibidos na página pública de afiliação
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportEmail">E-mail de Suporte</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    placeholder="suporte@seusite.com"
                    value={localSettings.supportEmail || ""}
                    onChange={(e) => handleChange('supportEmail', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    E-mail para afiliados entrarem em contato com dúvidas
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publicDescription">Descrição Pública</Label>
                  <Textarea
                    id="publicDescription"
                    placeholder="Descreva seu programa de afiliados, benefícios, materiais de divulgação disponíveis..."
                    value={localSettings.publicDescription || ""}
                    onChange={(e) => handleChange('publicDescription', e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Será exibida na página pública de solicitação de afiliação
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Botão de Salvar dentro do Card */}
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="bg-primary hover:bg-primary/90"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
