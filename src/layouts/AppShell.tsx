// src/layouts/AppShell.tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useScrollShadow } from "@/hooks/useScrollShadow";
import { useState } from "react";

export default function AppShell() {
  const { sentinelRef, scrolled } = useScrollShadow();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNotificationsClick = () => {
    // TODO: Implementar lógica de notificações
    console.log("Notificações clicadas");
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex min-w-0 flex-1 flex-col md:ml-[64px]">
        <Topbar 
          scrolled={scrolled} 
          onNotificationsClick={handleNotificationsClick}
          onMenuClick={() => setMobileOpen(true)}
        />
        {/* Sentinel invisível para ativar a sombra ao rolar */}
        <div ref={sentinelRef} className="h-1 w-full" />
        <main className="relative w-full max-w-[1600px] mx-auto px-4 pb-8 pt-4 md:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
