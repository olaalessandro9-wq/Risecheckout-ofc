/**
 * TokenInput - API Token field with validation for exactly 36 characters
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUTMifyContext } from "../context";
import { UTMIFY_TOKEN_LENGTH } from "../constants";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function TokenInput() {
  const { token, hasExistingToken, updateToken } = useUTMifyContext();

  // Validação: token vazio é OK (usa existente), ou deve ter exatamente 36 chars
  const isTokenEmpty = token.length === 0;
  const isValidLength = token.length === UTMIFY_TOKEN_LENGTH;
  const showError = !isTokenEmpty && !isValidLength;
  const showSuccess = !isTokenEmpty && isValidLength;

  return (
    <div className="space-y-2">
      <Label htmlFor="utmify-token">
        API Token{" "}
        {hasExistingToken && (
          <span className="text-muted-foreground">(já configurado)</span>
        )}
      </Label>
      <Input
        id="utmify-token"
        type="password"
        placeholder={
          hasExistingToken 
            ? "••••••••••••••••" 
            : "Cole seu token da API da UTMify"
        }
        value={token}
        onChange={(e) => updateToken(e.target.value)}
        className={cn(
          showError && "border-destructive focus-visible:ring-destructive",
          showSuccess && "border-emerald-500 focus-visible:ring-emerald-500"
        )}
      />
      
      {/* Contador de caracteres e status */}
      <div className="flex items-center justify-between text-xs">
        <div className={cn(
          "flex items-center gap-1",
          showError && "text-destructive",
          showSuccess && "text-emerald-600",
          isTokenEmpty && "text-muted-foreground"
        )}>
          {showError && <XCircle className="h-3 w-3" />}
          {showSuccess && <CheckCircle2 className="h-3 w-3" />}
          <span>
            {token.length}/{UTMIFY_TOKEN_LENGTH} caracteres
          </span>
        </div>
        
        {showError && (
          <span className="text-destructive">
            Token deve ter exatamente {UTMIFY_TOKEN_LENGTH} caracteres
          </span>
        )}
      </div>

      {hasExistingToken && isTokenEmpty && (
        <p className="text-xs text-muted-foreground">
          Token já salvo de forma segura. Deixe em branco para manter o atual 
          ou digite um novo para substituir.
        </p>
      )}
    </div>
  );
}
