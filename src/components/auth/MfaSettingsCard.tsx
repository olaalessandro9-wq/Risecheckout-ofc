/**
 * MFA Settings Card
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Card displayed on the profile page for managing MFA.
 * Visible only for admin/owner roles.
 * 
 * @module components/auth/MfaSettingsCard
 * @version 1.0.0
 */

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck, ShieldOff, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { getMfaStatus, mfaDisable } from "@/services/mfaService";
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
  const { activeRole, mfaSetupRequired, invalidate: invalidateAuth } = useUnifiedAuth();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [isDisabling, setIsDisabling] = useState(false);
  
  /** Whether MFA is mandatory for this user's role (cannot be disabled) */
  const isMfaMandatory = activeRole === "admin" || activeRole === "owner";

  const { data: mfaStatus, isLoading } = useQuery({
    queryKey: MFA_STATUS_QUERY_KEY,
    queryFn: getMfaStatus,
  });

  const handleSetupComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: MFA_STATUS_QUERY_KEY });
    // RISE V3: Re-validate session so mfa_setup_required flag is cleared
    invalidateAuth();
    toast.success("Autenticação de dois fatores ativada!");
  }, [queryClient, invalidateAuth]);

  const handleDisable = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!disablePassword || !disableCode) {
        toast.error("Preencha todos os campos");
        return;
      }

      setIsDisabling(true);

      try {
        await mfaDisable(disablePassword, disableCode);
        toast.success("MFA desativado com sucesso");
        setShowDisableDialog(false);
        setDisablePassword("");
        setDisableCode("");
        queryClient.invalidateQueries({ queryKey: MFA_STATUS_QUERY_KEY });
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : "Erro ao desativar MFA";
        toast.error(msg);
      } finally {
        setIsDisabling(false);
      }
    },
    [disablePassword, disableCode, queryClient]
  );

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
              <Badge variant="default">
                Ativo
              </Badge>
            ) : (
              <Badge variant="secondary">Desativado</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* RISE V3: Mandatory enforcement banner for admin/owner without MFA */}
          {isMfaMandatory && mfaSetupRequired && (
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
            <>
              <p className="text-sm text-muted-foreground">
                Sua conta está protegida com autenticação de dois fatores. Um
                código do seu aplicativo autenticador será solicitado ao fazer
                login.
              </p>
              {isMfaMandatory ? (
                <p className="text-sm font-medium text-muted-foreground">
                  MFA é obrigatório para administradores e não pode ser desativado.
                </p>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => setShowDisableDialog(true)}
                >
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Desativar MFA
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {isMfaMandatory
                  ? "A autenticação de dois fatores é obrigatória para sua conta. Configure agora usando um aplicativo autenticador (Google Authenticator, Authy, etc.)."
                  : "Proteja sua conta com autenticação de dois fatores. Ao ativar, você precisará de um código do seu aplicativo autenticador (Google Authenticator, Authy, etc.) além da senha ao fazer login."}
              </p>
              <Button onClick={() => setShowSetupWizard(true)}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Ativar Autenticação de Dois Fatores
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup Wizard */}
      <MfaSetupWizard
        open={showSetupWizard}
        onOpenChange={setShowSetupWizard}
        onComplete={handleSetupComplete}
      />

      {/* Disable Confirmation Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-destructive" />
              Desativar MFA
            </DialogTitle>
            <DialogDescription>
              Para desativar a autenticação de dois fatores, confirme sua
              identidade com sua senha e o código atual do aplicativo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDisable} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">Senha</Label>
              <Input
                id="disable-password"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Sua senha atual"
                disabled={isDisabling}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disable-code">Código TOTP</Label>
              <Input
                id="disable-code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                disabled={isDisabling}
                className="font-mono text-center tracking-widest"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowDisableDialog(false)}
                disabled={isDisabling}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="flex-1"
                disabled={isDisabling || !disablePassword || !disableCode}
              >
                {isDisabling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Desativando...
                  </>
                ) : (
                  "Confirmar Desativação"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
