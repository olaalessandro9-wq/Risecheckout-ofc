/**
 * Advantage Editor - Editor de Componente Vantagem
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EditorComponentProps, AdvantageContent } from "../types";

export function AdvantageEditor({ content, handleChange }: EditorComponentProps<AdvantageContent>) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Título</Label>
        <Input 
          value={content?.title || ""} 
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Título da vantagem"
        />
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input 
          value={content?.description || ""} 
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Descrição da vantagem"
        />
      </div>
      <div className="space-y-2">
        <Label>Ícone</Label>
        <Select 
          value={content?.icon || "check"}
          onValueChange={(value) => handleChange("icon", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="check">Check</SelectItem>
            <SelectItem value="star">Estrela</SelectItem>
            <SelectItem value="heart">Coração</SelectItem>
            <SelectItem value="shield">Escudo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Cor Principal</Label>
        <div className="flex gap-2">
          <input 
            type="color" 
            className="w-12 h-10 rounded cursor-pointer" 
            value={content?.primaryColor || "#10B981"} 
            onChange={(e) => handleChange("primaryColor", e.target.value)} 
          />
          <Input 
            value={content?.primaryColor || "#10B981"} 
            onChange={(e) => handleChange("primaryColor", e.target.value)}
            placeholder="#10B981"
          />
        </div>
      </div>
    </div>
  );
}
