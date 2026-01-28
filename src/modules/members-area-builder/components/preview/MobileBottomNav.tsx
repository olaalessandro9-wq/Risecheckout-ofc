/**
 * Mobile Bottom Nav - Bottom navigation para mobile preview
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import type { MembersAreaBuilderSettings } from '../../types';

interface MobileBottomNavProps {
  settings: MembersAreaBuilderSettings;
  isPreviewMode: boolean;
  selectedMenuItemId?: string | null;
  onSelectMenuItem?: (itemId: string) => void;
}

export function MobileBottomNav({ 
  settings, 
  isPreviewMode, 
  selectedMenuItemId,
  onSelectMenuItem,
}: MobileBottomNavProps) {
  const visibleItems = (settings.menu_items ?? []).filter(item => item.is_visible).slice(0, 5);
  
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return IconComponent || Icons.Circle;
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-around border-t px-2 py-2 transition-all duration-200',
        settings.theme === 'dark' 
          ? 'bg-zinc-900 border-zinc-800' 
          : 'bg-white border-gray-200',
      )}
    >
      {visibleItems.map((item, index) => {
        const IconComponent = getIcon(item.icon);
        const isActive = index === 0;
        const isSelected = selectedMenuItemId === item.id;
        
        return (
          <div
            key={item.id}
            onClick={(e) => {
              if (!isPreviewMode) {
                e.stopPropagation();
                onSelectMenuItem?.(item.id);
              }
            }}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors cursor-pointer',
              settings.theme === 'dark'
                ? 'text-zinc-500'
                : 'text-gray-500',
              isSelected && !isPreviewMode && 'ring-2 ring-primary ring-offset-1',
              isSelected && settings.theme === 'dark' && 'ring-offset-zinc-900',
              isSelected && settings.theme !== 'dark' && 'ring-offset-white',
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
    </div>
  );
}
