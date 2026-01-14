/**
 * Timer Editor - Editor de Componente Timer
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EditorComponentProps, TimerContent } from "../types";

export function TimerEditor({ content, handleChange }: EditorComponentProps<TimerContent>) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Minutos</Label>
          <Input 
            type="number" 
            value={content?.minutes || 15} 
            onChange={(e) => handleChange("minutes", parseInt(e.target.value))}
            min={0}
          />
        </div>
        <div className="space-y-2">
          <Label>Segundos</Label>
          <Input 
            type="number" 
            value={content?.seconds || 0} 
            onChange={(e) => handleChange("seconds", parseInt(e.target.value))}
            min={0}
            max={59}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Texto Ativo</Label>
        <Input 
          value={content?.activeText || "Oferta por tempo limitado"} 
          onChange={(e) => handleChange("activeText", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Texto Finalizado</Label>
        <Input 
          value={content?.finishedText || "Oferta encerrada"} 
          onChange={(e) => handleChange("finishedText", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Cor do Timer</Label>
        <div className="flex gap-2">
          <input 
            type="color" 
            className="w-12 h-10 rounded cursor-pointer" 
            value={content?.timerColor || "#EF4444"} 
            onChange={(e) => handleChange("timerColor", e.target.value)} 
          />
          <Input 
            value={content?.timerColor || "#EF4444"} 
            onChange={(e) => handleChange("timerColor", e.target.value)}
            placeholder="#EF4444"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Cor do Texto</Label>
        <div className="flex gap-2">
          <input 
            type="color" 
            className="w-12 h-10 rounded cursor-pointer" 
            value={content?.textColor || "#FFFFFF"} 
            onChange={(e) => handleChange("textColor", e.target.value)} 
          />
          <Input 
            value={content?.textColor || "#FFFFFF"} 
            onChange={(e) => handleChange("textColor", e.target.value)}
            placeholder="#FFFFFF"
          />
        </div>
      </div>
    </div>
  );
}
