import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComponentData } from "../../types";

interface TimerEditorProps {
  component: ComponentData;
  onChange: (newContent: any) => void;
  design?: any;
}

export const TimerEditor = ({ component, onChange }: TimerEditorProps) => {
  const content = component.content || {};

  const handleChange = (field: string, value: any) => {
    onChange({
      ...content,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Tempo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Minutos</Label>
          <Input
            type="number"
            value={content.minutes || 15}
            onChange={(e) => handleChange("minutes", parseInt(e.target.value))}
            min={0}
            max={59}
          />
        </div>
        <div>
          <Label>Segundos</Label>
          <Input
            type="number"
            value={content.seconds || 0}
            onChange={(e) => handleChange("seconds", parseInt(e.target.value))}
            min={0}
            max={59}
          />
        </div>
      </div>

      {/* Cores */}
      <div>
        <Label>Cor de Fundo</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={content.timerColor || "#10B981"}
            onChange={(e) => handleChange("timerColor", e.target.value)}
            className="w-12 h-10 rounded cursor-pointer border"
          />
          <Input
            value={content.timerColor || "#10B981"}
            onChange={(e) => handleChange("timerColor", e.target.value)}
            placeholder="#10B981"
          />
        </div>
      </div>

      <div>
        <Label>Cor do Texto</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={content.textColor || "#FFFFFF"}
            onChange={(e) => handleChange("textColor", e.target.value)}
            className="w-12 h-10 rounded cursor-pointer border"
          />
          <Input
            value={content.textColor || "#FFFFFF"}
            onChange={(e) => handleChange("textColor", e.target.value)}
            placeholder="#FFFFFF"
          />
        </div>
      </div>

      {/* Textos */}
      <div>
        <Label>Texto Contagem Ativa</Label>
        <Input
          value={content.activeText || "Oferta por tempo limitado"}
          onChange={(e) => handleChange("activeText", e.target.value)}
          placeholder="Oferta por tempo limitado"
        />
      </div>

      <div>
        <Label>Texto Contagem Finalizada</Label>
        <Input
          value={content.finishedText || "Oferta finalizada"}
          onChange={(e) => handleChange("finishedText", e.target.value)}
          placeholder="Oferta finalizada"
        />
      </div>

      {/* Fixar no Topo */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`fixar-topo-${component.id}`}
          checked={content.fixedTop || false}
          onChange={(e) => handleChange("fixedTop", e.target.checked)}
          className="w-4 h-4 rounded"
        />
        <Label htmlFor={`fixar-topo-${component.id}`} className="cursor-pointer">
          Fixar no Topo
        </Label>
      </div>
    </div>
  );
};
