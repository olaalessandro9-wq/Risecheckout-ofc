import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { User, LogOut, ArrowLeftRight, Loader2 } from "lucide-react";
import { useProducerBuyerLink } from "@/hooks/useProducerBuyerLink";
import { useState } from "react";
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { canAccessStudentPanel, goToStudentPanel, isLoading: buyerLinkLoading } = useProducerBuyerLink();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // FIXED: Use name from producer session instead of querying profiles directly
  // This avoids 406 errors due to RLS blocking when auth.uid() is null
  const userName = user?.user_metadata?.name as string | null;
  const initials = getInitials(userName, user?.email);
  
  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };
  
  const handleProfileClick = () => {
    navigate("/dashboard/perfil");
  };

  const handleStudentPanelClick = async () => {
    setIsNavigating(true);
    try {
      await goToStudentPanel();
    } finally {
      setIsNavigating(false);
    }
  };
  
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
          <p className="text-sm text-muted-foreground truncate">
            {user?.email}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Meu Perfil</span>
        </DropdownMenuItem>
        
        {/* Opção para mudar para painel do aluno */}
        {!buyerLinkLoading && canAccessStudentPanel && (
          <DropdownMenuItem 
            onClick={handleStudentPanelClick} 
            className="cursor-pointer"
            disabled={isNavigating}
          >
            {isNavigating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowLeftRight className="mr-2 h-4 w-4" />
            )}
            <span>Mudar para Painel do Aluno</span>
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
