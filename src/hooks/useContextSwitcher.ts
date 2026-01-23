/**
 * Context Switcher Hook
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * High-level hook for switching between producer and buyer contexts.
 * Handles navigation and UI state.
 * 
 * Replaces: useProducerBuyerLink
 * 
 * @module hooks/useContextSwitcher
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUnifiedAuth, type AppRole } from "./useUnifiedAuth";
import { createLogger } from "@/lib/logger";
import { toast } from "sonner";

const log = createLogger("useContextSwitcher");

// ============================================================================
// ROUTE MAPPINGS
// ============================================================================

const PRODUCER_DASHBOARD = "/dashboard";
const BUYER_DASHBOARD = "/minha-conta/dashboard";

// ============================================================================
// HOOK
// ============================================================================

export function useContextSwitcher() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isLoading,
    activeRole,
    roles,
    canSwitchToProducer,
    canSwitchToBuyer,
    switchToProducer,
    switchToBuyer,
    switchContext,
    isSwitching,
  } = useUnifiedAuth();
  
  /**
   * Navigate to producer panel, switching context if needed.
   */
  const goToProducerPanel = useCallback(async () => {
    if (!isAuthenticated) {
      log.warn("Cannot switch to producer - not authenticated");
      // Corrected route: /auth instead of /login (which 404s)
      navigate("/auth");
      return;
    }
    
    if (!canSwitchToProducer) {
      log.warn("User does not have producer access");
      toast.error("Você não tem acesso ao painel do produtor");
      return;
    }
    
    try {
      // Only switch if not already in producer context
      const isCurrentlyProducer = activeRole && ["owner", "admin", "user", "seller"].includes(activeRole);
      
      if (!isCurrentlyProducer) {
        log.info("Switching to producer context");
        const result = await switchToProducer();
        
        if (!result.success) {
          toast.error(result.error || "Erro ao trocar para painel do produtor");
          return;
        }
      }
      
      navigate(PRODUCER_DASHBOARD);
    } catch (error) {
      log.error("Error switching to producer", error);
      toast.error("Erro ao acessar painel do produtor");
    }
  }, [isAuthenticated, canSwitchToProducer, activeRole, switchToProducer, navigate]);
  
  /**
   * Navigate to buyer/student panel, switching context if needed.
   * This is THE feature that replaces useProducerBuyerLink.
   */
  const goToStudentPanel = useCallback(async () => {
    if (!isAuthenticated) {
      log.warn("Cannot switch to buyer - not authenticated");
      // Corrected route: /minha-conta instead of /minha-conta/login (which 404s)
      navigate("/minha-conta");
      return;
    }
    
    try {
      // Only switch if not already in buyer context
      if (activeRole !== "buyer") {
        log.info("Switching to buyer context");
        const result = await switchToBuyer();
        
        if (!result.success) {
          toast.error(result.error || "Erro ao trocar para painel do aluno");
          return;
        }
      }
      
      navigate(BUYER_DASHBOARD);
    } catch (error) {
      log.error("Error switching to buyer", error);
      toast.error("Erro ao acessar painel do aluno");
    }
  }, [isAuthenticated, activeRole, switchToBuyer, navigate]);
  
  /**
   * Generic context switch with navigation.
   */
  const switchToRoleAndNavigate = useCallback(async (targetRole: AppRole, targetPath?: string) => {
    if (!isAuthenticated) {
      log.warn("Cannot switch role - not authenticated");
      return;
    }
    
    try {
      if (activeRole !== targetRole) {
        const result = await switchContext(targetRole);
        
        if (!result.success) {
          toast.error(result.error || "Erro ao trocar contexto");
          return;
        }
      }
      
      if (targetPath) {
        navigate(targetPath);
      }
    } catch (error) {
      log.error("Error switching context", error);
      toast.error("Erro ao trocar contexto");
    }
  }, [isAuthenticated, activeRole, switchContext, navigate]);
  
  /**
   * Get the display name for a role.
   */
  const getRoleDisplayName = useCallback((role: AppRole): string => {
    switch (role) {
      case "owner": return "Proprietário";
      case "admin": return "Administrador";
      case "user": return "Produtor";
      case "seller": return "Afiliado";
      case "buyer": return "Aluno";
      default: return role;
    }
  }, []);
  
  /**
   * Get current context display name.
   */
  const currentContextName = activeRole ? getRoleDisplayName(activeRole) : null;
  
  return {
    // State
    isAuthenticated,
    isLoading,
    isSwitching,
    activeRole,
    availableRoles: roles,
    currentContextName,
    
    // Capabilities
    canSwitchToProducer,
    canSwitchToBuyer,
    
    // Actions
    goToProducerPanel,
    goToStudentPanel,
    switchToRoleAndNavigate,
    
    // Utilities
    getRoleDisplayName,
  };
}
