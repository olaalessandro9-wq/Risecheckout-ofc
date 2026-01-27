/**
 * Public Routes Configuration
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Rotas acessíveis sem autenticação:
 * - Landing page, auth, checkout público, pagamentos, LGPD
 */

import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";

// ============================================================================
// LAZY IMPORTS
// ============================================================================
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const Auth = lazy(() => import("@/pages/Auth"));
const Cadastro = lazy(() => import("@/pages/Cadastro"));
const RecuperarSenha = lazy(() => import("@/pages/RecuperarSenha"));
const RedefinirSenha = lazy(() => import("@/pages/RedefinirSenha"));
const PublicCheckoutV2 = lazy(() => import("@/pages/PublicCheckoutV2"));
const PaymentLinkRedirect = lazy(() => import("@/pages/PaymentLinkRedirect"));
const PixPaymentPage = lazy(() => import("@/pages/PixPaymentPage"));
const MercadoPagoPayment = lazy(() => import("@/pages/MercadoPagoPayment").then(m => ({ default: m.MercadoPagoPayment })));
const PaymentSuccessPage = lazy(() => import("@/pages/PaymentSuccessPage"));
const OAuthSuccess = lazy(() => import("@/pages/OAuthSuccess"));
const SolicitarAfiliacao = lazy(() => import("@/pages/SolicitarAfiliacao"));
const TermosDeUso = lazy(() => import("@/pages/TermosDeUso"));

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
export const publicRoutes: RouteObject[] = [
  // Landing
  { 
    path: "/", 
    element: <Suspense fallback={<PageLoader />}><LandingPage /></Suspense> 
  },
  
  // Auth
  { 
    path: "/auth", 
    element: <Suspense fallback={<PageLoader />}><Auth /></Suspense> 
  },
  { 
    path: "/cadastro", 
    element: <Suspense fallback={<PageLoader />}><Cadastro /></Suspense> 
  },
  { 
    path: "/recuperar-senha", 
    element: <Suspense fallback={<PageLoader />}><RecuperarSenha /></Suspense> 
  },
  { 
    path: "/redefinir-senha", 
    element: <Suspense fallback={<PageLoader />}><RedefinirSenha /></Suspense> 
  },
  
  // Checkout & Payments
  { 
    path: "/c/:slug", 
    element: <Suspense fallback={<PageLoader />}><PaymentLinkRedirect /></Suspense> 
  },
  { 
    path: "/pay/:slug", 
    element: <Suspense fallback={<PageLoader />}><PublicCheckoutV2 /></Suspense> 
  },
  { 
    path: "/pay/pix/:orderId", 
    element: <Suspense fallback={<PageLoader />}><PixPaymentPage /></Suspense> 
  },
  { 
    path: "/pay/mercadopago/:orderId", 
    element: <Suspense fallback={<PageLoader />}><MercadoPagoPayment /></Suspense> 
  },
  { 
    path: "/success/:orderId", 
    element: <Suspense fallback={<PageLoader />}><PaymentSuccessPage /></Suspense> 
  },
  { 
    path: "/preview/success", 
    element: <Suspense fallback={<PageLoader />}><PaymentSuccessPage /></Suspense> 
  },
  
  // OAuth & Affiliation
  { 
    path: "/oauth-success", 
    element: <Suspense fallback={<PageLoader />}><OAuthSuccess /></Suspense> 
  },
  { 
    path: "/afiliar/:product_id", 
    element: <Suspense fallback={<PageLoader />}><SolicitarAfiliacao /></Suspense> 
  },
  
  // Legal
  { 
    path: "/termos-de-uso", 
    element: <Suspense fallback={<PageLoader />}><TermosDeUso /></Suspense> 
  },
];
