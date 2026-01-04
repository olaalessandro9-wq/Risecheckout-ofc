/**
 * EditModuleDialog - Dialog para editar módulo existente
 */

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EditingModule } from "../../types";

interface EditModuleDialogProps {
  module: EditingModule | null;
  onModuleChange: (module: EditingModule | null) => void;
  onSubmit: () => void;
  isSaving: boolean;
}

export function EditModuleDialog({
  module,
  onModuleChange,
  onSubmit,
  isSaving,
}: EditModuleDialogProps) {
  return (
    <Dialog open={!!module} onOpenChange={(open) => !open && onModuleChange(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Módulo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={module?.title || ""}
              onChange={(e) => onModuleChange(module ? { ...module, title: e.target.value } : null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={module?.description || ""}
              onChange={(e) => onModuleChange(module ? { ...module, description: e.target.value } : null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onModuleChange(null)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isSaving}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
