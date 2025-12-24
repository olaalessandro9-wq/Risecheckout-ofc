/**
 * RulesList - Lista de Regras e Benefícios
 * 
 * Componente que exibe regras e benefícios para afiliados
 * Inspirado em Kirvano
 */

import { Check } from "lucide-react";

interface RulesListProps {
  rules: string | null;
}

export function RulesList({ rules }: RulesListProps) {
  if (!rules || rules.trim() === "") {
    return null;
  }

  // Parse rules (separado por quebra de linha)
  const rulesList = rules
    .split("\n")
    .map((r) => r.trim())
    .filter((r) => r.length > 0);

  if (rulesList.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">Regras e Benefícios</h3>
      <div className="p-4 rounded-lg border bg-card/50 space-y-2">
        {rulesList.map((rule, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0">
              <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{rule}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
