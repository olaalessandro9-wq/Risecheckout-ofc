/**
 * Public Routes Configuration
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Rotas acessíveis sem autenticação:
 * - Auth, checkout público, pagamentos, LGPD, Legal
 * 
 * NOTA: Landing pages arquivadas em 04/02/2026
 * A rota "/" agora redireciona para "/auth"
 */

import { Suspense } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { AuthPageLoader } from "@/components/auth/AuthPageLoader";

// ============================================================================
// LAZY IMPORTS (with auto-retry for network failures)
// ============================================================================
const Auth = lazyWithRetry(() => import("@/pages/Auth"));
const Cadastro = lazyWithRetry(() => import("@/pages/Cadastro"));
const RecuperarSenha = lazyWithRetry(() => import("@/pages/RecuperarSenha"));
const RedefinirSenha = lazyWithRetry(() => import("@/pages/RedefinirSenha"));
const PublicCheckoutV2 = lazyWithRetry(() => import("@/pages/PublicCheckoutV2"));
const PixPaymentPage = lazyWithRetry(() => import("@/pages/PixPaymentPage"));
const MercadoPagoPayment = lazyWithRetry(() => import("@/pages/MercadoPagoPayment").then(m => ({ default: m.MercadoPagoPayment })));
const PaymentSuccessPage = lazyWithRetry(() => import("@/pages/PaymentSuccessPage"));
const OAuthSuccess = lazyWithRetry(() => import("@/pages/OAuthSuccess"));
const SolicitarAfiliacao = lazyWithRetry(() => import("@/pages/SolicitarAfiliacao"));

// Legal Pages
const LegalHub = lazyWithRetry(() => import("@/pages/legal/LegalHub"));
const TermosDeUso = lazyWithRetry(() => import("@/pages/legal/TermosDeUso"));
const TermosDeCompra = lazyWithRetry(() => import("@/pages/legal/TermosDeCompra"));
const PoliticaDePrivacidade = lazyWithRetry(() => import("@/pages/legal/PoliticaDePrivacidade"));
const PoliticaDeCookies = lazyWithRetry(() => import("@/pages/legal/PoliticaDeCookies"));
const PoliticaDeReembolso = lazyWithRetry(() => import("@/pages/legal/PoliticaDeReembolso"));
const PoliticaDePagamentos = lazyWithRetry(() => import("@/pages/legal/PoliticaDePagamentos"));
const PoliticaDeConteudo = lazyWithRetry(() => import("@/pages/legal/PoliticaDeConteudo"));
const PoliticaDeDireitosAutorais = lazyWithRetry(() => import("@/pages/legal/PoliticaDeDireitosAutorais"));

// ============================================================================
// PAGE LOADER (for non-auth pages)
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
  // Root redirect to auth (landing pages archived 04/02/2026)
  { 
    path: "/", 
    element: <Navigate to="/auth" replace /> 
  },
  
  // Auth (use AuthPageLoader to prevent theme flash)
  { 
    path: "/auth", 
    element: <Suspense fallback={<AuthPageLoader />}><Auth /></Suspense> 
  },
  { 
    path: "/cadastro", 
    element: <Suspense fallback={<AuthPageLoader />}><Cadastro /></Suspense> 
  },
  { 
    path: "/recuperar-senha", 
    element: <Suspense fallback={<AuthPageLoader />}><RecuperarSenha /></Suspense> 
  },
  { 
    path: "/redefinir-senha", 
    element: <Suspense fallback={<AuthPageLoader />}><RedefinirSenha /></Suspense> 
  },
  
  // Checkout & Payments
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
  
  // Legal Hub + Individual Pages
  { 
    path: "/legal", 
    element: <Suspense fallback={<PageLoader />}><LegalHub /></Suspense> 
  },
  { 
    path: "/termos-de-uso", 
    element: <Suspense fallback={<PageLoader />}><TermosDeUso /></Suspense> 
  },
  { 
    path: "/termos-de-compra", 
    element: <Suspense fallback={<PageLoader />}><TermosDeCompra /></Suspense> 
  },
  { 
    path: "/politica-de-privacidade", 
    element: <Suspense fallback={<PageLoader />}><PoliticaDePrivacidade /></Suspense> 
  },
  { 
    path: "/politica-de-cookies", 
    element: <Suspense fallback={<PageLoader />}><PoliticaDeCookies /></Suspense> 
  },
  { 
    path: "/politica-de-reembolso", 
    element: <Suspense fallback={<PageLoader />}><PoliticaDeReembolso /></Suspense> 
  },
  { 
    path: "/politica-de-pagamentos", 
    element: <Suspense fallback={<PageLoader />}><PoliticaDePagamentos /></Suspense> 
  },
  { 
    path: "/politica-de-conteudo", 
    element: <Suspense fallback={<PageLoader />}><PoliticaDeConteudo /></Suspense> 
  },
  { 
    path: "/politica-de-direitos-autorais", 
    element: <Suspense fallback={<PageLoader />}><PoliticaDeDireitosAutorais /></Suspense> 
  },
];
