/**
 * GatewaySelector - Seleção de Gateway com design compacto e elegante
 * 
 * Cards clicáveis minimalistas com:
 * - Nome do gateway centralizado
 * - Check icon discreto quando selecionado
 * - CredentialDot com tooltip para status de credencial
 * - Badge "Em Breve" para gateways indisponíveis
 * - Grid responsivo: 3 colunas desktop, 2 tablet, 1 mobile
 */

import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getActiveGatewaysByMethod,
  getGatewaysByMethod,
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

  const activeGateways = getActiveGatewaysByMethod(paymentMethod);

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

  const comingSoonGateways = showComingSoon
    ? getGatewaysByMethod(paymentMethod).filter((g) => g.status === "coming_soon")
    : [];

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
    <TooltipProvider delayDuration={200}>
      <div
        role="radiogroup"
        aria-label={`Selecionar gateway de ${paymentMethod}`}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        {availableGateways.map((gateway) => (
          <GatewayCard
            key={gateway.id}
            gateway={gateway}
            isSelected={value === gateway.id}
            onSelect={() => onChange(gateway.id)}
            credentialStatus={getCredentialStatus(gateway, credentials)}
          />
        ))}

        {comingSoonForRoleGateways.map((gateway) => (
          <GatewayCardComingSoon
            key={gateway.id}
            gateway={gateway}
          />
        ))}

        {comingSoonGateways.map((gateway) => (
          <GatewayCardComingSoon
            key={gateway.id}
            gateway={gateway}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}

// ============================================
// CREDENTIAL STATUS LOGIC
// ============================================

type CredentialStatus = "configured" | "via-secrets" | "pending" | "none";

function getCredentialStatus(
  gateway: PaymentGateway,
  credentials: Record<string, { configured: boolean; viaSecrets?: boolean }>
): CredentialStatus {
  const requiresCredentials = gateway.requiresCredentials ?? true;
  if (!requiresCredentials) return "none";

  const cred = credentials[gateway.id];
  if (!cred) return "pending";
  if (cred.viaSecrets) return "via-secrets";
  if (cred.configured) return "configured";
  return "pending";
}

// ============================================
// CREDENTIAL DOT
// ============================================

const dotConfig: Record<Exclude<CredentialStatus, "none">, { color: string; label: string }> = {
  configured: {
    color: "bg-emerald-500",
    label: "Credenciais configuradas",
  },
  "via-secrets": {
    color: "bg-blue-500",
    label: "Integrado via Secrets",
  },
  pending: {
    color: "bg-amber-500",
    label: "Configurar no Financeiro",
  },
};

interface CredentialDotProps {
  status: CredentialStatus;
}

function CredentialDot({ status }: CredentialDotProps) {
  if (status === "none") return null;

  const config = dotConfig[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-block w-2 h-2 rounded-full shrink-0",
            config.color
          )}
          aria-label={config.label}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {config.label}
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================
// GATEWAY CARD (ACTIVE)
// ============================================

interface GatewayCardProps {
  gateway: PaymentGateway;
  isSelected: boolean;
  onSelect: () => void;
  credentialStatus: CredentialStatus;
}

function GatewayCard({ gateway, isSelected, onSelect, credentialStatus }: GatewayCardProps) {
  const isDisabled = credentialStatus === "pending";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={gateway.displayName}
      disabled={isDisabled}
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1",
        "rounded-lg border px-4 py-5 transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDisabled && "opacity-50 cursor-not-allowed bg-muted/30",
        !isDisabled && isSelected && "border-primary bg-primary/5 shadow-sm",
        !isDisabled && !isSelected && "hover:border-primary/50 hover:shadow-sm",
      )}
    >
      {/* Credential Dot - top right */}
      <span className="absolute top-2.5 right-2.5">
        <CredentialDot status={credentialStatus} />
      </span>

      {/* Gateway Name */}
      <span className="text-sm font-medium text-foreground">
        {gateway.displayName}
      </span>

      {/* Beta badge */}
      {gateway.status === "beta" && (
        <span className="text-[10px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full leading-none">
          Beta
        </span>
      )}

      {/* Check icon - bottom right */}
      {isSelected && (
        <span className="absolute bottom-2 right-2.5">
          <Check className="h-3.5 w-3.5 text-primary" />
        </span>
      )}
    </button>
  );
}

// ============================================
// GATEWAY CARD (COMING SOON)
// ============================================

interface GatewayCardComingSoonProps {
  gateway: PaymentGateway;
}

function GatewayCardComingSoon({ gateway }: GatewayCardComingSoonProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-1",
        "rounded-lg border px-4 py-5",
        "opacity-40 cursor-not-allowed bg-muted/20"
      )}
    >
      {/* Gateway Name */}
      <span className="text-sm font-medium text-muted-foreground">
        {gateway.displayName}
      </span>

      {/* Coming Soon Badge */}
      <div className="flex items-center gap-1 mt-0.5">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground">
          Em Breve
        </span>
      </div>
    </div>
  );
}
