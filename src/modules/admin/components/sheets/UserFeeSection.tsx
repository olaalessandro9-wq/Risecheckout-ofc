/**
 * UserFeeSection - Seção de taxa personalizada
 * 
 * RISE Protocol V3 - Componente puro
 * 
 * @version 1.0.0
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Percent, RotateCcw } from "lucide-react";

interface UserFeeSectionProps {
  currentFee: number | null | undefined;
  customFeeInput: string;
  onCustomFeeChange: (value: string) => void;
  onApplyFee: () => void;
  onResetFee: () => void;
}

export function UserFeeSection({
  currentFee,
  customFeeInput,
  onCustomFeeChange,
  onApplyFee,
  onResetFee,
}: UserFeeSectionProps) {
  const displayFee =
    currentFee != null ? `${(currentFee * 100).toFixed(2)}%` : "Padrão (4%)";

  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <Percent className="h-4 w-4" />
        Taxa Personalizada
      </h3>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{displayFee}</Badge>
        {currentFee != null && (
          <span className="text-xs text-muted-foreground">(personalizada)</span>
        )}
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Ex: 2.5"
            value={customFeeInput}
            onChange={(e) => onCustomFeeChange(e.target.value)}
            className="h-9"
          />
        </div>
        <Button size="sm" onClick={onApplyFee} disabled={!customFeeInput}>
          Aplicar %
        </Button>
        {currentFee != null && (
          <Button size="sm" variant="outline" onClick={onResetFee}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
