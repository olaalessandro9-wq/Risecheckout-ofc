/**
 * BuyerMobileNav - Bottom navigation para mobile na área de membros
 * Versão simplificada do MobileBottomNav (sem funcionalidades de edição)
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import type { MembersAreaBuilderSettings } from '@/modules/members-area-builder/types/builder.types';

interface BuyerMobileNavProps {
  settings: MembersAreaBuilderSettings;
}

export function BuyerMobileNav({ settings }: BuyerMobileNavProps) {
  // Guard: Don't render if mobile menu is disabled
  if (settings.show_menu_mobile === false) {
    return null;
  }

  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  
  const visibleItems = (settings.menu_items ?? []).filter(item => item.is_visible).slice(0, 5);
  
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

  // Don't render if no visible items
  if (visibleItems.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t px-2 py-2 transition-all duration-200 lg:hidden',
        settings.theme === 'dark' 
          ? 'bg-zinc-900 border-zinc-800' 
          : 'bg-background border-border',
      )}
    >
      {visibleItems.map((item) => {
        const IconComponent = getIcon(item.icon);
        const isActive = item.is_default;
        
        return (
          <div
            key={item.id}
            onClick={() => handleMenuClick(item)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
              settings.theme === 'dark'
                ? 'text-zinc-500 hover:text-zinc-300'
                : 'text-muted-foreground hover:text-foreground',
            )}
            style={isActive ? { color: settings.primary_color } : undefined}
          >
            <IconComponent className="h-5 w-5" />
            <span className="text-[10px] truncate max-w-[56px]">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
