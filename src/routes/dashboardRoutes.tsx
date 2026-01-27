/**
 * Dashboard Routes Configuration
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Rotas do painel de produtor:
 * - Dashboard principal
 * - Produtos, afiliados, financeiro
 * - Configurações e admin
 */

import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { ProducerRoute } from "@/components/guards";
import { MarketplaceRoute } from "@/components/guards/MarketplaceRoute";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { ThemeProvider } from "@/providers/theme";
import { NavigationGuardProvider } from "@/providers/NavigationGuardProvider";
import { UltrawidePerformanceProvider } from "@/contexts/UltrawidePerformanceContext";
import AppShell from "@/layouts/AppShell";
import NotFound from "@/pages/NotFound";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

// ============================================================================
// LAZY IMPORTS (with auto-retry for network failures)
// ============================================================================
const Dashboard = lazyWithRetry(() => import("@/modules/dashboard").then(m => ({ default: m.Dashboard })));
const Produtos = lazyWithRetry(() => import("@/pages/Produtos"));
const ProductEdit = lazyWithRetry(() => import("@/pages/ProductEdit"));
const MinhasAfiliacoes = lazyWithRetry(() => import("@/pages/MinhasAfiliacoes"));
const AffiliationDetails = lazyWithRetry(() => import("@/pages/AffiliationDetails"));
const Marketplace = lazyWithRetry(() => import("@/pages/Marketplace"));
const Financeiro = lazyWithRetry(() => import("@/pages/Financeiro"));
const Rastreamento = lazyWithRetry(() => import("@/pages/Rastreamento"));
const Webhooks = lazyWithRetry(() => import("@/pages/Webhooks"));
const Ajuda = lazyWithRetry(() => import("@/pages/Ajuda"));
const Perfil = lazyWithRetry(() => import("@/pages/Perfil"));

// Admin & Sensitive Routes
const AdminHealth = lazyWithRetry(() => import("@/pages/AdminHealth"));
const AdminDashboard = lazyWithRetry(() => import("@/pages/admin/AdminDashboard"));
const Afiliados = lazyWithRetry(() => import("@/pages/Afiliados"));
const OwnerGateways = lazyWithRetry(() => import("@/pages/owner/OwnerGateways"));

// ============================================================================
// DASHBOARD LAYOUT
// ============================================================================
function DashboardLayout() {
  return (
    <ProducerRoute>
      <ThemeProvider>
        <UltrawidePerformanceProvider>
          <NavigationGuardProvider>
            <AppShell />
          </NavigationGuardProvider>
        </UltrawidePerformanceProvider>
      </ThemeProvider>
    </ProducerRoute>
  );
}

// ============================================================================
// ROUTE DEFINITIONS
// ============================================================================
export const dashboardRoutes: RouteObject[] = [
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      // Suspense centralizado no AppShell
      { index: true, element: <Dashboard /> },
      { path: "produtos", element: <Produtos /> },
      { path: "produtos/editar", element: <ProductEdit /> },
      { 
        path: "marketplace", 
        element: <MarketplaceRoute><Marketplace /></MarketplaceRoute> 
      },
      {
        path: "afiliados",
        element: (
          <RoleProtectedRoute requiredPermission="canHaveAffiliates" showAccessDenied>
            <Afiliados />
          </RoleProtectedRoute>
        ),
      },
      { path: "minhas-afiliacoes", element: <MinhasAfiliacoes /> },
      { path: "minhas-afiliacoes/:affiliationId", element: <AffiliationDetails /> },
      { path: "financeiro", element: <Financeiro /> },
      {
        path: "gateways",
        element: (
          <RoleProtectedRoute requiredRole="owner" showAccessDenied>
            <OwnerGateways />
          </RoleProtectedRoute>
        ),
      },
      { path: "trackeamento", element: <Rastreamento /> },
      { path: "webhooks", element: <Webhooks /> },
      { path: "ajuda", element: <Ajuda /> },
      { path: "perfil", element: <Perfil /> },
      { path: "config", element: <Navigate to="admin" replace /> },
      {
        path: "admin",
        element: (
          <RoleProtectedRoute requiredRole="admin" showAccessDenied>
            <AdminDashboard />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "admin/health",
        element: (
          <RoleProtectedRoute requiredRole="admin" showAccessDenied>
            <AdminHealth />
          </RoleProtectedRoute>
        ),
      },
      { path: "*", element: <NotFound /> },
    ],
  },
];
