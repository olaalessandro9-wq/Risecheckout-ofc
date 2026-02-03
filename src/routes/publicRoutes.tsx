/**
 * Public Routes Configuration
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Rotas acessíveis sem autenticação:
 * - Landing page, auth, checkout público, pagamentos, LGPD
 */

import { Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

// ============================================================================
// LAZY IMPORTS (with auto-retry for network failures)
// ============================================================================
const LandingPage = lazyWithRetry(() => import("@/pages/LandingPage"));
const Auth = lazyWithRetry(() => import("@/pages/Auth"));
const Cadastro = lazyWithRetry(() => import("@/pages/Cadastro"));
const RecuperarSenha = lazyWithRetry(() => import("@/pages/RecuperarSenha"));
const RedefinirSenha = lazyWithRetry(() => import("@/pages/RedefinirSenha"));
const PublicCheckoutV2 = lazyWithRetry(() => import("@/pages/PublicCheckoutV2"));
const PaymentLinkRedirect = lazyWithRetry(() => import("@/pages/PaymentLinkRedirect"));
const PixPaymentPage = lazyWithRetry(() => import("@/pages/PixPaymentPage"));
const MercadoPagoPayment = lazyWithRetry(() => import("@/pages/MercadoPagoPayment").then(m => ({ default: m.MercadoPagoPayment })));
const PaymentSuccessPage = lazyWithRetry(() => import("@/pages/PaymentSuccessPage"));
const OAuthSuccess = lazyWithRetry(() => import("@/pages/OAuthSuccess"));
const SolicitarAfiliacao = lazyWithRetry(() => import("@/pages/SolicitarAfiliacao"));
const TermosDeUso = lazyWithRetry(() => import("@/pages/TermosDeUso"));

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
  // ZERO LATENCY ARCHITECTURE: Both /c/:slug and /pay/:slug use the same component
  // The resolve-universal BFF accepts both checkout_slug and payment_link_slug
  // @see supabase/functions/checkout-public-data/handlers/resolve-universal-handler.ts
  { 
    path: "/c/:slug", 
    element: <Suspense fallback={<PageLoader />}><PublicCheckoutV2 /></Suspense> 
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
