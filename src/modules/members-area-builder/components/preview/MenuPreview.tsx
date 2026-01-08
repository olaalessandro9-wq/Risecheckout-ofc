/**
 * Menu Preview - Sidebar Netflix-style preview no canvas
 * Full height, collapsible
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { ChevronLeft, ChevronRight, Plus, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MembersAreaBuilderSettings } from '../../types/builder.types';

interface MenuPreviewProps {
  settings: MembersAreaBuilderSettings;
  isPreviewMode: boolean;
  isCollapsed?: boolean;
  selectedMenuItemId?: string | null;
  onToggleCollapse?: () => void;
  onSelectMenuItem?: (itemId: string) => void;
}

function getInitials(name: string | null | undefined, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  
  return "??";
}

export function MenuPreview({ 
  settings, 
  isPreviewMode, 
  isCollapsed = false,
  selectedMenuItemId,
  onToggleCollapse,
  onSelectMenuItem,
}: MenuPreviewProps) {
  const { user } = useAuth();
  
  const { data: profile } = useQuery({
    queryKey: ["user-profile-builder", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  const initials = getInitials(profile?.name, user?.email);
  const displayName = profile?.name || user?.email?.split('@')[0] || 'Usuário';
  const displayEmail = user?.email || '';

  const visibleItems = (settings.menu_items ?? []).filter(item => item.is_visible);
  
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return IconComponent || Icons.Circle;
  };

  const sidebarWidth = isCollapsed ? 64 : 220;

  return (
    <div
      className={cn(
        'relative flex flex-col h-full border-r transition-all duration-300 flex-shrink-0',
        settings.theme === 'dark' 
          ? 'bg-zinc-900 border-zinc-800' 
          : 'bg-gray-50 border-gray-200',
      )}
      style={{ width: sidebarWidth }}
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
        'p-4 flex items-center border-b',
        settings.theme === 'dark' ? 'border-zinc-800' : 'border-gray-200',
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
                isCollapsed ? 'flex-col gap-1 p-2 justify-center' : 'p-3',
                settings.theme === 'dark'
                  ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
                isActive && 'font-medium',
                isSelected && !isPreviewMode && 'ring-2 ring-primary ring-offset-2',
                isSelected && settings.theme === 'dark' && 'ring-offset-zinc-900',
                isSelected && settings.theme !== 'dark' && 'ring-offset-gray-50',
              )}
              style={isActive ? { color: settings.primary_color } : undefined}
            >
              <IconComponent className={cn('flex-shrink-0 h-5 w-5')} />
              {!isCollapsed && (
                <span className="text-sm truncate">{item.label}</span>
              )}
            </div>
          );
        })}

        {/* Add Item Button (only in edit mode) */}
        {!isPreviewMode && (
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg transition-colors cursor-pointer mt-2 border-2 border-dashed',
              isCollapsed ? 'p-2 justify-center' : 'p-3',
              settings.theme === 'dark'
                ? 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
                : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'
            )}
          >
            <Plus className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm">Adicionar item</span>}
          </div>
        )}
      </nav>

      {/* User Section at Bottom */}
      <div className={cn(
        'border-t p-3',
        settings.theme === 'dark' ? 'border-zinc-800' : 'border-gray-200',
      )}>
        {/* User Info */}
        <div className={cn(
          'flex items-center gap-3 p-2 rounded-lg mb-2',
          isCollapsed && 'justify-center',
          settings.theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'
        )}>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-primary-foreground text-xs font-semibold"
          >
            {initials}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className={cn(
                'text-xs truncate',
                settings.theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
              )}>
                {displayEmail}
              </p>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className={cn(
          'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
          isCollapsed && 'justify-center',
          settings.theme === 'dark'
            ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        )}>
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm">Sair</span>}
        </div>
      </div>
    </div>
  );
}
