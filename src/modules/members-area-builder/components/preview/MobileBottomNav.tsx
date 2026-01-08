/**
 * Mobile Bottom Nav - Bottom navigation para mobile preview
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import type { MembersAreaBuilderSettings } from '../../types/builder.types';

interface MobileBottomNavProps {
  settings: MembersAreaBuilderSettings;
  isPreviewMode: boolean;
  onSelectMenu?: () => void;
}

export function MobileBottomNav({ settings, isPreviewMode, onSelectMenu }: MobileBottomNavProps) {
  const visibleItems = settings.menu_items.filter(item => item.is_visible).slice(0, 5); // Max 5 items
  
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return IconComponent || Icons.Circle;
  };

  return (
    <div
      className={cn(
        'flex items-center justify-around border-t px-2 py-2 transition-all duration-200',
        settings.theme === 'dark' 
          ? 'bg-zinc-900 border-zinc-800' 
          : 'bg-white border-gray-200',
        !isPreviewMode && 'cursor-pointer hover:border-primary/50 group relative'
      )}
      onClick={onSelectMenu}
    >
      {visibleItems.map((item, index) => {
        const IconComponent = getIcon(item.icon);
        const isActive = index === 0; // First item is "active"
        
        return (
          <div
            key={item.id}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors',
              settings.theme === 'dark'
                ? 'text-zinc-500'
                : 'text-gray-500',
            )}
            style={isActive ? { color: settings.primary_color } : undefined}
          >
            <IconComponent className="h-5 w-5" />
            <span className="text-[10px] truncate max-w-[48px]">
              {item.label}
            </span>
          </div>
        );
      })}

      {/* Edit Indicator */}
      {!isPreviewMode && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity',
          settings.theme === 'dark' ? 'bg-black/50' : 'bg-white/50'
        )}>
          <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
            Editar Menu
          </div>
        </div>
      )}
    </div>
  );
}
