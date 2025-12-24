import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ComponentData } from "../../types";

interface TextEditorProps {
  component: ComponentData;
  onChange: (newContent: any) => void;
  design?: any;
}

export const TextEditor = ({ component, onChange }: TextEditorProps) => {
  const content = component.content || {};

  const handleChange = (field: string, value: any) => {
    onChange({
      ...content,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Texto */}
      <div>
        <Label>Texto</Label>
        <Input
          value={content.text || ""}
          onChange={(e) => handleChange("text", e.target.value)}
          placeholder="Digite o texto"
        />
      </div>

      {/* Tamanho e Cor */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tamanho da Fonte</Label>
          <Input
            type="number"
            value={content.fontSize || 16}
            onChange={(e) => handleChange("fontSize", parseInt(e.target.value))}
            min={12}
            max={48}
          />
        </div>
        <div>
          <Label>Cor do Texto</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={content.color || "#000000"}
              onChange={(e) => handleChange("color", e.target.value)}
              className="w-12 h-10 rounded cursor-pointer border"
            />
            <Input
              value={content.color || "#000000"}
              onChange={(e) => handleChange("color", e.target.value)}
              placeholder="#000000"
            />
          </div>
        </div>
      </div>

      {/* Alinhamento */}
      <div>
        <Label>Alinhamento</Label>
        <div className="flex gap-2 mt-1">
          <Button
            variant={content.alignment === "left" ? "default" : "outline"}
            size="sm"
            onClick={() => handleChange("alignment", "left")}
            className="flex-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="15" y2="12"/>
              <line x1="3" y1="18" x2="18" y2="18"/>
            </svg>
          </Button>
          <Button
            variant={content.alignment === "center" || !content.alignment ? "default" : "outline"}
            size="sm"
            onClick={() => handleChange("alignment", "center")}
            className="flex-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="6" y1="12" x2="18" y2="12"/>
              <line x1="4" y1="18" x2="20" y2="18"/>
            </svg>
          </Button>
          <Button
            variant={content.alignment === "right" ? "default" : "outline"}
            size="sm"
            onClick={() => handleChange("alignment", "right")}
            className="flex-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="9" y1="12" x2="21" y2="12"/>
              <line x1="6" y1="18" x2="21" y2="18"/>
            </svg>
          </Button>
        </div>
      </div>

      {/* Cor de Fundo */}
      <div>
        <Label>Cor de Fundo</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={content.backgroundColor || "#FFFFFF"}
            onChange={(e) => handleChange("backgroundColor", e.target.value)}
            className="w-12 h-10 rounded cursor-pointer border"
          />
          <Input
            value={content.backgroundColor || "#FFFFFF"}
            onChange={(e) => handleChange("backgroundColor", e.target.value)}
            placeholder="#FFFFFF"
          />
        </div>
      </div>

      {/* Borda */}
      <div className="space-y-3">
        <div>
          <Label>Cor da Borda</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={content.borderColor || "#E5E7EB"}
              onChange={(e) => handleChange("borderColor", e.target.value)}
              className="w-12 h-10 rounded cursor-pointer border"
            />
            <Input
              value={content.borderColor || "#E5E7EB"}
              onChange={(e) => handleChange("borderColor", e.target.value)}
              placeholder="#E5E7EB"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Largura da Borda (px)</Label>
            <Input
              type="number"
              value={content.borderWidth || 1}
              onChange={(e) => handleChange("borderWidth", parseInt(e.target.value) || 0)}
              min={0}
              max={10}
              placeholder="1"
            />
          </div>
          <div>
            <Label>Raio da Borda (px)</Label>
            <Input
              type="number"
              value={content.borderRadius || 0}
              onChange={(e) => handleChange("borderRadius", parseInt(e.target.value) || 0)}
              min={0}
              max={50}
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
