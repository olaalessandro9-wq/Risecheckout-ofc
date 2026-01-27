/**
 * Builder Routes Configuration
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Rotas de builders full-screen:
 * - Checkout Customizer
 * - Members Area Builder
 */

import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { ProducerRoute } from "@/components/guards";
import { NavigationGuardProvider } from "@/providers/NavigationGuardProvider";

// ============================================================================
// LAZY IMPORTS
// ============================================================================
const CheckoutCustomizer = lazy(() => import("@/pages/CheckoutCustomizer"));
const MembersAreaBuilderPage = lazy(() => import("@/modules/members-area-builder").then(m => ({ default: m.MembersAreaBuilderPage })));

// ============================================================================
// PAGE LOADER
// ============================================================================
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

// ============================================================================
// LAYOUT WRAPPERS
// ============================================================================
function CheckoutCustomizerLayout() {
  return (
    <ProducerRoute>
      <NavigationGuardProvider>
        <Suspense fallback={<PageLoader />}>
          <CheckoutCustomizer />
        </Suspense>
      </NavigationGuardProvider>
    </ProducerRoute>
  );
}

function MembersAreaBuilderLayout() {
  return (
    <ProducerRoute>
      <NavigationGuardProvider>
        <Suspense fallback={<PageLoader />}>
          <MembersAreaBuilderPage />
        </Suspense>
      </NavigationGuardProvider>
    </ProducerRoute>
  );
}

// ============================================================================
// ROUTE DEFINITIONS
// ============================================================================
export const builderRoutes: RouteObject[] = [
  {
    path: "/dashboard/produtos/checkout/personalizar",
    element: <CheckoutCustomizerLayout />,
  },
  {
    path: "/dashboard/produtos/:productId/members-area/builder",
    element: <MembersAreaBuilderLayout />,
  },
];
