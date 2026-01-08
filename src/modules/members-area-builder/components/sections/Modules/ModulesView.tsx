/**
 * Modules View - Renderiza seção de módulos estilo Netflix
 * Aplica filtro de visibilidade e ordem customizada
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Play, Lock, Pencil } from 'lucide-react';
import type { Section, ModulesSettings, ViewMode, MemberModule } from '../../../types/builder.types';

interface ModulesViewProps {
  section: Section;
  viewMode: ViewMode;
  theme: 'light' | 'dark';
  modules?: MemberModule[];
  onModuleClick?: (moduleId: string) => void;
  isPreviewMode?: boolean;
}

export function ModulesView({ section, viewMode, theme, modules = [], onModuleClick, isPreviewMode = false }: ModulesViewProps) {
  const settings = section.settings as ModulesSettings;
  const cardsPerRow = viewMode === 'mobile' ? 2 : (settings.cards_per_row || 4);
  
  // Apply visibility filter and custom order
  const getVisibleOrderedModules = (): MemberModule[] => {
    const hiddenIds = settings.hidden_module_ids || [];
    const orderIds = settings.module_order || [];
    
    // Filter out hidden modules
    const visibleModules = modules.filter(m => !hiddenIds.includes(m.id));
    
    // Apply custom order if specified
    if (orderIds.length === 0) return visibleModules;
    
    const moduleMap = new Map(visibleModules.map(m => [m.id, m]));
    const ordered: MemberModule[] = [];
    
    // Add modules in order
    for (const id of orderIds) {
      const module = moduleMap.get(id);
      if (module) {
        ordered.push(module);
        moduleMap.delete(id);
      }
    }
    
    // Add remaining modules not in order
    for (const module of moduleMap.values()) {
      ordered.push(module);
    }
    
    return ordered;
  };
  
  const visibleModules = getVisibleOrderedModules();
  
  // Se não houver módulos visíveis, mostrar placeholder
  if (visibleModules.length === 0) {
    return (
      <div className="p-6">
        {section.title && (
          <h2 className={cn(
            'text-xl font-bold mb-4',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {section.title}
          </h2>
        )}
        <div className={cn(
          'rounded-lg border-2 border-dashed p-8 text-center',
          theme === 'dark' ? 'border-zinc-700 text-zinc-400' : 'border-gray-300 text-gray-500'
        )}>
          <p>Nenhum módulo visível nesta seção.</p>
          <p className="text-sm mt-1">
            {modules.length > 0 
              ? 'Todos os módulos estão ocultos. Ative a visibilidade no painel lateral.'
              : 'Crie módulos na aba "Conteúdo" da área de membros.'}
          </p>
        </div>
      </div>
    );
  }
  
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

      {/* Modules Grid */}
      <div 
        className="grid gap-4"
        style={{ 
          gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))` 
        }}
      >
        {visibleModules.map((module) => (
          <ModuleCard 
            key={module.id} 
            module={module} 
            showTitle={settings.show_title || 'always'}
            showProgress={settings.show_progress}
            theme={theme}
            isPreviewMode={isPreviewMode}
            onClick={() => onModuleClick?.(module.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ModuleCardProps {
  module: MemberModule;
  showTitle: 'always' | 'hover' | 'never';
  showProgress: boolean;
  theme: 'light' | 'dark';
  isPreviewMode?: boolean;
  onClick?: () => void;
}

function ModuleCard({ module, showTitle, showProgress, theme, isPreviewMode = false, onClick }: ModuleCardProps) {
  const isInactive = !module.is_active;
  
  return (
    <div 
      className={cn(
        'group/module relative',
        !isPreviewMode && 'cursor-pointer'
      )}
      onClick={!isPreviewMode ? onClick : undefined}
    >
      {/* Thumbnail - Vertical poster format like Netflix */}
      <div 
        className={cn(
          'relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-200',
          !isPreviewMode && 'group-hover/module:scale-105 group-hover/module:shadow-lg',
          theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'
        )}
      >
        {module.cover_image_url ? (
          <img 
            src={module.cover_image_url} 
            alt={module.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-300'
            )}>
              {isInactive ? (
                <Lock className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Play className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        )}

        {/* Hover overlay e ícone de edição - SÓ NO MODO EDITOR */}
        {!isPreviewMode && (
          <>
            {/* Subtle hover overlay - gradient only */}
            <div className={cn(
              'absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent',
              'opacity-0 group-hover/module:opacity-100 transition-opacity duration-200'
            )} />

            {/* Discrete edit icon - top right corner (Kiwify style) */}
            <div className={cn(
              'absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center',
              'bg-black/70 backdrop-blur-sm border border-white/10',
              'opacity-0 group-hover/module:opacity-100 transition-opacity duration-200',
              'hover:bg-black/90'
            )}>
              <Pencil className="h-3.5 w-3.5 text-white" />
            </div>
          </>
        )}

        {/* Inactive Badge */}
        {isInactive && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/90 text-white">
            Inativo
          </div>
        )}

        {/* Progress Bar - placeholder since we don't have real progress */}
        {showProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div 
              className="h-full bg-primary transition-all"
              style={{ width: '0%' }}
            />
          </div>
        )}
      </div>

      {/* Title */}
      {showTitle !== 'never' && (
        <div className={cn(
          'mt-2 transition-opacity',
          showTitle === 'hover' && 'opacity-0 group-hover/module:opacity-100'
        )}>
          <h3 className={cn(
            'text-sm font-medium truncate',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {module.title}
          </h3>
          {module.description && (
            <p className="text-xs text-muted-foreground truncate">
              {module.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
