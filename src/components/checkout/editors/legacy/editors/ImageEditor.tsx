/**
 * Image Editor - Editor de Componente Imagem
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EditorComponentProps, ImageContent } from "../types";

export function ImageEditor({ 
  content, 
  handleChange, 
  handleImageUpload 
}: EditorComponentProps<ImageContent>) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Upload de Imagem</Label>
        <Input 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload} 
          disabled={content?._uploading} 
        />
        {content?._uploading && (
          <p className="text-xs text-muted-foreground">Enviando...</p>
        )}
        {content?._uploadError && (
          <p className="text-xs text-destructive">Erro ao enviar imagem</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>URL (Opcional)</Label>
        <Input 
          value={content?.imageUrl || ""} 
          onChange={(e) => handleChange("imageUrl", e.target.value)} 
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label>Alinhamento</Label>
        <Select 
          value={content?.alignment || "center"}
          onValueChange={(value) => handleChange("alignment", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Esquerda</SelectItem>
            <SelectItem value="center">Centro</SelectItem>
            <SelectItem value="right">Direita</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
