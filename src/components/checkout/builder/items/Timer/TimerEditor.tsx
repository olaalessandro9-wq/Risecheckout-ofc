import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComponentData } from "../../types";
import type { TimerContent } from "@/types/checkout-components.types";
import type { CheckoutDesign } from "@/types/checkoutEditor";
import { TIMER_LIMITS } from "@/lib/constants/field-limits";

interface TimerEditorProps {
  component: ComponentData;
  onChange: (newContent: Partial<TimerContent>) => void;
  design?: CheckoutDesign;
}

export const TimerEditor = ({ component, onChange }: TimerEditorProps) => {
  // Type assertion segura - o componente só recebe content do tipo correto via registry
  const content = (component.content || {}) as TimerContent;

  const handleChange = <K extends keyof TimerContent>(field: K, value: TimerContent[K]) => {
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
            onChange={(e) => {
              const rawValue = parseInt(e.target.value) || TIMER_LIMITS.MINUTES_MIN;
              const clampedValue = Math.max(
                TIMER_LIMITS.MINUTES_MIN,
                Math.min(TIMER_LIMITS.MINUTES_MAX, rawValue)
              );
              handleChange("minutes", clampedValue);
            }}
            min={TIMER_LIMITS.MINUTES_MIN}
            max={TIMER_LIMITS.MINUTES_MAX}
          />
        </div>
        <div>
          <Label>Segundos</Label>
          <Input
            type="number"
            value={content.seconds || 0}
            onChange={(e) => {
              const rawValue = parseInt(e.target.value) || TIMER_LIMITS.SECONDS_MIN;
              const clampedValue = Math.max(
                TIMER_LIMITS.SECONDS_MIN,
                Math.min(TIMER_LIMITS.SECONDS_MAX, rawValue)
              );
              handleChange("seconds", clampedValue);
            }}
            min={TIMER_LIMITS.SECONDS_MIN}
            max={TIMER_LIMITS.SECONDS_MAX}
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
          maxLength={TIMER_LIMITS.TEXT_MAX_LENGTH}
        />
      </div>

      <div>
        <Label>Texto Contagem Finalizada</Label>
        <Input
          value={content.finishedText || "Oferta finalizada"}
          onChange={(e) => handleChange("finishedText", e.target.value)}
          placeholder="Oferta finalizada"
          maxLength={TIMER_LIMITS.TEXT_MAX_LENGTH}
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
