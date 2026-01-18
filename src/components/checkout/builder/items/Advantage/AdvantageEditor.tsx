/**
 * Advantage Editor - Editor moderno de Vantagem
 * 
 * RISE V3: Substitui o editor legado
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ComponentData } from "../../types";
import type { AdvantageContent } from "./index";

interface AdvantageEditorProps {
  component: ComponentData;
  onChange: (newContent: Partial<AdvantageContent>) => void;
}

export function AdvantageEditor({ component, onChange }: AdvantageEditorProps) {
  const content = component.content as AdvantageContent | undefined;
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Título</Label>
        <Input 
          value={content?.title || ""} 
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Título da vantagem"
        />
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input 
          value={content?.description || ""} 
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Descrição da vantagem"
        />
      </div>
      <div className="space-y-2">
        <Label>Ícone</Label>
        <Select 
          value={content?.icon || "check"}
          onValueChange={(value) => onChange({ icon: value })}
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
            value={content?.primaryColor || "#1DB88E"} 
            onChange={(e) => onChange({ primaryColor: e.target.value })} 
          />
          <Input 
            value={content?.primaryColor || "#1DB88E"} 
            onChange={(e) => onChange({ primaryColor: e.target.value })}
            placeholder="#1DB88E"
          />
        </div>
      </div>
    </div>
  );
}
