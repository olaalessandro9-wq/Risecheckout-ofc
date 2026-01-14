/**
 * Text Editor - Editor de Componente Texto
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EditorComponentProps, TextContent } from "../types";

export function TextEditor({ content, handleChange }: EditorComponentProps<TextContent>) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Texto</Label>
        <Input 
          value={content?.text || ""} 
          onChange={(e) => handleChange("text", e.target.value)}
          placeholder="Digite o texto"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tamanho (px)</Label>
          <Input 
            type="number" 
            value={content?.fontSize || 16} 
            onChange={(e) => handleChange("fontSize", parseInt(e.target.value))}
            min={12}
            max={48}
          />
        </div>
        <div className="space-y-2">
          <Label>Cor</Label>
          <div className="flex gap-2">
            <input 
              type="color" 
              className="w-12 h-10 rounded cursor-pointer" 
              value={content?.color || "#000000"} 
              onChange={(e) => handleChange("color", e.target.value)} 
            />
            <Input 
              value={content?.color || "#000000"} 
              onChange={(e) => handleChange("color", e.target.value)}
              placeholder="#000000"
            />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Cor do Fundo</Label>
        <div className="flex gap-2">
          <input 
            type="color" 
            className="w-12 h-10 rounded cursor-pointer" 
            value={content?.backgroundColor || "#FFFFFF"} 
            onChange={(e) => handleChange("backgroundColor", e.target.value)} 
          />
          <Input 
            value={content?.backgroundColor || "#FFFFFF"} 
            onChange={(e) => handleChange("backgroundColor", e.target.value)}
            placeholder="#FFFFFF"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Cor da Borda</Label>
        <div className="flex gap-2">
          <input 
            type="color" 
            className="w-12 h-10 rounded cursor-pointer" 
            value={content?.borderColor || "#E5E7EB"} 
            onChange={(e) => handleChange("borderColor", e.target.value)} 
          />
          <Input 
            value={content?.borderColor || "#E5E7EB"} 
            onChange={(e) => handleChange("borderColor", e.target.value)}
            placeholder="#E5E7EB"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Alinhamento</Label>
        <Select 
          value={content?.alignment || "left"}
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
