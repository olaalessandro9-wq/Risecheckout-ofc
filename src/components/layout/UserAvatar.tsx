/**
 * UserAvatar - Avatar do usuário com menu dropdown
 * 
 * RISE V3: Agora usa useContextSwitcher para troca unificada de contexto
 */

import { useNavigate } from "react-router-dom";
import { User, LogOut, ArrowLeftRight, Loader2, GraduationCap, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useContextSwitcher } from "@/hooks/useContextSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name: string | null | undefined, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  
  return "??";
}

export function UserAvatar() {
  const { user, logout } = useUnifiedAuth();
  const navigate = useNavigate();
  const { 
    activeRole, 
    canSwitchToBuyer, 
    canSwitchToProducer,
    goToStudentPanel, 
    goToProducerPanel,
    isSwitching 
  } = useContextSwitcher();
  const [isNavigating, setIsNavigating] = useState(false);
  
  const userName = user?.name;
  const initials = getInitials(userName, user?.email);
  
  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };
  
  const handleProfileClick = () => {
    navigate("/dashboard/perfil");
  };

  const handleSwitchToStudent = async () => {
    setIsNavigating(true);
    try {
      await goToStudentPanel();
    } finally {
      setIsNavigating(false);
    }
  };

  const handleSwitchToProducer = async () => {
    setIsNavigating(true);
    try {
      await goToProducerPanel();
    } finally {
      setIsNavigating(false);
    }
  };

  const isLoading = isNavigating || isSwitching;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          title={userName || user?.email || "Usuário"}
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-2">
            {activeRole === "buyer" ? (
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            ) : (
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">
              {activeRole === "buyer" ? "Modo Aluno" : "Modo Produtor"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate mt-1">
            {user?.email}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Meu Perfil</span>
        </DropdownMenuItem>
        
        {/* Trocar para Painel do Aluno (quando é produtor) */}
        {canSwitchToBuyer && activeRole !== "buyer" && (
          <DropdownMenuItem 
            onClick={handleSwitchToStudent} 
            className="cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GraduationCap className="mr-2 h-4 w-4" />
            )}
            <span>Mudar para Painel do Aluno</span>
          </DropdownMenuItem>
        )}

        {/* Trocar para Painel do Produtor (quando é aluno) */}
        {canSwitchToProducer && activeRole === "buyer" && (
          <DropdownMenuItem 
            onClick={handleSwitchToProducer} 
            className="cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LayoutDashboard className="mr-2 h-4 w-4" />
            )}
            <span>Mudar para Painel do Produtor</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
