/**
 * SetupAlreadyLoggedCorrect - Estado de usuário já logado com email correto
 */

import { Loader2, CheckCircle } from "lucide-react";

interface SetupAlreadyLoggedCorrectProps {
  isGrantingAccess: boolean;
}

export function SetupAlreadyLoggedCorrect({ isGrantingAccess }: SetupAlreadyLoggedCorrectProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {isGrantingAccess ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Liberando seu acesso...</p>
          </>
        ) : (
          <>
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <p className="text-lg font-medium">Acesso liberado!</p>
            <p className="text-muted-foreground">Redirecionando...</p>
          </>
        )}
      </div>
    </div>
  );
}
