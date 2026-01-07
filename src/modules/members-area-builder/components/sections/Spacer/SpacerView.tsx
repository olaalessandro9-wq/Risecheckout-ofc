/**
 * Spacer View - Renderiza espaço em branco
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { Section, SpacerSettings, ViewMode } from '../../../types/builder.types';

interface SpacerViewProps {
  section: Section;
  viewMode: ViewMode;
  theme: 'light' | 'dark';
}

export function SpacerView({ section, viewMode, theme }: SpacerViewProps) {
  const settings = section.settings as SpacerSettings;
  const height = settings.height || 40;
  
  return (
    <div 
      className={cn(
        'relative group',
        // Visual indicator in edit mode
        'before:absolute before:inset-x-4 before:top-1/2 before:-translate-y-1/2',
        'before:border-t before:border-dashed',
        theme === 'dark' ? 'before:border-zinc-700' : 'before:border-gray-300'
      )}
      style={{ height: `${height}px` }}
    >
      {/* Height indicator */}
      <div className={cn(
        'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
        'px-2 py-0.5 rounded text-xs',
        'opacity-0 group-hover:opacity-100 transition-opacity',
        theme === 'dark' ? 'bg-zinc-700 text-zinc-300' : 'bg-gray-200 text-gray-600'
      )}>
        {height}px
      </div>
    </div>
  );
}
