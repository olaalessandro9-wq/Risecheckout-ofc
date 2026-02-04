/**
 * Buyer Routes Configuration
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Rotas da Área de Membros (Buyer/Aluno):
 * - Autenticação de buyer
 * - Dashboard do aluno
 * - Visualização de cursos e aulas
 */

import { Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { BuyerRoute } from "@/components/guards";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { AuthPageLoader } from "@/components/auth/AuthPageLoader";

// ============================================================================
// LAZY IMPORTS (with auto-retry for network failures)
// ============================================================================
const BuyerAuth = lazyWithRetry(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.BuyerAuth })));
const BuyerCadastro = lazyWithRetry(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.BuyerCadastro })));
const BuyerRecuperarSenha = lazyWithRetry(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.BuyerRecuperarSenha })));
const BuyerResetPassword = lazyWithRetry(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.BuyerResetPassword })));
const BuyerDashboard = lazyWithRetry(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.BuyerDashboard })));
const BuyerHistory = lazyWithRetry(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.BuyerHistory })));
const CourseHome = lazyWithRetry(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.CourseHome })));
const LessonViewer = lazyWithRetry(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.LessonViewer })));
const SetupAccess = lazyWithRetry(() => import("@/modules/members-area/pages/buyer").then(m => ({ default: m.SetupAccess })));
const StudentShell = lazyWithRetry(() => import("@/layouts/StudentShell"));

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

// Use AuthPageLoader for auth pages to prevent theme flash
// Use PageLoader for protected pages (inside StudentShell)

// ============================================================================
// ROUTE DEFINITIONS
// ============================================================================
export const buyerRoutes: RouteObject[] = [
  // Rotas públicas de autenticação buyer (usam AuthPageLoader para evitar flash de tema)
  { 
    path: "/minha-conta", 
    element: <Suspense fallback={<AuthPageLoader />}><BuyerAuth /></Suspense> 
  },
  { 
    path: "/minha-conta/cadastro", 
    element: <Suspense fallback={<AuthPageLoader />}><BuyerCadastro /></Suspense> 
  },
  { 
    path: "/minha-conta/recuperar-senha", 
    element: <Suspense fallback={<AuthPageLoader />}><BuyerRecuperarSenha /></Suspense> 
  },
  { 
    path: "/minha-conta/redefinir-senha", 
    element: <Suspense fallback={<AuthPageLoader />}><BuyerResetPassword /></Suspense> 
  },
  { 
    path: "/minha-conta/setup-acesso", 
    element: <Suspense fallback={<AuthPageLoader />}><SetupAccess /></Suspense> 
  },
  
  // Rotas protegidas com StudentShell
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
      { 
        path: "dashboard", 
        element: <Suspense fallback={<PageLoader />}><BuyerDashboard /></Suspense> 
      },
      { 
        path: "historico", 
        element: <Suspense fallback={<PageLoader />}><BuyerHistory /></Suspense> 
      },
    ],
  },
  
  // Rotas full-screen de curso (Netflix-style)
  { 
    path: "/minha-conta/produto/:productId", 
    element: (
      <BuyerRoute>
        <Suspense fallback={<PageLoader />}><CourseHome /></Suspense>
      </BuyerRoute>
    ) 
  },
  { 
    path: "/minha-conta/produto/:productId/aula/:contentId", 
    element: (
      <BuyerRoute>
        <Suspense fallback={<PageLoader />}><LessonViewer /></Suspense>
      </BuyerRoute>
    ) 
  },
];
