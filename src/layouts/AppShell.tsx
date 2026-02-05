/**
 * AppShell - Layout Principal da Aplicação (COMPOSITOR-ONLY)
 * 
 * @version RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integra Sidebar, Topbar e área de conteúdo principal.
 * 
 * ## Arquitetura de Performance
 * - FLIP transition para movimento do conteúdo (transform, não margin)
 * - RoutedOutlet memoizado para evitar re-render de rotas
 * - Zero layout-animation (apenas compositor)
 * - Suspense ÚNICO centralizado
 * 
 * @see useFlipTransition para detalhes do motor FLIP
 */

import { Suspense, memo, useRef, useMemo, lazy } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar, useNavigation } from "@/modules/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { useScrollShadow } from "@/hooks/useScrollShadow";
import { useFlipTransition } from "@/hooks/useFlipTransition";
import { useIsLargeViewport } from "@/hooks/useIsLargeViewport";
import { getContentMargin } from "@/modules/navigation/utils/navigationHelpers";
import { cn } from "@/lib/utils";

// ============================================================================
// DEV-ONLY: Performance Overlay (lazy loaded, tree-shaken em produção)
// ============================================================================

const PerfOverlay = import.meta.env.DEV
  ? lazy(() => import("@/devtools/perf/PerfOverlay"))
  : null;

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
// ROUTED OUTLET - Memoizado para evitar re-render por mudança da sidebar
// ============================================================================

/**
 * Outlet memoizado que só re-renderiza quando a rota muda.
 * Isso evita que o toggle da sidebar cause reconciliação de toda a árvore.
 */
const RoutedOutlet = memo(function RoutedOutlet() {
  return <Outlet />;
});

// ============================================================================
// APP SHELL
// ============================================================================

export default function AppShell() {
  const { sentinelRef, scrolled } = useScrollShadow();
  const navigation = useNavigation();
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const isLargeViewport = useIsLargeViewport();

  // Detectar mobile para remover padding (sidebar é overlay)
  const isMobile =
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

  // ========================================
  // DUAL-MODE: Normal vs Large Viewport
  // ========================================
  //
  // Normal (< 1920px):
  //   marginLeft = currentWidth (segue hover via CSS transition)
  //   FLIP = DESABILITADO
  //
  // Large (>= 1920px):
  //   marginLeft = getContentMargin(state) — ignora hover (sidebar overlay)
  //   FLIP = ATIVO (compositor-only, zero reflow)
  // ========================================

  const contentMargin = useMemo(() => {
    if (isMobile) return 0;
    if (isLargeViewport) {
      // Ultrawide: margin ignora hover, sidebar expande "por cima"
      return getContentMargin(navigation.state.sidebarState);
    }
    // Normal: margin segue a largura real incluindo hover
    return navigation.currentWidth;
  }, [isMobile, isLargeViewport, navigation.state.sidebarState, navigation.currentWidth]);

  // FLIP Transition: APENAS em viewports grandes
  // Em monitores normais, CSS transition-[margin-left] cuida da animação
  useFlipTransition(mainContainerRef, contentMargin, {
    duration: 300,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    disabled: !isLargeViewport,
  });

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar navigation={navigation} />

      {/* 
        Container principal com offset dinâmico
        - Normal (< 1920px): CSS transition-[margin-left] para animação suave
        - Large (>= 1920px): FLIP compositor-only (sem CSS transition)
      */}
      <div
        ref={mainContainerRef}
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          // CSS transition APENAS em monitores normais (< 1920px)
          // Em ultrawide, FLIP hook cuida da animação via transform
          !isLargeViewport && "transition-[margin-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        )}
        style={{ marginLeft: `${contentMargin}px` }}
      >
        <Topbar
          scrolled={scrolled}
          onMenuClick={() => navigation.setMobileOpen(true)}
          sidebarState={navigation.state.sidebarState}
          onSidebarToggle={navigation.cycleSidebarState}
          isLargeViewport={isLargeViewport}
        />

        {/* Sentinel invisível para ativar a sombra ao rolar */}
        <div ref={sentinelRef} className="h-1 w-full" />

        {/* Suspense ÚNICO para todas as rotas filhas */}
        <main className="relative w-full">
          <div className="px-4 pb-8 pt-4 md:px-6 lg:px-8">
            <Suspense fallback={<PageLoader />}>
              <RoutedOutlet />
            </Suspense>
          </div>
        </main>
      </div>

      {/* Performance Monitor (DEV only) */}
      {PerfOverlay && (
        <Suspense fallback={null}>
          <PerfOverlay />
        </Suspense>
      )}
    </div>
  );
}
