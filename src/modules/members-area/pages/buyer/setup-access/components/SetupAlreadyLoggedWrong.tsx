/**
 * SetupAlreadyLoggedWrong - Estado de usuário logado com email diferente
 */

import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LoggedBuyer, TokenInfo } from "../types";

interface SetupAlreadyLoggedWrongProps {
  loggedBuyer: LoggedBuyer | null;
  tokenInfo: TokenInfo | null;
  onLogoutAndContinue: () => void;
  onNavigateToDashboard: () => void;
}

export function SetupAlreadyLoggedWrong({
  loggedBuyer,
  tokenInfo,
  onLogoutAndContinue,
  onNavigateToDashboard,
}: SetupAlreadyLoggedWrongProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <UserX className="h-6 w-6 text-amber-500" />
          </div>
          <CardTitle>Conta Diferente</CardTitle>
          <CardDescription>
            Você está logado como <strong>{loggedBuyer?.email}</strong>, 
            mas este convite é para <strong>{tokenInfo?.buyer_email}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={onLogoutAndContinue} className="w-full">
            Sair e Continuar com {tokenInfo?.buyer_email?.split("@")[0]}
          </Button>
          <Button 
            variant="outline" 
            onClick={onNavigateToDashboard} 
            className="w-full"
          >
            Continuar com {loggedBuyer?.email?.split("@")[0]}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Ao trocar de conta, você sairá da conta atual.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
