/**
 * EditContentDialog - Dialog para editar conteúdo existente
 */

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { contentTypeOptions } from "../../constants";
import type { EditingContent } from "../../types";

interface EditContentDialogProps {
  content: EditingContent | null;
  onContentChange: (content: EditingContent | null) => void;
  onSubmit: () => void;
  isSaving: boolean;
}

export function EditContentDialog({
  content,
  onContentChange,
  onSubmit,
  isSaving,
}: EditContentDialogProps) {
  return (
    <Dialog open={!!content} onOpenChange={(open) => !open && onContentChange(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Conteúdo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select 
              value={content?.content_type || "video"} 
              onValueChange={(value) => onContentChange(content ? { ...content, content_type: value } : null)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contentTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={content?.title || ""}
              onChange={(e) => onContentChange(content ? { ...content, title: e.target.value } : null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={content?.description || ""}
              onChange={(e) => onContentChange(content ? { ...content, description: e.target.value } : null)}
            />
          </div>
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              value={content?.content_url || ""}
              onChange={(e) => onContentChange(content ? { ...content, content_url: e.target.value } : null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onContentChange(null)}>
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
