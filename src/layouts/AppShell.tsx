/**
 * AppShell - Layout Principal da Aplicação
 * 
 * Integra Sidebar, Topbar e área de conteúdo principal.
 * Suspense ÚNICO centralizado para todas as rotas filhas.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Layouts Simples + Suspense Centralizado
 */

import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar, useNavigation } from "@/modules/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { useScrollShadow } from "@/hooks/useScrollShadow";
import { cn } from "@/lib/utils";

// ============================================================================
// PAGE LOADER - Componente de loading centralizado
// ============================================================================

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

// ============================================================================
// APP SHELL
// ============================================================================

export default function AppShell() {
  const { sentinelRef, scrolled } = useScrollShadow();
  const navigation = useNavigation();

  // Detectar mobile para remover padding (sidebar é overlay)
  const isMobile =
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

  // Largura efetiva do sidebar
  const effectiveWidth = isMobile ? 0 : navigation.currentWidth;

  const handleNotificationsClick = () => {
    // TODO: Implementar painel de notificações
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar navigation={navigation} />

      {/* Container principal com offset dinâmico - margin-left para GPU compositing */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          "transition-[margin-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        )}
        style={{ marginLeft: `${effectiveWidth}px` }}
      >
        <Topbar
          scrolled={scrolled}
          onNotificationsClick={handleNotificationsClick}
          onMenuClick={() => navigation.setMobileOpen(true)}
          sidebarState={navigation.state.sidebarState}
          onSidebarToggle={navigation.cycleSidebarState}
        />

        {/* Sentinel invisível para ativar a sombra ao rolar */}
        <div ref={sentinelRef} className="h-1 w-full" />

        {/* Suspense ÚNICO para todas as rotas filhas */}
        <main className="relative w-full">
          <div className="px-4 pb-8 pt-4 md:px-6 lg:px-8">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
