/**
 * Modules View - Renderiza seção de módulos estilo Netflix
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Play, Lock } from 'lucide-react';
import type { Section, ModulesSettings, ViewMode } from '../../../types/builder.types';

interface ModulesViewProps {
  section: Section;
  viewMode: ViewMode;
  theme: 'light' | 'dark';
}

// Mock data para preview
const MOCK_MODULES = [
  { id: '1', title: 'Módulo 1 - Introdução', thumbnail: null, lessons: 5, progress: 100 },
  { id: '2', title: 'Módulo 2 - Fundamentos', thumbnail: null, lessons: 8, progress: 60 },
  { id: '3', title: 'Módulo 3 - Avançado', thumbnail: null, lessons: 12, progress: 0 },
  { id: '4', title: 'Módulo 4 - Prática', thumbnail: null, lessons: 6, progress: 0 },
  { id: '5', title: 'Módulo 5 - Bônus', thumbnail: null, lessons: 3, progress: 0, locked: true },
];

export function ModulesView({ section, viewMode, theme }: ModulesViewProps) {
  const settings = section.settings as ModulesSettings;
  const cardsPerRow = viewMode === 'mobile' ? 2 : (settings.cards_per_row || 4);
  
  return (
    <div className="p-6">
      {/* Section Title */}
      {section.title && (
        <h2 className={cn(
          'text-xl font-bold mb-4',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {section.title}
        </h2>
      )}

      {/* Modules Grid/Carousel */}
      <div 
        className="grid gap-4"
        style={{ 
          gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))` 
        }}
      >
        {MOCK_MODULES.map((module) => (
          <ModuleCard 
            key={module.id} 
            module={module} 
            showTitle={settings.show_title || 'always'}
            showProgress={settings.show_progress}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}

interface ModuleCardProps {
  module: typeof MOCK_MODULES[0];
  showTitle: 'always' | 'hover' | 'never';
  showProgress: boolean;
  theme: 'light' | 'dark';
}

function ModuleCard({ module, showTitle, showProgress, theme }: ModuleCardProps) {
  const isLocked = 'locked' in module && module.locked;
  
  return (
    <div className="group relative">
      {/* Thumbnail */}
      <div 
        className={cn(
          'relative aspect-video rounded-lg overflow-hidden',
          theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'
        )}
      >
        {module.thumbnail ? (
          <img 
            src={module.thumbnail} 
            alt={module.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-300'
            )}>
              {isLocked ? (
                <Lock className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Play className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div className={cn(
          'absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity',
          isLocked && 'cursor-not-allowed'
        )}>
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            isLocked ? 'bg-zinc-600' : 'bg-primary'
          )}>
            {isLocked ? (
              <Lock className="h-5 w-5 text-white" />
            ) : (
              <Play className="h-5 w-5 text-white fill-white" />
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && module.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div 
              className="h-full bg-primary transition-all"
              style={{ width: `${module.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Title */}
      {showTitle !== 'never' && (
        <div className={cn(
          'mt-2 transition-opacity',
          showTitle === 'hover' && 'opacity-0 group-hover:opacity-100'
        )}>
          <h3 className={cn(
            'text-sm font-medium truncate',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {module.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {module.lessons} aulas
          </p>
        </div>
      )}
    </div>
  );
}
