/**
 * Menu Preview - Sidebar Netflix-style preview no canvas
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import type { MembersAreaBuilderSettings, MenuItemConfig } from '../../types/builder.types';

interface MenuPreviewProps {
  settings: MembersAreaBuilderSettings;
  isPreviewMode: boolean;
  onSelectMenu?: () => void;
}

export function MenuPreview({ settings, isPreviewMode, onSelectMenu }: MenuPreviewProps) {
  const visibleItems = (settings.menu_items ?? []).filter(item => item.is_visible);
  
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return IconComponent || Icons.Circle;
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full border-r transition-all duration-200',
        settings.theme === 'dark' 
          ? 'bg-zinc-900 border-zinc-800' 
          : 'bg-gray-50 border-gray-200',
        !isPreviewMode && 'cursor-pointer hover:border-primary/50 group'
      )}
      onClick={onSelectMenu}
      style={{ width: '72px' }}
    >
      {/* Logo Area */}
      <div className="p-3 flex justify-center border-b border-inherit">
        {settings.logo_url ? (
          <img 
            src={settings.logo_url} 
            alt="Logo" 
            className="h-8 w-8 object-contain"
          />
        ) : (
          <div 
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: settings.primary_color }}
          >
            R
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 flex flex-col items-center py-4 gap-2">
        {visibleItems.map((item) => {
          const IconComponent = getIcon(item.icon);
          return (
            <div
              key={item.id}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-14',
                settings.theme === 'dark'
                  ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
                item.is_default && 'text-white'
              )}
              style={item.is_default ? { color: settings.primary_color } : undefined}
            >
              <IconComponent className="h-5 w-5" />
              <span className="text-[10px] text-center leading-tight truncate w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </nav>

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
