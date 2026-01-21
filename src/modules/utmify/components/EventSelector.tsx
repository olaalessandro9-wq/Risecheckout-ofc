/**
 * EventSelector - Multi-select for UTMify events
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUTMifyContext } from "../context";
import { UTMIFY_EVENTS } from "../constants";

export function EventSelector() {
  const { selectedEvents, toggleEvent } = useUTMifyContext();
  const [open, setOpen] = useState(false);

  const getLabel = () => {
    if (selectedEvents.length === 0) return "Selecione os eventos";
    if (selectedEvents.length === UTMIFY_EVENTS.length) return "Todos os eventos";
    return `${selectedEvents.length} evento(s) selecionado(s)`;
  };

  return (
    <div className="space-y-2">
      <Label>Eventos</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            role="combobox" 
            className="w-full justify-between"
          >
            {getLabel()}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar evento..." />
            <CommandEmpty>Nenhum evento encontrado.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {UTMIFY_EVENTS.map((event) => (
                <CommandItem 
                  key={event.id} 
                  onSelect={() => toggleEvent(event.id)}
                >
                  <Checkbox 
                    checked={selectedEvents.includes(event.id)} 
                    className="mr-2" 
                  />
                  <div className="flex flex-col">
                    <span>{event.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {event.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedEvents.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedEvents.map((eventId) => {
            const event = UTMIFY_EVENTS.find((e) => e.id === eventId);
            return event ? (
              <Badge key={eventId} variant="secondary">
                {event.label}
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
