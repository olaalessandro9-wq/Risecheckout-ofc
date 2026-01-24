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
import { ProducerContextGuard, BuyerContextGuard } from "@/components/guards";
import { ThemeProvider } from "@/providers/theme";
import { NavigationGuardProvider } from "@/providers/NavigationGuardProvider";
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
import Cadastro from "./pages/Cadastro";
import RecuperarSenha from "./pages/RecuperarSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import PublicCheckoutV2 from "./pages/PublicCheckoutV2";
import PaymentLinkRedirect from "./pages/PaymentLinkRedirect";
import PixPaymentPage from "./pages/PixPaymentPage";
import { MercadoPagoPayment } from "./pages/MercadoPagoPayment";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import NotFound from "./pages/NotFound";
import OAuthSuccess from "./pages/OAuthSuccess";
import SolicitarAfiliacao from "./pages/SolicitarAfiliacao";
import TermosDeUso from "./pages/TermosDeUso";
import GdprRequest from "./pages/lgpd/GdprRequest";
import GdprConfirm from "./pages/lgpd/GdprConfirm";
import PoliticaDePrivacidade from "./pages/PoliticaDePrivacidade";

// ============================================================================
// ÁREA DE MEMBROS (BUYER) - From Members Area Module
// ============================================================================
import {
  BuyerAuth,
  BuyerCadastro,
  BuyerRecuperarSenha,
  BuyerResetPassword,
  BuyerDashboard,
  BuyerHistory,
  CourseHome,
  LessonViewer,
  SetupAccess,
} from "@/modules/members-area/pages/buyer";

import StudentShell from "./layouts/StudentShell";

// ============================================================================
// ROTAS PROTEGIDAS - Eager Loading
// ============================================================================
import { Dashboard } from "@/modules/dashboard";
import Produtos from "./pages/Produtos";
import ProductEdit from "./pages/ProductEdit";
import CheckoutCustomizer from "./pages/CheckoutCustomizer";
import MinhasAfiliacoes from "./pages/MinhasAfiliacoes";
import AffiliationDetails from "./pages/AffiliationDetails";
import Marketplace from "./pages/Marketplace";
import Financeiro from "./pages/Financeiro";
import Rastreamento from "./pages/Rastreamento";
import Webhooks from "./pages/Webhooks";
import Ajuda from "./pages/Ajuda";
import Perfil from "./pages/Perfil";

// ============================================================================
// ROTAS SENSÍVEIS - Lazy Loading
// ============================================================================
const AdminHealth = lazy(() => import("./pages/AdminHealth"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Afiliados = lazy(() => import("./pages/Afiliados"));
const OwnerGateways = lazy(() => import("./pages/owner/OwnerGateways"));
const MembersAreaBuilderPage = lazy(() => import("./modules/members-area-builder").then(m => ({ default: m.MembersAreaBuilderPage })));

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
  
  // Lazy Tracking: modo 'capture' salva temporariamente em sessionStorage
  // O checkout faz a persistência final com as configurações do produto
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
// DASHBOARD LAYOUT - Com AppShell e NavigationGuard
// ============================================================================
function DashboardLayout() {
  return (
    <ProtectedRoute>
      <ProducerContextGuard>
        <ThemeProvider>
          <NavigationGuardProvider>
            <AppShell />
          </NavigationGuardProvider>
        </ThemeProvider>
      </ProducerContextGuard>
    </ProtectedRoute>
  );
}

// ============================================================================
// MEMBERS AREA BUILDER LAYOUT - Full screen com NavigationGuard
// ============================================================================
function MembersAreaBuilderLayout() {
  return (
    <ProtectedRoute>
      <ProducerContextGuard>
        <NavigationGuardProvider>
          <Suspense fallback={<PageLoader />}>
            <MembersAreaBuilderPage />
          </Suspense>
        </NavigationGuardProvider>
      </ProducerContextGuard>
    </ProtectedRoute>
  );
}

// ============================================================================
// CHECKOUT CUSTOMIZER LAYOUT - Full screen com NavigationGuard
// ============================================================================
function CheckoutCustomizerLayout() {
  return (
    <ProtectedRoute>
      <ProducerContextGuard>
        <NavigationGuardProvider>
          <CheckoutCustomizer />
        </NavigationGuardProvider>
      </ProducerContextGuard>
    </ProtectedRoute>
  );
}

// ============================================================================
// ROUTER - createBrowserRouter (mantido para compatibilidade)
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
      { path: "/cadastro", element: <Cadastro /> },
      { path: "/recuperar-senha", element: <RecuperarSenha /> },
      { path: "/redefinir-senha", element: <RedefinirSenha /> },
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
      // LGPD - Direito ao Esquecimento e Privacidade
      // ============================================================
      { path: "/lgpd/esquecimento", element: <GdprRequest /> },
      { path: "/lgpd/confirmar", element: <GdprConfirm /> },
      { path: "/politica-de-privacidade", element: <PoliticaDePrivacidade /> },

      // ============================================================
      // ÁREA DE MEMBROS (BUYER) - Rotas Públicas
      // ============================================================
      { path: "/minha-conta", element: <BuyerAuth /> },
      { path: "/minha-conta/cadastro", element: <BuyerCadastro /> },
      { path: "/minha-conta/recuperar-senha", element: <BuyerRecuperarSenha /> },
      { path: "/minha-conta/redefinir-senha", element: <BuyerResetPassword /> },
      { path: "/minha-conta/setup-acesso", element: <SetupAccess /> },
      
      // ============================================================
      // ÁREA DE MEMBROS (BUYER) - Com StudentShell Layout
      // ============================================================
      {
        path: "/minha-conta",
        element: (
          <BuyerContextGuard>
            <StudentShell />
          </BuyerContextGuard>
        ),
        children: [
          { path: "dashboard", element: <BuyerDashboard /> },
          { path: "historico", element: <BuyerHistory /> },
        ],
      },
      
      // ============================================================
      // ÁREA DE MEMBROS - Netflix-style Course Pages (Full Screen)
      // ============================================================
      { path: "/minha-conta/produto/:productId", element: <BuyerContextGuard><CourseHome /></BuyerContextGuard> },
      { path: "/minha-conta/produto/:productId/aula/:contentId", element: <BuyerContextGuard><LessonViewer /></BuyerContextGuard> },

      // ============================================================
      // CHECKOUT BUILDER - Full screen (Protegido com NavigationGuard)
      // ============================================================
      {
        path: "/dashboard/produtos/checkout/personalizar",
        element: <CheckoutCustomizerLayout />,
      },
      
      // ============================================================
      // MEMBERS AREA BUILDER - Full screen (Protegido com NavigationGuard)
      // ============================================================
      {
        path: "/dashboard/produtos/:productId/members-area/builder",
        element: <MembersAreaBuilderLayout />,
      },

      // ============================================================
      // ROTAS PROTEGIDAS - Dashboard com AppShell
      // ============================================================
      {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Dashboard /> },
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
          { path: "rastreamento", element: <Rastreamento /> },
          { path: "webhooks", element: <Webhooks /> },
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
