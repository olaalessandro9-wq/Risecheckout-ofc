/**
 * Menu Preview - Sidebar Netflix-style preview no canvas
 * Full height, collapsible
 * Suporta modo click (botão) e hover (mouse) para desktop
 * 
 * MIGRATED: Uses Edge Function instead of supabase.from()
 * @see RISE ARCHITECT PROTOCOL
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import * as Icons from 'lucide-react';
import { ChevronLeft, ChevronRight, Plus, LogOut } from 'lucide-react';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MembersAreaBuilderSettings } from '../../types';

const log = createLogger("MenuPreview");

interface ProfileResponse {
  success?: boolean;
  data?: { name?: string | null };
  error?: string;
}

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
  const { user } = useUnifiedAuth();
  
  // Internal hover state for hover mode
  const [isHovered, setIsHovered] = useState(false);
  
  /**
   * Fetch profile via Edge Function
   * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
   */
  const { data: profile } = useQuery({
    queryKey: ["user-profile-builder", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await api.call<ProfileResponse>('admin-data', {
        action: 'user-profile-name',
        userId: user.id,
      });
      
      if (error) {
        log.error("Error fetching profile:", error);
        return null;
      }
      
      if (!data?.success) {
        log.error("Error fetching profile:", data?.error);
        return null;
      }
      
      return data.data;
    },
    enabled: !!user?.id,
  });

  const initials = getInitials(profile?.name, user?.email);
  const displayName = profile?.name || user?.email?.split('@')[0] || 'Usuário';
  const displayEmail = user?.email || '';

  const visibleItems = (settings.menu_items ?? []).filter(item => item.is_visible);
  
  const isHoverMode = settings.sidebar_animation === 'hover';
  
  // In hover mode, use internal state; in click mode, use prop
  const effectiveCollapsed = isHoverMode ? !isHovered : isCollapsed;
  
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return IconComponent || Icons.Circle;
  };

  const handleMouseEnter = useCallback(() => {
    if (isHoverMode) {
      setIsHovered(true);
    }
  }, [isHoverMode]);

  const handleMouseLeave = useCallback(() => {
    if (isHoverMode) {
      setIsHovered(false);
    }
  }, [isHoverMode]);

  const collapsedWidth = 64;
  const expandedWidth = 220;
  const sidebarWidth = effectiveCollapsed ? collapsedWidth : expandedWidth;

  return (
    <div 
      className="relative flex-shrink-0 flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Toggle Button - Only in click mode, positioned OUTSIDE aside */}
      {!isHoverMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse?.();
          }}
          className={cn(
            'absolute z-30 w-6 h-6 rounded-full flex items-center justify-center shadow-md border transition-colors',
            settings.theme === 'dark'
              ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300'
              : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-600'
          )}
          style={{ 
            top: 24, 
            left: sidebarWidth - 12,
            transition: 'left 0.3s ease'
          }}
        >
          {effectiveCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      )}

      <motion.div
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'flex flex-col h-full border-r flex-shrink-0',
          settings.theme === 'dark' 
            ? 'bg-zinc-900 border-zinc-800' 
            : 'bg-gray-50 border-gray-200',
        )}
      >
        {/* Logo Area */}
        <div className={cn(
          'p-4 flex items-center border-b',
          settings.theme === 'dark' ? 'border-zinc-800' : 'border-gray-200',
          effectiveCollapsed ? 'justify-center' : 'gap-3'
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
          {!effectiveCollapsed && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={cn(
                'font-semibold text-sm truncate',
                settings.theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}
            >
              Área de Membros
            </motion.span>
          )}
        </div>

        {/* Menu Items */}
        <nav className={cn(
          'flex-1 flex flex-col py-4 gap-1 overflow-y-auto overflow-x-hidden',
          effectiveCollapsed ? 'items-center px-2' : 'px-3'
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
                  'flex items-center gap-3 rounded-lg transition-all cursor-pointer whitespace-nowrap',
                  effectiveCollapsed ? 'flex-col gap-1 p-2 justify-center' : 'p-3',
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
                <IconComponent className="flex-shrink-0 h-5 w-5" />
                {!effectiveCollapsed && (
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
                effectiveCollapsed ? 'p-2 justify-center' : 'p-3',
                settings.theme === 'dark'
                  ? 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'
              )}
            >
              <Plus className="h-5 w-5 flex-shrink-0" />
              {!effectiveCollapsed && <span className="text-sm">Adicionar item</span>}
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
            effectiveCollapsed && 'justify-center',
            settings.theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'
          )}>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-primary-foreground text-xs font-semibold"
            >
              {initials}
            </div>
            {!effectiveCollapsed && (
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
            effectiveCollapsed && 'justify-center',
            settings.theme === 'dark'
              ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          )}>
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!effectiveCollapsed && <span className="text-sm">Sair</span>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
