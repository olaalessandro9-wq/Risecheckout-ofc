// src/providers/UnsavedChangesGuard.tsx
import { PropsWithChildren } from "react";

/**
 * IMPORTANTE: Este guard está DESABILITADO porque navigation.block 
 * não está disponível com BrowserRouter no React Router v6.
 * 
 * Para habilitar o guard, seria necessário migrar para createBrowserRouter.
 * 
 * Por enquanto, o bloqueio de navegação é feito apenas no botão "Voltar"
 * via handleBack() no ProductEdit.tsx
 */
export function UnsavedChangesGuard({ children }: PropsWithChildren) {
  // Guard desabilitado - navigation.block não disponível com BrowserRouter
  // TODO: Migrar para createBrowserRouter para habilitar bloqueio completo
  
  return <>{children}</>;
}
