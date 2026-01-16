/**
 * SetupNeedsLogin - Estado de usuário que precisa fazer login
 */

import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TokenInfo } from "../types";

interface SetupNeedsLoginProps {
  tokenInfo: TokenInfo | null;
  onRedirectToLogin: () => void;
}

export function SetupNeedsLogin({ tokenInfo, onRedirectToLogin }: SetupNeedsLoginProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Faça Login para Acessar</CardTitle>
          <CardDescription>
            Você já possui uma conta! Faça login para acessar <strong>{tokenInfo?.product_name}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Product preview */}
          {tokenInfo?.product_image && (
            <div className="mb-3 rounded-lg overflow-hidden border">
              <img
                src={tokenInfo.product_image}
                alt={tokenInfo.product_name}
                className="w-full h-24 object-cover"
              />
            </div>
          )}
          
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Seu email:</p>
            <p className="font-medium">{tokenInfo?.buyer_email}</p>
          </div>
          
          <Button onClick={onRedirectToLogin} className="w-full mt-2">
            <LogIn className="h-4 w-4 mr-2" />
            Ir para Login
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Após o login, você será redirecionado automaticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
