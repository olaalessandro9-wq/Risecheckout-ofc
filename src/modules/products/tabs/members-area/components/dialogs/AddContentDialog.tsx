/**
 * AddContentDialog - Dialog para adicionar novo conteúdo
 */

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { contentTypeOptions } from "../../constants";

interface AddContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  contentType: string;
  contentUrl: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onContentTypeChange: (value: string) => void;
  onContentUrlChange: (value: string) => void;
  onSubmit: () => void;
  isSaving: boolean;
}

export function AddContentDialog({
  open,
  onOpenChange,
  title,
  description,
  contentType,
  contentUrl,
  onTitleChange,
  onDescriptionChange,
  onContentTypeChange,
  onContentUrlChange,
  onSubmit,
  isSaving,
}: AddContentDialogProps) {
  const getUrlLabel = () => {
    switch (contentType) {
      case "video": return "URL do Vídeo (YouTube, Vimeo, etc)";
      case "pdf": return "URL do PDF";
      case "link": return "URL do Link";
      case "download": return "URL do Arquivo";
      case "text": return "Conteúdo (opcional)";
      default: return "URL";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Conteúdo</DialogTitle>
          <DialogDescription>
            Adicione um novo conteúdo ao módulo
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Conteúdo</Label>
            <Select value={contentType} onValueChange={onContentTypeChange}>
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
              placeholder="Ex: Aula 1 - Boas vindas"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea
              placeholder="Descreva o conteúdo..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{getUrlLabel()}</Label>
            {contentType !== "text" ? (
              <Input
                placeholder="https://..."
                value={contentUrl}
                onChange={(e) => onContentUrlChange(e.target.value)}
              />
            ) : (
              <Textarea
                placeholder="Conteúdo em texto ou HTML..."
                value={contentUrl}
                onChange={(e) => onContentUrlChange(e.target.value)}
                rows={4}
              />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={!title.trim() || isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
