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

import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { BuyerRoute } from "@/components/guards";

// ============================================================================
// LAZY IMPORTS
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
const StudentShell = lazy(() => import("@/layouts/StudentShell"));

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
export const buyerRoutes: RouteObject[] = [
  // Rotas públicas de autenticação buyer
  { 
    path: "/minha-conta", 
    element: <Suspense fallback={<PageLoader />}><BuyerAuth /></Suspense> 
  },
  { 
    path: "/minha-conta/cadastro", 
    element: <Suspense fallback={<PageLoader />}><BuyerCadastro /></Suspense> 
  },
  { 
    path: "/minha-conta/recuperar-senha", 
    element: <Suspense fallback={<PageLoader />}><BuyerRecuperarSenha /></Suspense> 
  },
  { 
    path: "/minha-conta/redefinir-senha", 
    element: <Suspense fallback={<PageLoader />}><BuyerResetPassword /></Suspense> 
  },
  { 
    path: "/minha-conta/setup-acesso", 
    element: <Suspense fallback={<PageLoader />}><SetupAccess /></Suspense> 
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
