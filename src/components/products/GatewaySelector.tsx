/**
 * GatewaySelector - Componente Reutilizável para Seleção de Gateway
 * 
 * Este componente renderiza dinamicamente os gateways disponíveis
 * para um método de pagamento específico.
 * 
 * Características:
 * - Renderização dinâmica baseada no registry
 * - Suporta gateways ativos e "em breve"
 * - Suporta "em breve" por role (comingSoonForRoles)
 * - Exibe taxas automaticamente
 * - Type-safe
 * - Fácil de manter
 */

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import {
  getActiveGatewaysByMethod,
  getGatewaysByMethod,
  formatGatewayFees,
  type PaymentMethod,
  type PaymentGateway,
} from "@/config/payment-gateways";

interface GatewaySelectorProps {
  paymentMethod: PaymentMethod;
  value: string;
  onChange: (value: string) => void;
  showComingSoon?: boolean;
  credentials?: Record<string, { configured: boolean; viaSecrets?: boolean }>;
}

export function GatewaySelector({
  paymentMethod,
  value,
  onChange,
  showComingSoon = true,
  credentials = {},
}: GatewaySelectorProps) {
  const { role } = usePermissions();
  
  // Buscar gateways ativos
  const activeGateways = getActiveGatewaysByMethod(paymentMethod);
  
  // Separar gateways que são "coming soon" para o role atual
  const { availableGateways, comingSoonForRoleGateways } = activeGateways.reduce<{
    availableGateways: PaymentGateway[];
    comingSoonForRoleGateways: PaymentGateway[];
  }>(
    (acc, gateway) => {
      const isComingSoonForRole = gateway.comingSoonForRoles?.includes(role);
      if (isComingSoonForRole) {
        acc.comingSoonForRoleGateways.push(gateway);
      } else {
        acc.availableGateways.push(gateway);
      }
      return acc;
    },
    { availableGateways: [], comingSoonForRoleGateways: [] }
  );
  
  // Buscar gateways "em breve" globais (se habilitado)
  const comingSoonGateways = showComingSoon
    ? getGatewaysByMethod(paymentMethod).filter(
        (g) => g.status === 'coming_soon'
      )
    : [];

  // Se não houver gateways, mostrar mensagem
  if (availableGateways.length === 0 && comingSoonForRoleGateways.length === 0) {
    return (
      <div className="border rounded-lg p-4 bg-muted/30 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum gateway disponível para {paymentMethod}
        </p>
      </div>
    );
  }

  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {/* Gateways Disponíveis */}
      {availableGateways.map((gateway) => (
        <GatewayOption
          key={gateway.id}
          gateway={gateway}
          paymentMethod={paymentMethod}
          isSelected={value === gateway.id}
          isConfigured={credentials[gateway.id]?.configured ?? true}
          viaSecrets={credentials[gateway.id]?.viaSecrets}
        />
      ))}

      {/* Gateways "Em Breve" para este Role */}
      {comingSoonForRoleGateways.map((gateway) => (
        <GatewayRoleComingSoonOption
          key={gateway.id}
          gateway={gateway}
          paymentMethod={paymentMethod}
        />
      ))}

      {/* Gateways "Em Breve" Globais */}
      {comingSoonGateways.map((gateway) => (
        <GatewayComingSoonOption
          key={gateway.id}
          gateway={gateway}
          paymentMethod={paymentMethod}
        />
      ))}

      {/* Placeholder para "Outros Gateways" */}
      {comingSoonGateways.length === 0 && comingSoonForRoleGateways.length === 0 && (
        <div className="border rounded-lg p-4 bg-muted/30 flex items-center gap-3 opacity-50">
          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
          <div>
            <div className="font-medium text-muted-foreground">Outros gateways</div>
            <div className="text-xs text-muted-foreground">Em breve</div>
          </div>
        </div>
      )}
    </RadioGroup>
  );
}

// ============================================
// SUB-COMPONENTES
// ============================================

interface GatewayOptionProps {
  gateway: PaymentGateway;
  paymentMethod: PaymentMethod;
  isSelected: boolean;
  isConfigured: boolean;
  viaSecrets?: boolean;
}

function GatewayOption({ gateway, paymentMethod, isSelected, isConfigured, viaSecrets }: GatewayOptionProps) {
  const fees = gateway.fees[paymentMethod];
  const feesText = fees ? formatGatewayFees(fees) : 'Sem taxas';
  
  // ID único combinando método de pagamento + gateway para evitar conflitos
  const uniqueId = `gateway-${paymentMethod}-${gateway.id}`;
  
  // Verificar se gateway requer credenciais
  // Se viaSecrets = true (Owner), nunca desabilitar
  const requiresCredentials = gateway.requiresCredentials ?? true;
  const isDisabled = requiresCredentials && !isConfigured && !viaSecrets;

  return (
    <Label
      htmlFor={uniqueId}
      className={cn(
        "border rounded-lg p-4 flex items-center gap-3 transition-all",
        isDisabled
          ? "opacity-50 cursor-not-allowed bg-muted/30"
          : "cursor-pointer",
        !isDisabled && isSelected ? "ring-2 ring-primary bg-primary/5" : "",
        !isDisabled && !isSelected ? "hover:bg-muted/50" : ""
      )}
    >
      <RadioGroupItem id={uniqueId} value={gateway.id} disabled={isDisabled} />
      <div className="flex-1">
        <div className="font-medium">{gateway.displayName}</div>
        <div className="text-xs text-muted-foreground">{feesText}</div>
        {gateway.description && (
          <div className="text-xs text-muted-foreground mt-1 opacity-75">
            {gateway.description}
          </div>
        )}
        {isDisabled && (
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Configure na página Financeiro
          </div>
        )}
      </div>
      {gateway.status === 'beta' && (
        <span className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded">
          Beta
        </span>
      )}
    </Label>
  );
}

interface GatewayComingSoonOptionProps {
  gateway: PaymentGateway;
  paymentMethod: PaymentMethod;
}

function GatewayComingSoonOption({ gateway, paymentMethod }: GatewayComingSoonOptionProps) {
  const fees = gateway.fees[paymentMethod];
  const feesText = fees ? formatGatewayFees(fees) : 'Sem taxas';

  return (
    <div className="border rounded-lg p-4 bg-muted/30 flex items-center gap-3 opacity-50 cursor-not-allowed">
      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
      <div className="flex-1">
        <div className="font-medium text-muted-foreground">{gateway.displayName}</div>
        <div className="text-xs text-muted-foreground">{feesText}</div>
        <div className="text-xs text-muted-foreground mt-1">Em breve</div>
      </div>
    </div>
  );
}

// ============================================
// GATEWAY "EM BREVE" POR ROLE
// ============================================

interface GatewayRoleComingSoonOptionProps {
  gateway: PaymentGateway;
  paymentMethod: PaymentMethod;
}

function GatewayRoleComingSoonOption({ gateway, paymentMethod }: GatewayRoleComingSoonOptionProps) {
  const fees = gateway.fees[paymentMethod];
  const feesText = fees ? formatGatewayFees(fees) : 'Sem taxas';

  return (
    <div className="border rounded-lg p-4 bg-muted/30 flex items-center gap-3 opacity-50 cursor-not-allowed">
      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
      <div className="flex-1">
        <div className="font-medium text-muted-foreground">{gateway.displayName}</div>
        <div className="text-xs text-muted-foreground">{feesText}</div>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Em Breve</span>
      </div>
    </div>
  );
}
