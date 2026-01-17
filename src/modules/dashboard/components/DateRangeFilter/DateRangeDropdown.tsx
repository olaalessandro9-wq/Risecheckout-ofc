/**
 * DateRangeDropdown Component
 * 
 * @module dashboard/components
 * @version RISE V3 Compliant
 * 
 * Componente puro para o dropdown de presets de data.
 * Zero estado interno - recebe tudo via props.
 */

import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DATE_PRESETS } from "../../config";
import type { DateRangePreset } from "../../types";

interface DateRangeDropdownProps {
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly selectedPreset: DateRangePreset;
  readonly displayLabel: string;
  readonly onPresetSelect: (preset: DateRangePreset) => void;
  readonly onCustomClick: () => void;
}

export function DateRangeDropdown({
  isOpen,
  onOpenChange,
  selectedPreset,
  displayLabel,
  onPresetSelect,
  onCustomClick,
}: DateRangeDropdownProps) {
  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 min-w-[200px] justify-between"
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {displayLabel}
          </span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[200px]">
        {DATE_PRESETS.map((preset) => (
          <DropdownMenuItem
            key={preset.value}
            onClick={() => onPresetSelect(preset.value)}
            className={selectedPreset === preset.value ? "bg-accent" : ""}
          >
            {preset.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onCustomClick}>
          <Calendar className="w-4 h-4 mr-2" />
          Período personalizado
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
