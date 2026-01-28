/**
 * Modules View - Renderiza seção de módulos estilo Netflix
 * Usa carousel horizontal com cards de tamanho fixo (igual à área real)
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Play, Lock, Pencil, Film } from 'lucide-react';
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
  
  // Card sizes for preview (proportionally smaller than real area)
  const cardWidth = viewMode === 'mobile' ? 'w-[100px]' : 'w-[140px]';
  
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
      <div className="py-4">
        {section.title && (
          <h2 className={cn(
            'text-base font-semibold mb-3 px-4',
            theme === 'dark' ? 'text-white' : 'text-foreground'
          )}>
            {section.title}
          </h2>
        )}
        <div className={cn(
          'mx-4 rounded-lg border-2 border-dashed p-6 text-center',
          theme === 'dark' ? 'border-zinc-700 text-zinc-400' : 'border-border text-muted-foreground'
        )}>
          <p className="text-sm">Nenhum módulo visível nesta seção.</p>
          <p className="text-xs mt-1">
            {modules.length > 0 
              ? 'Todos os módulos estão ocultos. Ative a visibilidade no painel lateral.'
              : 'Crie módulos na aba "Conteúdo" da área de membros.'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-4">
      {/* Section Title */}
      {section.title && (
        <h2 className={cn(
          'text-base font-semibold mb-3 px-4',
          theme === 'dark' ? 'text-white' : 'text-foreground'
        )}>
          {section.title}
        </h2>
      )}

      {/* Horizontal Carousel - Same structure as real members area */}
      <div 
        className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {visibleModules.map((module, index) => (
          <ModuleCard 
            key={module.id} 
            module={module}
            index={index}
            cardWidth={cardWidth}
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
  index: number;
  cardWidth: string;
  showTitle: 'always' | 'hover' | 'never';
  showProgress: boolean;
  theme: 'light' | 'dark';
  isPreviewMode?: boolean;
  onClick?: () => void;
}

// Gradient colors for modules without cover (matching NetflixModuleCard)
const gradientColors = [
  'from-rose-600 to-purple-700',
  'from-blue-600 to-cyan-500',
  'from-green-600 to-emerald-500',
  'from-orange-600 to-amber-500',
  'from-indigo-600 to-violet-500',
  'from-pink-600 to-fuchsia-500',
];

function ModuleCard({ 
  module, 
  index,
  cardWidth, 
  showTitle, 
  showProgress, 
  theme, 
  isPreviewMode = false, 
  onClick 
}: ModuleCardProps) {
  const isInactive = !module.is_active;
  const gradient = gradientColors[index % gradientColors.length];
  
  return (
    <div 
      className={cn(
        'group/module relative flex-shrink-0',
        cardWidth,
        !isPreviewMode && 'cursor-pointer'
      )}
      onClick={!isPreviewMode ? onClick : undefined}
    >
      {/* Thumbnail - Vertical poster format like Netflix (2:3 aspect ratio) */}
      <div 
        className={cn(
          'relative aspect-[2/3] rounded-lg overflow-hidden shadow-md transition-all duration-200',
          !isPreviewMode && 'group-hover/module:scale-[1.03] group-hover/module:shadow-lg',
          'ring-1 ring-white/10'
        )}
      >
        {/* Background Image or Gradient Fallback */}
        {module.cover_image_url ? (
          <img 
            src={module.cover_image_url} 
            alt={module.title}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br', gradient)}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Film className="h-8 w-8 text-white/30" />
            </div>
          </div>
        )}

        {/* Gradient overlay for better readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Hover overlay e ícone de edição - SÓ NO MODO EDITOR */}
        {!isPreviewMode && (
          <>
            {/* Play icon on hover (preview mode only) */}
            <div className={cn(
              'absolute inset-0 flex items-center justify-center',
              'bg-black/0 group-hover/module:bg-black/30 transition-all duration-200'
            )}>
              <Play className={cn(
                'h-8 w-8 text-white fill-white',
                'opacity-0 group-hover/module:opacity-100 transition-opacity duration-200',
                'transform scale-75 group-hover/module:scale-100'
              )} />
            </div>

            {/* Discrete edit icon - top right corner */}
            <div className={cn(
              'absolute top-1.5 right-1.5 w-6 h-6 rounded-md flex items-center justify-center',
              'bg-black/70 backdrop-blur-sm border border-white/10',
              'opacity-0 group-hover/module:opacity-100 transition-opacity duration-200',
              'hover:bg-black/90'
            )}>
              <Pencil className="h-3 w-3 text-white" />
            </div>
          </>
        )}

        {/* Preview mode - Play icon on hover */}
        {isPreviewMode && (
          <div className={cn(
            'absolute inset-0 flex items-center justify-center',
            'bg-black/0 group-hover/module:bg-black/40 transition-all duration-300'
          )}>
            <Play className={cn(
              'h-8 w-8 text-white fill-white',
              'opacity-0 group-hover/module:opacity-100 transition-all duration-300',
              'transform scale-75 group-hover/module:scale-100'
            )} />
          </div>
        )}

        {/* Inactive Badge */}
        {isInactive && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/90 text-white">
            Inativo
          </div>
        )}

        {/* Progress Bar */}
        {showProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/50">
            <div 
              className="h-full bg-members-primary transition-all"
              style={{ width: '0%' }}
            />
          </div>
        )}
      </div>

      {/* Title below card (matching NetflixModuleCard style) */}
      {showTitle !== 'never' && (
        <div className={cn(
          'mt-1.5 transition-opacity',
          showTitle === 'hover' && 'opacity-0 group-hover/module:opacity-100'
        )}>
          <h3 className={cn(
            'text-xs font-medium truncate',
            theme === 'dark' ? 'text-white' : 'text-foreground'
          )}>
            {module.title}
          </h3>
          {module.description && (
            <p className="text-[10px] text-muted-foreground truncate">
              {module.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
