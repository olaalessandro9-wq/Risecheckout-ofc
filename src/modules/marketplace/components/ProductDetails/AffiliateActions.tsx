/**
 * AffiliateActions - Ações para Afiliados
 * 
 * Responsabilidade única: Botões de ação baseados no status de afiliação
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Loader2 } from "lucide-react";

interface AffiliationStatus {
  isAffiliate: boolean;
  status?: "pending" | "active" | "rejected" | "blocked";
  affiliationId?: string;
}

interface AffiliateActionsProps {
  affiliationStatus: AffiliationStatus | null;
  cacheLoaded: boolean;
  isLoading: boolean;
  requiresManualApproval: boolean | null;
  onRequest: () => void;
  onClose: () => void;
}

export function AffiliateActions({
  affiliationStatus,
  cacheLoaded,
  isLoading,
  requiresManualApproval,
  onRequest,
  onClose,
}: AffiliateActionsProps) {
  const navigate = useNavigate();

  // Loading state
  if (!cacheLoaded || (isLoading && !affiliationStatus)) {
    return (
      <Button disabled className="w-full h-12 text-base font-semibold">
        <Loader2 className="w-5 h-5 animate-spin" />
      </Button>
    );
  }

  // Active affiliate
  if (affiliationStatus?.status === "active" && affiliationStatus.affiliationId) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm text-muted-foreground">Afiliação aprovada</div>
        <Button
          onClick={() => {
            onClose();
            setTimeout(() => {
              navigate(`/dashboard/minhas-afiliacoes/${affiliationStatus.affiliationId}`);
            }, 0);
          }}
          className="w-full h-12 text-base font-semibold gap-2"
        >
          Ver afiliação
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Pending approval
  if (affiliationStatus?.status === "pending") {
    return (
      <Button
        disabled
        className="w-full h-12 text-base font-semibold gap-2 bg-amber-600"
      >
        <Clock className="w-5 h-5" />
        Aguardando aprovação
      </Button>
    );
  }

  // Rejected
  if (affiliationStatus?.status === "rejected") {
    return (
      <Button
        disabled
        variant="destructive"
        className="w-full h-12 text-base font-semibold"
      >
        Solicitação rejeitada
      </Button>
    );
  }

  // Default: Request affiliation button
  const buttonText = requiresManualApproval
    ? "Solicitar afiliação"
    : "Se afiliar e acessar";

  return (
    <Button
      onClick={onRequest}
      disabled={isLoading}
      className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 gap-2"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {buttonText}
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </Button>
  );
}
