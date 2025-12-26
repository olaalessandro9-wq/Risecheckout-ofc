// src/layouts/AppShell.tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useScrollShadow } from "@/hooks/useScrollShadow";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function AppShell() {
  const { sentinelRef, scrolled } = useScrollShadow();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const handleNotificationsClick = () => {
    console.log("Notificações clicadas");
  };

  // Largura da sidebar: 260px expandida, 64px colapsada
  const sidebarWidth = sidebarExpanded ? 260 : 64;

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen}
        onExpandChange={setSidebarExpanded}
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
