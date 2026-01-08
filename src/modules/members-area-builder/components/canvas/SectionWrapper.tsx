/**
 * Section Wrapper - Container com controles de seção
 * Envolve cada seção no canvas com controles de edição
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { getSectionLabel, getSectionIcon, canDeleteSection, canDuplicateSection } from '../../registry';
import type { Section } from '../../types/builder.types';
import * as Icons from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SectionWrapperProps {
  section: Section;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  isPreviewMode: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  children: React.ReactNode;
}

export function SectionWrapper({
  section,
  isSelected,
  isFirst,
  isLast,
  isPreviewMode,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onToggleActive,
  children,
}: SectionWrapperProps) {
  const iconName = getSectionIcon(section.type);
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName] || Icons.Box;
  
  const canDelete = canDeleteSection(section.type);
  const canDuplicate = canDuplicateSection(section.type);
  
  if (isPreviewMode) {
    return <>{children}</>;
  }

  const handleMoveUp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isFirst) onMoveUp();
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLast) onMoveDown();
  };

  const handleToggleActive = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleActive();
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canDuplicate) onDuplicate();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canDelete) onDelete();
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'group relative border-2 rounded-lg transition-all duration-200',
          isSelected 
            ? 'border-primary ring-2 ring-primary/20' 
            : 'border-transparent hover:border-muted-foreground/30',
          !section.is_active && 'opacity-50'
        )}
        onClick={handleSelect}
      >
        {/* Section Header */}
        <div 
          className={cn(
            'absolute -top-3 left-4 flex items-center gap-2 px-2 py-0.5 rounded-md text-xs font-medium transition-opacity z-10',
            'bg-background border',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab" />
          <IconComponent className="h-3 w-3" />
          <span>{getSectionLabel(section.type)}</span>
          {section.title && (
            <span className="text-muted-foreground">• {section.title}</span>
          )}
          {!canDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Lock className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Seção obrigatória</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Section Controls */}
        <div 
          className={cn(
            'absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 transition-opacity z-10',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <div className="flex flex-col gap-0.5 bg-background border rounded-md shadow-sm p-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleMoveUp}
                  disabled={isFirst}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Mover para cima</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleMoveDown}
                  disabled={isLast}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Mover para baixo</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex flex-col gap-0.5 bg-background border rounded-md shadow-sm p-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleToggleActive}
                >
                  {section.is_active ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{section.is_active ? 'Ocultar seção' : 'Mostrar seção'}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleDuplicate}
                  disabled={!canDuplicate}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{canDuplicate ? 'Duplicar seção' : 'Não pode duplicar'}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-6 w-6',
                    canDelete ? 'text-destructive hover:text-destructive' : 'text-muted-foreground'
                  )}
                  onClick={handleDelete}
                  disabled={!canDelete}
                >
                  {canDelete ? (
                    <Trash2 className="h-3 w-3" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{canDelete ? 'Remover seção' : 'Seção obrigatória'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Section Content */}
        <div className="relative">
          {children}
        </div>
      </div>
    </TooltipProvider>
  );
}
