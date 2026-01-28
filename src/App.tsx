/**
 * App.tsx - Application Entry Point
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Este arquivo apenas compõe o router a partir de módulos de rotas.
 * Cada módulo de rota é responsável por seu próprio domínio.
 * 
 * @see src/routes/ para definições de rotas modulares
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { BusyProvider } from "@/components/BusyProvider";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import NotFound from "@/pages/NotFound";

// Modular route imports
import {
  publicRoutes,
  lgpdRoutes,
  buyerRoutes,
  dashboardRoutes,
  builderRoutes,
} from "@/routes";

// ============================================================================
// ROOT LAYOUT - Providers + Tracking
// ============================================================================
function RootLayout() {
  const location = useLocation();
  const isCheckoutRoute = location.pathname.startsWith('/pay/');
  
  // Lazy Tracking: modo 'capture' armazena em sessionStorage para persistência no checkout
  useAffiliateTracking({ 
    mode: 'capture',
    enabled: !isCheckoutRoute
  });

  return (
    <>
      <Toaster />
      <Sonner />
      <Outlet />
    </>
  );
}

// ============================================================================
// ROUTER CONFIGURATION
// ============================================================================
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      ...publicRoutes,
      ...lgpdRoutes,
      ...buyerRoutes,
      ...builderRoutes,
      ...dashboardRoutes,
      { path: "*", element: <NotFound /> },
    ],
  },
]);

// ============================================================================
// QUERY CLIENT
// ============================================================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ============================================================================
// APP COMPONENT
// ============================================================================
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AppErrorBoundary>
          <BusyProvider>
            <TooltipProvider>
              <RouterProvider router={router} />
            </TooltipProvider>
          </BusyProvider>
        </AppErrorBoundary>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
