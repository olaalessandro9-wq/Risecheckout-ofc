/**
 * Context Switcher Component
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Dropdown component for switching between producer and buyer contexts.
 * Works with the unified identity architecture.
 * 
 * @module components/layout/ContextSwitcher
 */

import { GraduationCap, LayoutDashboard, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useContextSwitcher } from "@/hooks/useContextSwitcher";

interface ContextSwitcherProps {
  variant?: "default" | "compact";
  showLabel?: boolean;
}

export function ContextSwitcher({ 
  variant = "default",
  showLabel = true,
}: ContextSwitcherProps) {
  const {
    isAuthenticated,
    isSwitching,
    activeRole,
    currentContextName,
    canSwitchToProducer,
    canSwitchToBuyer,
    goToProducerPanel,
    goToStudentPanel,
  } = useContextSwitcher();
  
  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }
  
  // Don't render if user can only access one context
  const canSwitch = canSwitchToProducer || canSwitchToBuyer;
  if (!canSwitch) {
    return null;
  }
  
  const isProducerContext = activeRole && ["owner", "admin", "user", "seller"].includes(activeRole);
  const isBuyerContext = activeRole === "buyer";
  
  const CurrentIcon = isBuyerContext ? GraduationCap : LayoutDashboard;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size={variant === "compact" ? "sm" : "default"}
          className="gap-2"
          disabled={isSwitching}
        >
          {isSwitching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CurrentIcon className="h-4 w-4" />
          )}
          {showLabel && (
            <span className="hidden sm:inline">
              {currentContextName || "Contexto"}
            </span>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        {/* Current context indicator */}
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Você está como: <span className="font-medium">{currentContextName}</span>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Producer option - only show if user can switch AND is not already there */}
        {canSwitchToProducer && isBuyerContext && (
          <DropdownMenuItem 
            onClick={goToProducerPanel}
            disabled={isSwitching}
            className="gap-2 cursor-pointer"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Painel do Produtor</span>
          </DropdownMenuItem>
        )}
        
        {/* Buyer option - only show if user is not already there */}
        {canSwitchToBuyer && isProducerContext && (
          <DropdownMenuItem 
            onClick={goToStudentPanel}
            disabled={isSwitching}
            className="gap-2 cursor-pointer"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Minha Conta (Aluno)</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
