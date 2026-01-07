/**
 * Add Section Button - Botão para adicionar novas seções
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
import * as Icons from 'lucide-react';
import { SectionRegistry, getAvailableSectionTypes } from '../../registry';
import type { SectionType, Section } from '../../types/builder.types';

interface AddSectionButtonProps {
  sections: Section[];
  onAdd: (type: SectionType) => void;
  className?: string;
}

export function AddSectionButton({ sections, onAdd, className }: AddSectionButtonProps) {
  const [open, setOpen] = useState(false);
  
  const availableTypes = getAvailableSectionTypes(sections);

  const handleSelect = (type: SectionType) => {
    onAdd(type);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={className}
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Seção
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64">
        {availableTypes.map((type) => {
          const config = SectionRegistry[type];
          const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[config.icon] || Icons.Box;
          
          return (
            <DropdownMenuItem
              key={type}
              onClick={() => handleSelect(type)}
              className="flex items-start gap-3 p-3 cursor-pointer"
            >
              <IconComponent className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium">{config.label}</span>
                <span className="text-xs text-muted-foreground">{config.description}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
        
        {availableTypes.length === 0 && (
          <div className="p-3 text-center text-muted-foreground text-sm">
            Todas as seções foram adicionadas
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
