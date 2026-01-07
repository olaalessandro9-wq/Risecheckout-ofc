/**
 * ContentDescription - Section for content description/body
 */

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ContentType } from "../../types";

interface ContentDescriptionProps {
  contentType: ContentType;
  description: string | null;
  body: string | null;
  onDescriptionChange: (value: string) => void;
  onBodyChange: (value: string) => void;
}

export function ContentDescription({
  contentType,
  description,
  body,
  onDescriptionChange,
  onBodyChange,
}: ContentDescriptionProps) {
  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Descrição</h3>
      </div>

      {/* Description - always visible */}
      <div className="space-y-2">
        <Label htmlFor="content-description">
          Descrição <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="content-description"
          value={description || ""}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Breve descrição do conteúdo..."
          rows={3}
          className="max-w-xl resize-none"
        />
      </div>

      {/* Body - only for text type */}
      {contentType === "text" && (
        <div className="space-y-2">
          <Label htmlFor="content-body">
            Conteúdo do Texto <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="content-body"
            value={body || ""}
            onChange={(e) => onBodyChange(e.target.value)}
            placeholder="Digite o conteúdo que será exibido para o aluno..."
            rows={10}
            className="w-full resize-y font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Este texto será exibido diretamente para o aluno na área de membros.
          </p>
        </div>
      )}
    </div>
  );
}
