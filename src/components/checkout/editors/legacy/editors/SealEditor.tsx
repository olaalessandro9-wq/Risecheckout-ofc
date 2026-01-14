/**
 * Seal Editor - Editor de Componente Selo
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EditorComponentProps, SealContent } from "../types";

export function SealEditor({ content, handleChange }: EditorComponentProps<SealContent>) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Texto Superior</Label>
        <Input 
          value={content?.topText || ""} 
          onChange={(e) => handleChange("topText", e.target.value)}
          placeholder="Ex: Garantia"
        />
      </div>
      <div className="space-y-2">
        <Label>Título</Label>
        <Input 
          value={content?.title || ""} 
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Ex: 7 dias"
        />
      </div>
      <div className="space-y-2">
        <Label>Subtítulo</Label>
        <Input 
          value={content?.subtitle || ""} 
          onChange={(e) => handleChange("subtitle", e.target.value)}
          placeholder="Ex: Satisfação garantida"
        />
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
