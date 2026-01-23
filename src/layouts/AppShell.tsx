/**
 * AppShell - Layout Principal da Aplicação
 * 
 * Integra Sidebar, Topbar e área de conteúdo principal.
 * Usa o novo sistema de navegação modular.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Layouts Simples
 */

import { Outlet } from "react-router-dom";
import { Sidebar, useNavigation } from "@/modules/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { useScrollShadow } from "@/hooks/useScrollShadow";
import { useDebouncedWidth } from "@/hooks/useDebouncedWidth";
import { cn } from "@/lib/utils";

export default function AppShell() {
  const { sentinelRef, scrolled } = useScrollShadow();
  const navigation = useNavigation();

  // Detectar mobile para remover padding (sidebar é overlay)
  const isMobile =
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

  // Largura efetiva do sidebar
  const effectiveWidth = isMobile ? 0 : navigation.currentWidth;

  // OTIMIZAÇÃO: Debounce para evitar re-renders do ResponsiveContainer
  // durante a animação do sidebar (300ms)
  const debouncedWidth = useDebouncedWidth(effectiveWidth, 350);

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
        style={{
          marginLeft: `${debouncedWidth}px`,
          willChange: 'margin-left',
        }}
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

        <main className="relative w-full">
          <div className="px-4 pb-8 pt-4 md:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
