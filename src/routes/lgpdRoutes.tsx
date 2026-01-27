/**
 * LGPD Routes Configuration
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Rotas de conformidade LGPD:
 * - Direito ao esquecimento
 * - Política de privacidade
 */

import { Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

// ============================================================================
// LAZY IMPORTS (with auto-retry for network failures)
// ============================================================================
const GdprRequest = lazyWithRetry(() => import("@/pages/lgpd/GdprRequest"));
const GdprConfirm = lazyWithRetry(() => import("@/pages/lgpd/GdprConfirm"));
const PoliticaDePrivacidade = lazyWithRetry(() => import("@/pages/PoliticaDePrivacidade"));

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
// ROUTE DEFINITIONS
// ============================================================================
export const lgpdRoutes: RouteObject[] = [
  { 
    path: "/lgpd/esquecimento", 
    element: <Suspense fallback={<PageLoader />}><GdprRequest /></Suspense> 
  },
  { 
    path: "/lgpd/confirmar", 
    element: <Suspense fallback={<PageLoader />}><GdprConfirm /></Suspense> 
  },
  { 
    path: "/politica-de-privacidade", 
    element: <Suspense fallback={<PageLoader />}><PoliticaDePrivacidade /></Suspense> 
  },
];
