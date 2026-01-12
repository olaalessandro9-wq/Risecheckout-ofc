/**
 * EditCommissionDialog Component
 * 
 * Modal para edição de comissão de afiliado.
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface EditCommissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customCommission: string;
  onCommissionChange: (value: string) => void;
  onSave: () => void;
  defaultRate: number;
}

export function EditCommissionDialog({
  isOpen,
  onClose,
  customCommission,
  onCommissionChange,
  onSave,
  defaultRate,
}: EditCommissionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Comissão do Afiliado</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Comissão Personalizada (%)</Label>
            <Input
              type="number"
              min="0"
              max="90"
              value={customCommission}
              onChange={(e) => onCommissionChange(e.target.value)}
              placeholder={`Padrão: ${defaultRate}%`}
            />
            <p className="text-sm text-muted-foreground">
              Máximo: 90%. Deixe vazio para usar a taxa padrão do produto ({defaultRate}%).
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
