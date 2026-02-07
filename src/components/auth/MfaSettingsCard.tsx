/**
 * MFA Settings Card
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Card displayed on the profile page for managing MFA.
 * Visible only for admin/owner roles, for whom MFA is always mandatory.
 * There is no option to disable MFA — it is enforced at both
 * frontend (no UI) and backend (403 guard) levels.
 * 
 * @module components/auth/MfaSettingsCard
 * @version 2.0.0
 */

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { getMfaStatus } from "@/services/mfaService";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { MfaSetupWizard } from "./MfaSetupWizard";

// ============================================================================
// CONSTANTS
// ============================================================================

const MFA_STATUS_QUERY_KEY = ["mfa-status"] as const;

// ============================================================================
// COMPONENT
// ============================================================================

export function MfaSettingsCard() {
  const queryClient = useQueryClient();
  const { mfaSetupRequired, invalidate: invalidateAuth } = useUnifiedAuth();
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  const { data: mfaStatus, isLoading } = useQuery({
    queryKey: MFA_STATUS_QUERY_KEY,
    queryFn: getMfaStatus,
  });

  const handleSetupComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: MFA_STATUS_QUERY_KEY });
    invalidateAuth();
    toast.success("Autenticação de dois fatores ativada!");
  }, [queryClient, invalidateAuth]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isMfaEnabled = mfaStatus?.mfaEnabled ?? false;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Autenticação de Dois Fatores (MFA)
            </span>
            {isMfaEnabled ? (
              <Badge variant="default">Ativo</Badge>
            ) : (
              <Badge variant="secondary">Pendente</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mfaSetupRequired && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                <strong>Configuração obrigatória:</strong> Para garantir a segurança da sua conta,
                você precisa ativar a autenticação de dois fatores (MFA) antes de acessar outras
                funcionalidades da plataforma.
              </AlertDescription>
            </Alert>
          )}

          {isMfaEnabled ? (
            <p className="text-sm text-muted-foreground">
              Sua conta está protegida com autenticação de dois fatores. Um
              código do seu aplicativo autenticador será solicitado ao fazer
              login. MFA é obrigatório para administradores e não pode ser desativado.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                A autenticação de dois fatores é obrigatória para sua conta.
                Configure agora usando um aplicativo autenticador (Google
                Authenticator, Authy, etc.).
              </p>
              <Button onClick={() => setShowSetupWizard(true)}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Ativar Autenticação de Dois Fatores
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <MfaSetupWizard
        open={showSetupWizard}
        onOpenChange={setShowSetupWizard}
        onComplete={handleSetupComplete}
      />
    </>
  );
}
