/**
 * ValidateCredentialsButton - UTMify Credential Validation
 * 
 * Calls utmify-validate-credentials Edge Function and displays
 * detailed diagnostic results in a modal dialog.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 */

import { useState } from "react";
import { ShieldCheck, ShieldX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useUTMifyContext } from "../context";
import { toast } from "@/hooks/use-toast";

// ============================================================================
// TYPES
// ============================================================================

interface ValidateResponse {
  valid: boolean;
  message: string;
  details: {
    fingerprint: string | null;
    tokenLength: number;
    normalizationApplied: boolean;
    normalizationChanges: string[];
    apiTest: {
      performed: boolean;
      statusCode?: number;
      response?: string;
    };
    configStatus: {
      hasToken: boolean;
      eventsEnabled: string[];
    };
  };
}

type ValidationState = "idle" | "loading" | "success" | "error";

// ============================================================================
// COMPONENT
// ============================================================================

export function ValidateCredentialsButton() {
  const { user } = useUnifiedAuth();
  const { hasExistingToken } = useUTMifyContext();
  const { canAccessAdminPanel } = usePermissions();
  
  const [state, setState] = useState<ValidationState>("idle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [result, setResult] = useState<ValidateResponse | null>(null);

  const handleValidate = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setState("loading");

    const { data, error } = await api.call<ValidateResponse>(
      "utmify-validate-credentials",
      { vendorId: user.id }
    );

    if (error || !data) {
      setState("error");
      toast({
        title: "Erro na validação",
        description: error?.message || "Não foi possível validar as credenciais",
        variant: "destructive",
      });
      return;
    }

    setResult(data);
    setState(data.valid ? "success" : "error");
    setDialogOpen(true);
  };

  // Only show for admin/owner with existing token (debug tool)
  if (!hasExistingToken || !canAccessAdminPanel) {
    return null;
  }

  const isValid = result?.valid ?? false;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleValidate}
        disabled={state === "loading"}
        className="w-full"
      >
        {state === "loading" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="mr-2 h-4 w-4" />
        )}
        Validar Credenciais
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {isValid ? (
                <ShieldCheck className="h-6 w-6 text-primary" />
              ) : (
                <ShieldX className="h-6 w-6 text-destructive" />
              )}
              <div>
                <DialogTitle>
                  {isValid ? "Credenciais Válidas" : "Credenciais Inválidas"}
                </DialogTitle>
                <DialogDescription>
                  {result?.message}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {result?.details && (
            <div className="space-y-4 mt-4">
              {/* Token Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Token</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Fingerprint:</span>
                  <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {result.details.fingerprint || "N/A"}
                  </code>
                  
                  <span className="text-muted-foreground">Tamanho:</span>
                  <span>{result.details.tokenLength} caracteres</span>
                  
                  <span className="text-muted-foreground">Normalizado:</span>
                  <span>
                    {result.details.normalizationApplied ? "Sim" : "Não"}
                  </span>
                </div>
                
                {result.details.normalizationChanges.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">
                      Correções aplicadas:
                    </span>
                    <ul className="list-disc list-inside text-xs text-muted-foreground mt-1">
                      {result.details.normalizationChanges.map((change, i) => (
                        <li key={i}>{change}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <Separator />

              {/* API Test Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Teste de API</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Executado:</span>
                  <span>
                    {result.details.apiTest.performed ? "Sim" : "Não"}
                  </span>
                  
                  {result.details.apiTest.performed && (
                    <>
                      <span className="text-muted-foreground">Status HTTP:</span>
                      <Badge 
                        variant={result.details.apiTest.statusCode === 200 ? "default" : "destructive"}
                      >
                        {result.details.apiTest.statusCode}
                      </Badge>
                    </>
                  )}
                </div>
                
                {result.details.apiTest.response && (
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">
                      Resposta:
                    </span>
                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-24">
                      {result.details.apiTest.response.substring(0, 200)}
                      {result.details.apiTest.response.length > 200 && "..."}
                    </pre>
                  </div>
                )}
              </div>

              <Separator />

              {/* Config Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Configuração</h4>
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">
                    Eventos habilitados:
                  </span>
                  {result.details.configStatus.eventsEnabled.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.details.configStatus.eventsEnabled.map((event) => (
                        <Badge key={event} variant="secondary" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Nenhum evento habilitado
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
