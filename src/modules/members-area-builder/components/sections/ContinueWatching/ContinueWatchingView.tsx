/**
 * Continue Watching View - Seção de continuar assistindo
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Play, Clock } from 'lucide-react';
import type { Section, ContinueWatchingSettings, ViewMode } from '../../../types/builder.types';

interface ContinueWatchingViewProps {
  section: Section;
  viewMode: ViewMode;
  theme: 'light' | 'dark';
}

// Mock data para preview
const MOCK_WATCHING = [
  { id: '1', title: 'Aula 5 - Estratégias de Conversão', thumbnail: null, progress: 45, duration: '15:30' },
  { id: '2', title: 'Aula 3 - Fundamentos de Copy', thumbnail: null, progress: 72, duration: '22:15' },
  { id: '3', title: 'Aula 1 - Introdução ao Curso', thumbnail: null, progress: 90, duration: '08:45' },
];

export function ContinueWatchingView({ section, viewMode, theme }: ContinueWatchingViewProps) {
  const settings = section.settings as ContinueWatchingSettings;
  const items = MOCK_WATCHING.slice(0, settings.max_items || 10);
  
  if (items.length === 0) {
    return (
      <div className="p-6">
        <div className={cn(
          'text-center py-8 rounded-lg',
          theme === 'dark' ? 'bg-zinc-800/50' : 'bg-gray-100'
        )}>
          <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            Os conteúdos em progresso aparecerão aqui
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* Section Title */}
      <h2 className={cn(
        'text-xl font-bold mb-4',
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      )}>
        {section.title || 'Continuar Assistindo'}
      </h2>

      {/* Carousel */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {items.map((item) => (
          <WatchingCard 
            key={item.id} 
            item={item} 
            theme={theme}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
}

interface WatchingCardProps {
  item: typeof MOCK_WATCHING[0];
  theme: 'light' | 'dark';
  viewMode: ViewMode;
}

function WatchingCard({ item, theme, viewMode }: WatchingCardProps) {
  return (
    <div className={cn(
      'group cursor-pointer flex-shrink-0',
      viewMode === 'mobile' ? 'w-48' : 'w-72'
    )}>
      {/* Thumbnail */}
      <div 
        className={cn(
          'relative aspect-video rounded-lg overflow-hidden',
          theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'
        )}
      >
        {item.thumbnail ? (
          <img 
            src={item.thumbnail} 
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <Play className="h-5 w-5 text-white fill-white" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs">
          {item.duration}
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>

      {/* Title */}
      <h3 className={cn(
        'mt-2 text-sm font-medium line-clamp-2',
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      )}>
        {item.title}
      </h3>
    </div>
  );
}
