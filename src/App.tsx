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
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { ProducerRoute, BuyerRoute } from "@/components/guards";
import { ThemeProvider } from "@/providers/theme";
import { NavigationGuardProvider } from "@/providers/NavigationGuardProvider";
import { BusyProvider } from "@/components/BusyProvider";
import { HelmetProvider } from "react-helmet-async";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import AppShell from "./layouts/AppShell";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";

// ============================================================================
// ROTAS PÚBLICAS - Lazy Loading (Performance Mobile)
// ============================================================================
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Auth = lazy(() => import("./pages/Auth"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const PublicCheckoutV2 = lazy(() => import("./pages/PublicCheckoutV2"));
const PaymentLinkRedirect = lazy(() => import("./pages/PaymentLinkRedirect"));
const PixPaymentPage = lazy(() => import("./pages/PixPaymentPage"));
const MercadoPagoPayment = lazy(() => import("./pages/MercadoPagoPayment").then(m => ({ default: m.MercadoPagoPayment })));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const OAuthSuccess = lazy(() => import("./pages/OAuthSuccess"));
const SolicitarAfiliacao = lazy(() => import("./pages/SolicitarAfiliacao"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso"));
const GdprRequest = lazy(() => import("./pages/lgpd/GdprRequest"));
const GdprConfirm = lazy(() => import("./pages/lgpd/GdprConfirm"));
const PoliticaDePrivacidade = lazy(() => import("./pages/PoliticaDePrivacidade"));

// NotFound mantém eager (pequeno, fallback universal)
import NotFound from "./pages/NotFound";

// ============================================================================
// ÁREA DE MEMBROS (BUYER) - Lazy Loading
// ============================================================================
const BuyerAuth = lazy(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.BuyerAuth })));
const BuyerCadastro = lazy(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.BuyerCadastro })));
const BuyerRecuperarSenha = lazy(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.BuyerRecuperarSenha })));
const BuyerResetPassword = lazy(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.BuyerResetPassword })));
const BuyerDashboard = lazy(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.BuyerDashboard })));
const BuyerHistory = lazy(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.BuyerHistory })));
const CourseHome = lazy(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.CourseHome })));
const LessonViewer = lazy(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.LessonViewer })));
const SetupAccess = lazy(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.SetupAccess })));

const StudentShell = lazy(() => import("./layouts/StudentShell"));

// ============================================================================
// ROTAS PROTEGIDAS - Lazy Loading (Performance Mobile)
// ============================================================================
const Dashboard = lazy(() => import("@/modules/dashboard").then(m => ({ default: m.Dashboard })));
const Produtos = lazy(() => import("./pages/Produtos"));
const ProductEdit = lazy(() => import("./pages/ProductEdit"));
const CheckoutCustomizer = lazy(() => import("./pages/CheckoutCustomizer"));
const MinhasAfiliacoes = lazy(() => import("./pages/MinhasAfiliacoes"));
const AffiliationDetails = lazy(() => import("./pages/AffiliationDetails"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const Rastreamento = lazy(() => import("./pages/Rastreamento"));
const Webhooks = lazy(() => import("./pages/Webhooks"));
const Ajuda = lazy(() => import("./pages/Ajuda"));
const Perfil = lazy(() => import("./pages/Perfil"));

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
    <ProducerRoute>
      <ThemeProvider>
        <NavigationGuardProvider>
          <AppShell />
        </NavigationGuardProvider>
      </ThemeProvider>
    </ProducerRoute>
  );
}

// ============================================================================
// MEMBERS AREA BUILDER LAYOUT - Full screen com NavigationGuard
// ============================================================================
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
// CHECKOUT CUSTOMIZER LAYOUT - Full screen com NavigationGuard
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
      { path: "/", element: <Suspense fallback={<PageLoader />}><LandingPage /></Suspense> },
      
      // ============================================================
      // ROTAS PÚBLICAS
      // ============================================================
      { path: "/auth", element: <Suspense fallback={<PageLoader />}><Auth /></Suspense> },
      { path: "/cadastro", element: <Suspense fallback={<PageLoader />}><Cadastro /></Suspense> },
      { path: "/recuperar-senha", element: <Suspense fallback={<PageLoader />}><RecuperarSenha /></Suspense> },
      { path: "/redefinir-senha", element: <Suspense fallback={<PageLoader />}><RedefinirSenha /></Suspense> },
      { path: "/c/:slug", element: <Suspense fallback={<PageLoader />}><PaymentLinkRedirect /></Suspense> },
      { path: "/pay/:slug", element: <Suspense fallback={<PageLoader />}><PublicCheckoutV2 /></Suspense> },
      { path: "/pay/pix/:orderId", element: <Suspense fallback={<PageLoader />}><PixPaymentPage /></Suspense> },
      { path: "/pay/mercadopago/:orderId", element: <Suspense fallback={<PageLoader />}><MercadoPagoPayment /></Suspense> },
      { path: "/success/:orderId", element: <Suspense fallback={<PageLoader />}><PaymentSuccessPage /></Suspense> },
      { path: "/preview/success", element: <Suspense fallback={<PageLoader />}><PaymentSuccessPage /></Suspense> },
      { path: "/oauth-success", element: <Suspense fallback={<PageLoader />}><OAuthSuccess /></Suspense> },
      { path: "/afiliar/:product_id", element: <Suspense fallback={<PageLoader />}><SolicitarAfiliacao /></Suspense> },
      { path: "/termos-de-uso", element: <Suspense fallback={<PageLoader />}><TermosDeUso /></Suspense> },

      // ============================================================
      // LGPD - Direito ao Esquecimento e Privacidade
      // ============================================================
      { path: "/lgpd/esquecimento", element: <Suspense fallback={<PageLoader />}><GdprRequest /></Suspense> },
      { path: "/lgpd/confirmar", element: <Suspense fallback={<PageLoader />}><GdprConfirm /></Suspense> },
      { path: "/politica-de-privacidade", element: <Suspense fallback={<PageLoader />}><PoliticaDePrivacidade /></Suspense> },

      // ============================================================
      // ÁREA DE MEMBROS (BUYER) - Rotas Públicas
      // ============================================================
      { path: "/minha-conta", element: <Suspense fallback={<PageLoader />}><BuyerAuth /></Suspense> },
      { path: "/minha-conta/cadastro", element: <Suspense fallback={<PageLoader />}><BuyerCadastro /></Suspense> },
      { path: "/minha-conta/recuperar-senha", element: <Suspense fallback={<PageLoader />}><BuyerRecuperarSenha /></Suspense> },
      { path: "/minha-conta/redefinir-senha", element: <Suspense fallback={<PageLoader />}><BuyerResetPassword /></Suspense> },
      { path: "/minha-conta/setup-acesso", element: <Suspense fallback={<PageLoader />}><SetupAccess /></Suspense> },
      
      // ============================================================
      // ÁREA DE MEMBROS (BUYER) - Com StudentShell Layout
      // ============================================================
      {
        path: "/minha-conta",
        element: (
          <BuyerRoute>
            <Suspense fallback={<PageLoader />}>
              <StudentShell />
            </Suspense>
          </BuyerRoute>
        ),
        children: [
          { path: "dashboard", element: <Suspense fallback={<PageLoader />}><BuyerDashboard /></Suspense> },
          { path: "historico", element: <Suspense fallback={<PageLoader />}><BuyerHistory /></Suspense> },
        ],
      },
      
      // ============================================================
      // ÁREA DE MEMBROS - Netflix-style Course Pages (Full Screen)
      // ============================================================
      { path: "/minha-conta/produto/:productId", element: <BuyerRoute><Suspense fallback={<PageLoader />}><CourseHome /></Suspense></BuyerRoute> },
      { path: "/minha-conta/produto/:productId/aula/:contentId", element: <BuyerRoute><Suspense fallback={<PageLoader />}><LessonViewer /></Suspense></BuyerRoute> },

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
          { index: true, element: <Suspense fallback={<PageLoader />}><Dashboard /></Suspense> },
          { path: "produtos", element: <Suspense fallback={<PageLoader />}><Produtos /></Suspense> },
          { path: "produtos/editar", element: <Suspense fallback={<PageLoader />}><ProductEdit /></Suspense> },
          { path: "marketplace", element: <Suspense fallback={<PageLoader />}><Marketplace /></Suspense> },
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
          { path: "minhas-afiliacoes", element: <Suspense fallback={<PageLoader />}><MinhasAfiliacoes /></Suspense> },
          { path: "minhas-afiliacoes/:affiliationId", element: <Suspense fallback={<PageLoader />}><AffiliationDetails /></Suspense> },
          { path: "financeiro", element: <Suspense fallback={<PageLoader />}><Financeiro /></Suspense> },
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
          { path: "rastreamento", element: <Suspense fallback={<PageLoader />}><Rastreamento /></Suspense> },
          { path: "webhooks", element: <Suspense fallback={<PageLoader />}><Webhooks /></Suspense> },
          { path: "ajuda", element: <Suspense fallback={<PageLoader />}><Ajuda /></Suspense> },
          { path: "perfil", element: <Suspense fallback={<PageLoader />}><Perfil /></Suspense> },
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
