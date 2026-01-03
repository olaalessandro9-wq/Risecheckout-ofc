import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  createBrowserRouter, 
  RouterProvider, 
  Navigate, 
  Outlet,
  useLocation,
} from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { ThemeProvider } from "@/providers/theme";
import { BusyProvider } from "@/components/BusyProvider";
import { HelmetProvider } from "react-helmet-async";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import AppShell from "./layouts/AppShell";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";

// ============================================================================
// ROTAS PÚBLICAS - Carregamento Normal (Eager Loading)
// ============================================================================
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import PublicCheckoutV2 from "./pages/PublicCheckoutV2";
import PaymentLinkRedirect from "./pages/PaymentLinkRedirect";
import PixPaymentPage from "./pages/PixPaymentPage";
import { MercadoPagoPayment } from "./pages/MercadoPagoPayment";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import NotFound from "./pages/NotFound";
import OAuthSuccess from "./pages/OAuthSuccess";
import SolicitarAfiliacao from "./pages/SolicitarAfiliacao";
import TermosDeUso from "./pages/TermosDeUso";

// ============================================================================
// ÁREA DE MEMBROS (BUYER)
// ============================================================================
import BuyerAuth from "./pages/buyer/BuyerAuth";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import BuyerProductContent from "./pages/buyer/BuyerProductContent";

// ============================================================================
// ROTAS PROTEGIDAS - Eager Loading
// ============================================================================
import Index from "./pages/Index";
import Produtos from "./pages/Produtos";
import ProductEdit from "./pages/ProductEdit";
import CheckoutCustomizer from "./pages/CheckoutCustomizer";
import MinhasAfiliacoes from "./pages/MinhasAfiliacoes";
import AffiliationDetails from "./pages/AffiliationDetails";
import Marketplace from "./pages/Marketplace";
import Financeiro from "./pages/Financeiro";
import Integracoes from "./pages/Integracoes";
import Ajuda from "./pages/Ajuda";
import Perfil from "./pages/Perfil";

// ============================================================================
// ROTAS SENSÍVEIS - Lazy Loading
// ============================================================================
const AdminHealth = lazy(() => import("./pages/AdminHealth"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Afiliados = lazy(() => import("./pages/Afiliados"));
const OwnerGateways = lazy(() => import("./pages/owner/OwnerGateways"));

// ============================================================================
// COMPONENTE DE LOADING
// ============================================================================
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

// ============================================================================
// ROOT LAYOUT - Providers + Tracking
// ============================================================================
function RootLayout() {
  const location = useLocation();
  const isCheckoutRoute = location.pathname.startsWith('/pay/');
  
  useAffiliateTracking({ 
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
// DASHBOARD LAYOUT - Com AppShell
// ============================================================================
function DashboardLayout() {
  return (
    <ProtectedRoute>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </ProtectedRoute>
  );
}

// ============================================================================
// ROUTER - createBrowserRouter para suporte a useBlocker
// ============================================================================
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // ============================================================
      // LANDING PAGE
      // ============================================================
      { path: "/", element: <LandingPage /> },
      
      // ============================================================
      // ROTAS PÚBLICAS
      // ============================================================
      { path: "/auth", element: <Auth /> },
      { path: "/c/:slug", element: <PaymentLinkRedirect /> },
      { path: "/pay/:slug", element: <PublicCheckoutV2 /> },
      { path: "/pay/pix/:orderId", element: <PixPaymentPage /> },
      { path: "/pay/mercadopago/:orderId", element: <MercadoPagoPayment /> },
      { path: "/success/:orderId", element: <PaymentSuccessPage /> },
      { path: "/preview/success", element: <PaymentSuccessPage /> },
      { path: "/oauth-success", element: <OAuthSuccess /> },
      { path: "/afiliar/:product_id", element: <SolicitarAfiliacao /> },
      { path: "/termos-de-uso", element: <TermosDeUso /> },

      // ============================================================
      // ÁREA DE MEMBROS (BUYER)
      // ============================================================
      { path: "/minha-conta", element: <BuyerAuth /> },
      { path: "/minha-conta/dashboard", element: <BuyerDashboard /> },
      { path: "/minha-conta/produto/:productId", element: <BuyerProductContent /> },

      // ============================================================
      // CHECKOUT BUILDER - Full screen (Protegido)
      // ============================================================
      {
        path: "/dashboard/produtos/checkout/personalizar",
        element: (
          <ProtectedRoute>
            <CheckoutCustomizer />
          </ProtectedRoute>
        ),
      },

      // ============================================================
      // ROTAS PROTEGIDAS - Dashboard com AppShell
      // ============================================================
      {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Index /> },
          { path: "produtos", element: <Produtos /> },
          { path: "produtos/editar", element: <ProductEdit /> },
          { path: "marketplace", element: <Marketplace /> },
          {
            path: "afiliados",
            element: (
              <RoleProtectedRoute requiredPermission="canHaveAffiliates" showAccessDenied>
                <Suspense fallback={<PageLoader />}>
                  <Afiliados />
                </Suspense>
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
                <Suspense fallback={<PageLoader />}>
                  <OwnerGateways />
                </Suspense>
              </RoleProtectedRoute>
            ),
          },
          { path: "integracoes", element: <Integracoes /> },
          { path: "ajuda", element: <Ajuda /> },
          { path: "perfil", element: <Perfil /> },
          { path: "config", element: <Navigate to="admin" replace /> },
          {
            path: "admin",
            element: (
              <RoleProtectedRoute requiredRole="admin" showAccessDenied>
                <Suspense fallback={<PageLoader />}>
                  <AdminDashboard />
                </Suspense>
              </RoleProtectedRoute>
            ),
          },
          {
            path: "admin/health",
            element: (
              <RoleProtectedRoute requiredRole="admin" showAccessDenied>
                <Suspense fallback={<PageLoader />}>
                  <AdminHealth />
                </Suspense>
              </RoleProtectedRoute>
            ),
          },
          { path: "*", element: <NotFound /> },
        ],
      },

      // ============================================================
      // 404 - Última rota
      // ============================================================
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
