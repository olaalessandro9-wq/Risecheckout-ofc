/**
 * TokenInput - API Token field with existing token state
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUTMifyContext } from "../context";

export function TokenInput() {
  const { token, hasExistingToken, updateToken } = useUTMifyContext();

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
      />
      {hasExistingToken && (
        <p className="text-xs text-muted-foreground">
          Token já salvo de forma segura. Deixe em branco para manter o atual 
          ou digite um novo para substituir.
        </p>
      )}
    </div>
  );
}
