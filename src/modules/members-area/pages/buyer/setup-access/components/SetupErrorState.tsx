/**
 * SetupErrorState - Estados de erro (invalid, used, expired)
 */

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TokenStatus } from "../types";

interface SetupErrorStateProps {
  status: TokenStatus;
  errorMessage: string;
  onNavigateToLogin: () => void;
}

export function SetupErrorState({ status, errorMessage, onNavigateToLogin }: SetupErrorStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>
            {status === "used" && "Link já utilizado"}
            {status === "expired" && "Link expirado"}
            {status === "invalid" && "Link inválido"}
          </CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={onNavigateToLogin} className="w-full">
            Ir para Login
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Se você já criou sua conta, faça login normalmente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
