/**
 * ContentEditorHeader - Header with back button and action buttons
 */

import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Save } from "lucide-react";

interface ContentEditorHeaderProps {
  isNew: boolean;
  isSaving: boolean;
  canSave: boolean;
  onBack: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function ContentEditorHeader({
  isNew,
  isSaving,
  canSave,
  onBack,
  onCancel,
  onSave,
}: ContentEditorHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Módulos
          </Button>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-lg font-semibold">
            {isNew ? "Novo Conteúdo" : "Editar Conteúdo"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || !canSave}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Conteúdo
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
