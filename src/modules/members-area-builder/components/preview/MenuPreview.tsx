/**
 * Menu Preview - Sidebar Netflix-style preview no canvas
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { MembersAreaBuilderSettings, MenuItemConfig } from '../../types/builder.types';

interface MenuPreviewProps {
  settings: MembersAreaBuilderSettings;
  isPreviewMode: boolean;
  isCollapsed?: boolean;
  selectedMenuItemId?: string | null;
  onToggleCollapse?: () => void;
  onSelectMenuItem?: (itemId: string) => void;
}

export function MenuPreview({ 
  settings, 
  isPreviewMode, 
  isCollapsed = false,
  selectedMenuItemId,
  onToggleCollapse,
  onSelectMenuItem,
}: MenuPreviewProps) {
  const visibleItems = (settings.menu_items ?? []).filter(item => item.is_visible);
  
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return IconComponent || Icons.Circle;
  };

  return (
    <div
      className={cn(
        'relative flex flex-col h-full border-r transition-all duration-300 sticky top-0',
        settings.theme === 'dark' 
          ? 'bg-zinc-900 border-zinc-800' 
          : 'bg-gray-50 border-gray-200',
      )}
      style={{ width: isCollapsed ? '72px' : '200px' }}
    >
      {/* Collapse/Expand Button */}
      {!isPreviewMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse?.();
          }}
          className={cn(
            'absolute -right-3 top-6 z-20 w-6 h-6 rounded-full flex items-center justify-center shadow-md border transition-colors',
            settings.theme === 'dark'
              ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300'
              : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-600'
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      )}

      {/* Logo Area */}
      <div className={cn(
        'p-3 flex items-center border-b border-inherit',
        isCollapsed ? 'justify-center' : 'gap-3'
      )}>
        {settings.logo_url ? (
          <img 
            src={settings.logo_url} 
            alt="Logo" 
            className="h-8 w-8 object-contain flex-shrink-0"
          />
        ) : (
          <div 
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: settings.primary_color }}
          >
            R
          </div>
        )}
        {!isCollapsed && (
          <span className={cn(
            'font-semibold text-sm truncate',
            settings.theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Área de Membros
          </span>
        )}
      </div>

      {/* Menu Items */}
      <nav className={cn(
        'flex-1 flex flex-col py-4 gap-1 overflow-y-auto',
        isCollapsed ? 'items-center px-2' : 'px-3'
      )}>
        {visibleItems.map((item) => {
          const IconComponent = getIcon(item.icon);
          const isSelected = selectedMenuItemId === item.id;
          const isActive = item.is_default;
          
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
                'flex items-center gap-3 rounded-lg transition-all cursor-pointer',
                isCollapsed ? 'flex-col gap-1 p-2 w-14' : 'p-2.5',
                settings.theme === 'dark'
                  ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
                isActive && 'font-medium',
                isSelected && !isPreviewMode && 'ring-2 ring-primary ring-offset-1',
                isSelected && settings.theme === 'dark' && 'ring-offset-zinc-900',
                isSelected && settings.theme !== 'dark' && 'ring-offset-gray-50',
              )}
              style={isActive ? { color: settings.primary_color } : undefined}
            >
              <IconComponent className={cn('flex-shrink-0', isCollapsed ? 'h-5 w-5' : 'h-5 w-5')} />
              {isCollapsed ? (
                <span className="text-[10px] text-center leading-tight truncate w-full">
                  {item.label}
                </span>
              ) : (
                <span className="text-sm truncate">{item.label}</span>
              )}
            </div>
          );
        })}

        {/* Add Item Button (only in edit mode) */}
        {!isPreviewMode && !isCollapsed && (
          <div
            className={cn(
              'flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer mt-2 border-2 border-dashed',
              settings.theme === 'dark'
                ? 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
                : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'
            )}
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm">Adicionar item</span>
          </div>
        )}
      </nav>
    </div>
  );
}
