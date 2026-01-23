/**
 * BuyerSidebar - Sidebar Netflix-style para área de membros do buyer
 * Versão simplificada do MenuPreview (sem funcionalidades de edição)
 * Suporta modo click (botão) e hover (mouse) para desktop
 * 
 * RISE V3: Uses useUnifiedAuth (unified identity)
 * @see RISE ARCHITECT PROTOCOL
 */

import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import type { MembersAreaBuilderSettings } from '@/modules/members-area-builder/types/builder.types';

interface BuyerSidebarProps {
  settings: MembersAreaBuilderSettings;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
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

export function BuyerSidebar({ 
  settings, 
  isCollapsed,
  onToggleCollapse,
}: BuyerSidebarProps) {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  // RISE V3: useUnifiedAuth em vez de useBuyerAuth
  const { user, logout } = useUnifiedAuth();

  // Internal hover state for hover mode
  const [isHovered, setIsHovered] = useState(false);

  const initials = getInitials(user?.name, user?.email);
  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuário';
  const displayEmail = user?.email || '';

  const visibleItems = (settings.menu_items ?? []).filter(item => item.is_visible);
  
  const isHoverMode = settings.sidebar_animation === 'hover';
  
  // In hover mode, use internal state; in click mode, use prop
  const effectiveCollapsed = isHoverMode ? !isHovered : isCollapsed;
  
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return IconComponent || Icons.Circle;
  };

  const handleMenuClick = (item: { id: string; label: string; link?: string }) => {
    if (item.link) {
      if (item.link.startsWith('http')) {
        window.open(item.link, '_blank');
      } else {
        navigate(item.link);
      }
    } else if (item.label.toLowerCase().includes('início') || item.label.toLowerCase().includes('home')) {
      navigate(`/minha-conta/produto/${productId}`);
    } else if (item.label.toLowerCase().includes('cursos') || item.label.toLowerCase().includes('courses')) {
      navigate('/minha-conta/dashboard');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/minha-conta');
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
      className="relative flex-shrink-0 hidden lg:flex h-screen"
      style={{ width: sidebarWidth }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Toggle Button - Only in click mode, positioned OUTSIDE aside to avoid overflow issues */}
      {!isHoverMode && (
        <button
          onClick={onToggleCollapse}
          className={cn(
            'absolute z-30 w-6 h-6 rounded-full flex items-center justify-center shadow-md border transition-colors',
            settings.theme === 'dark'
              ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300'
              : 'bg-background border-border hover:bg-muted text-muted-foreground'
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

      <motion.aside
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-0 h-screen flex flex-col border-r flex-shrink-0 z-20',
          settings.theme === 'dark' 
            ? 'bg-zinc-900 border-zinc-800' 
            : 'bg-muted/30 border-border',
        )}
      >
        {/* Logo Area */}
        <div className={cn(
          'p-4 flex items-center border-b',
          settings.theme === 'dark' ? 'border-zinc-800' : 'border-border',
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
                settings.theme === 'dark' ? 'text-white' : 'text-foreground'
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
            const isActive = item.is_default;
            
            return (
              <div
                key={item.id}
                onClick={() => handleMenuClick(item)}
                className={cn(
                  'flex items-center gap-3 rounded-lg transition-all cursor-pointer whitespace-nowrap',
                  effectiveCollapsed ? 'flex-col gap-1 p-2 justify-center' : 'p-3',
                  settings.theme === 'dark'
                    ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground',
                  isActive && 'font-medium',
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
        </nav>

        {/* User Section at Bottom */}
        <div className={cn(
          'border-t p-3',
          settings.theme === 'dark' ? 'border-zinc-800' : 'border-border',
        )}>
          {/* User Info */}
          <div className={cn(
            'flex items-center gap-3 p-2 rounded-lg mb-2',
            effectiveCollapsed && 'justify-center',
            settings.theme === 'dark' ? 'text-zinc-300' : 'text-foreground'
          )}>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
              style={{ 
                backgroundColor: settings.primary_color,
                color: '#ffffff'
              }}
            >
              {initials}
            </div>
            {!effectiveCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className={cn(
                  'text-xs truncate',
                  settings.theme === 'dark' ? 'text-zinc-500' : 'text-muted-foreground'
                )}>
                  {displayEmail}
                </p>
              </div>
            )}
          </div>

          {/* Logout */}
          <div 
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
              effectiveCollapsed && 'justify-center',
              settings.theme === 'dark'
                ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!effectiveCollapsed && <span className="text-sm">Sair</span>}
          </div>
        </div>
      </motion.aside>
    </div>
  );
}
