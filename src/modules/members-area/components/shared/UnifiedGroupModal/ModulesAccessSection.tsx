/**
 * ModulesAccessSection - Module selection section for group permissions
 */

import { BookOpen, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { ModulesAccessSectionProps } from './types';

export function ModulesAccessSection({
  modules,
  moduleAccess,
  isLoading,
  accessCount,
  allSelected,
  error,
  onToggleModule,
  onSelectAll,
}: ModulesAccessSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h4 className="font-medium text-sm">Módulos que esse grupo tem acesso</h4>
        </div>
        <span className="text-xs text-muted-foreground">
          {accessCount} de {modules.length}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando permissões...</span>
        </div>
      ) : modules.length > 0 ? (
        <>
          {/* Select All Checkbox */}
          <div 
            className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={onSelectAll}
          >
            <Checkbox 
              checked={allSelected}
              onCheckedChange={onSelectAll}
            />
            <span className="text-sm font-medium">Todos os módulos</span>
          </div>

          {/* Modules List */}
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {modules.map((module) => (
              <div
                key={module.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  moduleAccess[module.id]
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-card border-transparent hover:border-border'
                )}
                onClick={() => onToggleModule(module.id)}
              >
                <Checkbox 
                  checked={moduleAccess[module.id] || false}
                  onCheckedChange={() => onToggleModule(module.id)}
                />
                
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                  {module.cover_image_url ? (
                    <img
                      src={module.cover_image_url}
                      alt=""
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{module.title}</p>
                  {module.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {module.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum módulo criado ainda</p>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
