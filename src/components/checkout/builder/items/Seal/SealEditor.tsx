/**
 * Seal Editor - Editor moderno de Selo
 * 
 * RISE V3: Substitui o editor legado
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ComponentData } from "../../types";
import type { SealContent } from "./index";

interface SealEditorProps {
  component: ComponentData;
  onChange: (newContent: Partial<SealContent>) => void;
}

export function SealEditor({ component, onChange }: SealEditorProps) {
  const content = component.content as SealContent | undefined;
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Texto Superior</Label>
        <Input 
          value={content?.topText || ""} 
          onChange={(e) => onChange({ topText: e.target.value })}
          placeholder="Ex: Garantia"
        />
      </div>
      <div className="space-y-2">
        <Label>Título</Label>
        <Input 
          value={content?.title || ""} 
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Ex: 7 dias"
        />
      </div>
      <div className="space-y-2">
        <Label>Subtítulo</Label>
        <Input 
          value={content?.subtitle || ""} 
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Ex: Satisfação garantida"
        />
      </div>
      <div className="space-y-2">
        <Label>Cor Principal</Label>
        <div className="flex gap-2">
          <input 
            type="color" 
            className="w-12 h-10 rounded cursor-pointer" 
            value={content?.primaryColor || "#4F9EF8"} 
            onChange={(e) => onChange({ primaryColor: e.target.value })} 
          />
          <Input 
            value={content?.primaryColor || "#4F9EF8"} 
            onChange={(e) => onChange({ primaryColor: e.target.value })}
            placeholder="#4F9EF8"
          />
        </div>
      </div>
    </div>
  );
}
