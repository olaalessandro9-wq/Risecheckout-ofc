/**
 * Text View - Renderiza seção de texto
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Type } from 'lucide-react';
import type { Section, TextSettings, ViewMode } from '../../../types/builder.types';

interface TextViewProps {
  section: Section;
  viewMode: ViewMode;
  theme: 'light' | 'dark';
}

export function TextView({ section, viewMode, theme }: TextViewProps) {
  const settings = section.settings as TextSettings;
  
  if (!settings.content) {
    return (
      <div className="p-6">
        <div className={cn(
          'flex items-center justify-center gap-2 py-8 rounded-lg border-2 border-dashed',
          theme === 'dark' ? 'border-zinc-700 text-zinc-500' : 'border-gray-300 text-gray-400'
        )}>
          <Type className="h-5 w-5" />
          <span>Clique para adicionar texto</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div 
        className={cn(
          'prose max-w-none',
          theme === 'dark' ? 'prose-invert' : '',
          settings.alignment === 'center' && 'text-center',
          settings.alignment === 'right' && 'text-right'
        )}
        dangerouslySetInnerHTML={{ __html: settings.content }}
      />
    </div>
  );
}
