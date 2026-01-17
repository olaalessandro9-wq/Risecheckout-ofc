/**
 * AffiliateProgramStatus - Seção de status do programa
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import { Switch } from "@/components/ui/switch";
import { CheckCircle2 } from "lucide-react";
import type { OnChangeHandler } from "../types";

interface AffiliateProgramStatusProps {
  enabled: boolean;
  onChange: OnChangeHandler;
}

export function AffiliateProgramStatus({ enabled, onChange }: AffiliateProgramStatusProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">Status do Programa</h3>
            {enabled ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="w-3 h-3" />
                Ativo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                Inativo
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {enabled 
              ? "Seu programa está ativo. Afiliados podem gerar vendas e receber comissões."
              : "Ative o programa para permitir que outras pessoas vendam este produto por você."}
          </p>
        </div>
        <Switch 
          id="affiliateEnabled"
          checked={enabled}
          onCheckedChange={(checked) => onChange('enabled', checked)}
          className="mt-1"
        />
      </div>
    </div>
  );
}
