import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
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
// Estas páginas são carregadas imediatamente pois são acessadas por todos
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
// ROTAS PROTEGIDAS - Eager Loading (Carregamento Imediato)
// ============================================================================
// Páginas principais do dashboard são carregadas imediatamente para navegação instantânea
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

// ============================================================================
// ROTAS SENSÍVEIS - Lazy Loading (Segurança)
// ============================================================================
// Páginas que requerem roles especiais usam lazy loading para segurança
// O código só é baixado quando a rota é acessada
const AdminHealth = lazy(() => import("./pages/AdminHealth"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Afiliados = lazy(() => import("./pages/Afiliados"));

// ============================================================================
// COMPONENTE DE LOADING
// ============================================================================
// Exibido enquanto o código da página está sendo carregado
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

// Componente invisível para rastreamento de afiliados (fallback global)
// Desabilitado em rotas de checkout - PublicCheckoutV2 usa configs do produtor
function AffiliateTracker() {
  const location = useLocation();
  const isCheckoutRoute = location.pathname.startsWith('/pay/');
  
  useAffiliateTracking({ 
    enabled: !isCheckoutRoute // Cede para o checkout com configs específicas
  });
  return null;
}

// QueryClient definido fora do componente - padrão estável
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AppErrorBoundary>
          <BusyProvider>
          <TooltipProvider>
            <BrowserRouter>
              <AffiliateTracker />
              <Toaster />
              <Sonner />
              <Routes>
                {/* ============================================================ */}
                {/* LANDING PAGE - Pública para verificação Stripe */}
                {/* ============================================================ */}
                <Route path="/" element={<LandingPage />} />
                
                {/* ============================================================ */}
                {/* ROTAS PÚBLICAS - Sem sidebar, sem lazy loading */}
                {/* ============================================================ */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/c/:slug" element={<PaymentLinkRedirect />} />
                <Route path="/pay/:slug" element={<PublicCheckoutV2 />} />
                <Route path="/pay/pix/:orderId" element={<PixPaymentPage />} />
                <Route path="/pay/mercadopago/:orderId" element={<MercadoPagoPayment />} />
                <Route path="/success/:orderId" element={<PaymentSuccessPage />} />
                <Route path="/preview/success" element={<PaymentSuccessPage />} />
                <Route path="/oauth-success" element={<OAuthSuccess />} />
                <Route path="/afiliar/:product_id" element={<SolicitarAfiliacao />} />
                <Route path="/termos-de-uso" element={<TermosDeUso />} />

                {/* ============================================================ */}
                {/* CHECKOUT BUILDER - Full screen sem sidebar (Protegido) */}
                {/* ============================================================ */}
                <Route
                  path="/dashboard/produtos/checkout/personalizar"
                  element={
                    <ProtectedRoute>
                      <CheckoutCustomizer />
                    </ProtectedRoute>
                  }
                />

                {/* ============================================================ */}
                {/* ROTAS PROTEGIDAS - Com AppShell (sidebar) e Lazy Loading */}
                {/* ============================================================ */}
                <Route
                  path="/dashboard/*"
                  element={
                    <ProtectedRoute>
                      <ThemeProvider>
                        <AppShell />
                      </ThemeProvider>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Index />} />
                  <Route path="produtos" element={<Produtos />} />
                  <Route path="produtos/editar" element={<ProductEdit />} />
                  <Route path="marketplace" element={<Marketplace />} />
                  {/* Rota sensível: Gerenciamento de Afiliados (requer canHaveAffiliates) */}
                  <Route 
                    path="afiliados" 
                    element={
                      <RoleProtectedRoute 
                        requiredPermission="canHaveAffiliates"
                        showAccessDenied
                      >
                        <Suspense fallback={<PageLoader />}>
                          <Afiliados />
                        </Suspense>
                      </RoleProtectedRoute>
                    } 
                  />
                  <Route path="minhas-afiliacoes" element={<MinhasAfiliacoes />} />
                  <Route path="minhas-afiliacoes/:affiliationId" element={<AffiliationDetails />} />
                  <Route path="financeiro" element={<Financeiro />} />
                  <Route path="integracoes" element={<Integracoes />} />
                  <Route path="ajuda" element={<Ajuda />} />

                  {/* Compat: antiga rota /dashboard/config agora redireciona para /dashboard/admin */}
                  <Route path="config" element={<Navigate to="admin" replace />} />

                  {/* Rota Admin: Painel de Administração (requer admin) */}
                  <Route 
                    path="admin" 
                    element={
                      <RoleProtectedRoute 
                        requiredRole="admin"
                        showAccessDenied
                      >
                        <Suspense fallback={<PageLoader />}>
                          <AdminDashboard />
                        </Suspense>
                      </RoleProtectedRoute>
                    } 
                  />

                  {/* Rota Admin: Health Check (requer admin) */}
                  <Route 
                    path="admin/health" 
                    element={
                      <RoleProtectedRoute 
                        requiredRole="admin"
                        showAccessDenied
                      >
                        <Suspense fallback={<PageLoader />}>
                          <AdminHealth />
                        </Suspense>
                      </RoleProtectedRoute>
                    } 
                  />

                  {/* 404 interno do dashboard (evita tela em branco em rotas desconhecidas) */}
                  <Route path="*" element={<NotFound />} />
                </Route>

                {/* ============================================================ */}
                {/* 404 - Deve ser a última rota */}
                {/* ============================================================ */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </BusyProvider>
      </AppErrorBoundary>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
