/**
 * AffiliateGatewaySettings - Configuração de Gateways permitidos para Afiliados
 * 
 * Permite ao Owner definir quais gateways PIX e Cartão os afiliados podem usar.
 * Asaas para cartão NÃO é opção (PCI compliance).
 */

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CreditCard, QrCode, Info } from "lucide-react";

// Gateways disponíveis
const PIX_GATEWAYS = [
  { id: "asaas", label: "Asaas", description: "Split automático para afiliados" },
  { id: "mercadopago", label: "Mercado Pago", description: "Gateway popular no Brasil" },
  { id: "pushinpay", label: "PushinPay", description: "Gateway especializado em PIX" },
] as const;

const CREDIT_CARD_GATEWAYS = [
  { id: "mercadopago", label: "Mercado Pago", description: "Tokenização segura (PCI SAQ A)" },
  { id: "stripe", label: "Stripe", description: "Padrão internacional (PCI SAQ A)" },
  // Asaas NÃO está aqui por questões de PCI compliance
] as const;

export interface AffiliateGatewaySettingsData {
  pix_allowed: string[];
  credit_card_allowed: string[];
  require_gateway_connection: boolean;
}

interface AffiliateGatewaySettingsProps {
  value: AffiliateGatewaySettingsData;
  onChange: (settings: AffiliateGatewaySettingsData) => void;
  disabled?: boolean;
}

export function AffiliateGatewaySettings({ 
  value, 
  onChange,
  disabled = false 
}: AffiliateGatewaySettingsProps) {
  const [settings, setSettings] = useState<AffiliateGatewaySettingsData>(() => ({
    pix_allowed: value?.pix_allowed || ["asaas"],
    credit_card_allowed: value?.credit_card_allowed || ["mercadopago", "stripe"],
    require_gateway_connection: value?.require_gateway_connection ?? true,
  }));

  // Sincronizar com prop value
  useEffect(() => {
    if (value) {
      setSettings({
        pix_allowed: value.pix_allowed || ["asaas"],
        credit_card_allowed: value.credit_card_allowed || ["mercadopago", "stripe"],
        require_gateway_connection: value.require_gateway_connection ?? true,
      });
    }
  }, [value]);

  const handlePixGatewayToggle = (gatewayId: string, checked: boolean) => {
    const newPixAllowed = checked
      ? [...settings.pix_allowed, gatewayId]
      : settings.pix_allowed.filter(g => g !== gatewayId);
    
    const newSettings = { ...settings, pix_allowed: newPixAllowed };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const handleCardGatewayToggle = (gatewayId: string, checked: boolean) => {
    const newCardAllowed = checked
      ? [...settings.credit_card_allowed, gatewayId]
      : settings.credit_card_allowed.filter(g => g !== gatewayId);
    
    const newSettings = { ...settings, credit_card_allowed: newCardAllowed };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const handleRequireConnectionToggle = (checked: boolean) => {
    const newSettings = { ...settings, require_gateway_connection: checked };
    setSettings(newSettings);
    onChange(newSettings);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">Gateways Permitidos para Afiliados</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Defina quais gateways de pagamento seus afiliados podem usar. Você precisa ter esses gateways configurados em sua conta.
      </p>

      {/* PIX Gateways */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <QrCode className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Gateways PIX</Label>
        </div>
        
        <div className="grid gap-3">
          {PIX_GATEWAYS.map((gateway) => (
            <div
              key={gateway.id}
              className="flex items-start space-x-3 rounded-md border p-3 bg-card"
            >
              <Checkbox
                id={`pix-${gateway.id}`}
                checked={settings.pix_allowed.includes(gateway.id)}
                onCheckedChange={(checked) => handlePixGatewayToggle(gateway.id, checked === true)}
                disabled={disabled}
              />
              <div className="space-y-0.5 leading-none">
                <label
                  htmlFor={`pix-${gateway.id}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {gateway.label}
                </label>
                <p className="text-xs text-muted-foreground">
                  {gateway.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Credit Card Gateways */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Gateways de Cartão de Crédito</Label>
        </div>
        
        <div className="grid gap-3">
          {CREDIT_CARD_GATEWAYS.map((gateway) => (
            <div
              key={gateway.id}
              className="flex items-start space-x-3 rounded-md border p-3 bg-card"
            >
              <Checkbox
                id={`card-${gateway.id}`}
                checked={settings.credit_card_allowed.includes(gateway.id)}
                onCheckedChange={(checked) => handleCardGatewayToggle(gateway.id, checked === true)}
                disabled={disabled}
              />
              <div className="space-y-0.5 leading-none">
                <label
                  htmlFor={`card-${gateway.id}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {gateway.label}
                </label>
                <p className="text-xs text-muted-foreground">
                  {gateway.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* PCI Compliance Note */}
        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm text-amber-800 dark:text-amber-300">
            <strong>Segurança PCI:</strong> Apenas gateways com tokenização client-side (Mercado Pago e Stripe) 
            estão disponíveis para cartão de crédito, garantindo conformidade PCI SAQ A.
          </AlertDescription>
        </Alert>
      </div>

      {/* Require Connection Toggle */}
      <div className="flex items-center justify-between rounded-md border p-4 bg-card">
        <div className="space-y-0.5">
          <Label htmlFor="require-connection" className="text-sm font-medium">
            Exigir conexão de gateway
          </Label>
          <p className="text-xs text-muted-foreground">
            Afiliados precisam conectar pelo menos um gateway antes de vender
          </p>
        </div>
        <Switch
          id="require-connection"
          checked={settings.require_gateway_connection}
          onCheckedChange={handleRequireConnectionToggle}
          disabled={disabled}
        />
      </div>

      {/* Validation warnings */}
      {settings.pix_allowed.length === 0 && settings.credit_card_allowed.length === 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            Selecione pelo menos um gateway (PIX ou Cartão) para os afiliados poderem vender.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
