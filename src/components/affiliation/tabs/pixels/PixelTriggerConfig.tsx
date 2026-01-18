/**
 * PixelTriggerConfig - Configuration for pixel trigger events
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 * @module affiliation/tabs/pixels/PixelTriggerConfig
 */

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface PixelTriggerConfigProps {
  label: string;
  enabled: boolean;
  value: number;
  onEnabledChange: (enabled: boolean) => void;
  onValueChange: (value: number) => void;
}

export function PixelTriggerConfig({ 
  label, 
  enabled, 
  value, 
  onEnabledChange, 
  onValueChange 
}: PixelTriggerConfigProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>
      {enabled && (
        <div>
          <Label className="text-xs text-muted-foreground">Valor de conversão (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={value}
            onChange={(e) => onValueChange(parseInt(e.target.value) || 0)}
            className="h-8"
          />
        </div>
      )}
    </div>
  );
}
