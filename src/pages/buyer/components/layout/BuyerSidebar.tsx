/**
 * BuyerSidebar - Sidebar Netflix-style para área de membros do buyer
 * Versão simplificada do MenuPreview (sem funcionalidades de edição)
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { ChevronLeft, ChevronRight, LogOut, Home } from 'lucide-react';
import { useBuyerAuth } from '@/hooks/useBuyerAuth';
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
  const { buyer, logout } = useBuyerAuth();

  const initials = getInitials(buyer?.name, buyer?.email);
  const displayName = buyer?.name || buyer?.email?.split('@')[0] || 'Usuário';
  const displayEmail = buyer?.email || '';

  const visibleItems = (settings.menu_items ?? []).filter(item => item.is_visible);
  
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return IconComponent || Icons.Circle;
  };

  const handleMenuClick = (item: { id: string; label: string; link?: string }) => {
    // Handle navigation based on menu item
    if (item.link) {
      // External or custom link
      if (item.link.startsWith('http')) {
        window.open(item.link, '_blank');
      } else {
        navigate(item.link);
      }
    } else if (item.label.toLowerCase().includes('início') || item.label.toLowerCase().includes('home')) {
      // Navigate to course home
      navigate(`/minha-conta/produto/${productId}`);
    } else if (item.label.toLowerCase().includes('cursos') || item.label.toLowerCase().includes('courses')) {
      // Navigate to dashboard
      navigate('/minha-conta/dashboard');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/minha-conta');
  };

  const sidebarWidth = isCollapsed ? 64 : 220;

  return (
    <div
      className={cn(
        'relative flex-col h-full border-r transition-all duration-300 flex-shrink-0 hidden lg:flex',
        settings.theme === 'dark' 
          ? 'bg-zinc-900 border-zinc-800' 
          : 'bg-muted/30 border-border',
      )}
      style={{ width: sidebarWidth }}
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={onToggleCollapse}
        className={cn(
          'absolute -right-3 top-6 z-20 w-6 h-6 rounded-full flex items-center justify-center shadow-md border transition-colors',
          settings.theme === 'dark'
            ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300'
            : 'bg-background border-border hover:bg-muted text-muted-foreground'
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Logo Area */}
      <div className={cn(
        'p-4 flex items-center border-b',
        settings.theme === 'dark' ? 'border-zinc-800' : 'border-border',
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
            settings.theme === 'dark' ? 'text-white' : 'text-foreground'
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
          const isActive = item.is_default;
          
          return (
            <div
              key={item.id}
              onClick={() => handleMenuClick(item)}
              className={cn(
                'flex items-center gap-3 rounded-lg transition-all cursor-pointer',
                isCollapsed ? 'flex-col gap-1 p-2 justify-center' : 'p-3',
                settings.theme === 'dark'
                  ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground',
                isActive && 'font-medium',
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
      </nav>

      {/* User Section at Bottom */}
      <div className={cn(
        'border-t p-3',
        settings.theme === 'dark' ? 'border-zinc-800' : 'border-border',
      )}>
        {/* User Info */}
        <div className={cn(
          'flex items-center gap-3 p-2 rounded-lg mb-2',
          isCollapsed && 'justify-center',
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
          {!isCollapsed && (
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
            isCollapsed && 'justify-center',
            settings.theme === 'dark'
              ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm">Sair</span>}
        </div>
      </div>
    </div>
  );
}
