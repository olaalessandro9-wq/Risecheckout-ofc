// src/layouts/AppShell.tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useScrollShadow } from "@/hooks/useScrollShadow";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { 
  type SidebarState, 
  SIDEBAR_WIDTHS, 
  SIDEBAR_STORAGE_KEY 
} from "@/components/layout/sidebar/types";

export default function AppShell() {
  const { sentinelRef, scrolled } = useScrollShadow();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Estado do sidebar com persistência localStorage
  const [sidebarState, setSidebarState] = useState<SidebarState>(() => {
    if (typeof window === 'undefined') return 'collapsed';
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved === 'hidden' || saved === 'collapsed' || saved === 'expanded') {
      return saved;
    }
    return 'collapsed';
  });

  // Persistir mudanças no localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarState);
  }, [sidebarState]);

  // Ciclo de estados: hidden → collapsed → expanded → hidden
  const cycleSidebarState = useCallback(() => {
    const cycle: Record<SidebarState, SidebarState> = {
      hidden: 'collapsed',
      collapsed: 'expanded',
      expanded: 'hidden',
    };
    setSidebarState(prev => cycle[prev]);
  }, []);

  const handleNotificationsClick = () => {
    console.log("Notificações clicadas");
  };

  // Largura do sidebar baseada no estado
  const sidebarWidth = SIDEBAR_WIDTHS[sidebarState];

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen}
        sidebarState={sidebarState}
        onStateChange={setSidebarState}
      />
      
      {/* Container principal com offset dinâmico */}
      <div 
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          "transition-[padding-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        )}
        style={{
          paddingLeft: `${sidebarWidth}px`,
        }}
      >
        <Topbar 
          scrolled={scrolled} 
          onNotificationsClick={handleNotificationsClick}
          onMenuClick={() => setMobileOpen(true)}
          sidebarState={sidebarState}
          onSidebarToggle={cycleSidebarState}
        />
        {/* Sentinel invisível para ativar a sombra ao rolar */}
        <div ref={sentinelRef} className="h-1 w-full" />
        <main className="relative w-full">
          <div className="px-4 pb-8 pt-4 md:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Overlay em mobile quando sidebar está aberta */}
      <style>{`
        @media (max-width: 767px) {
          .flex.min-w-0 {
            padding-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
