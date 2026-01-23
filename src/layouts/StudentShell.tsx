/**
 * StudentShell - Layout para o painel do aluno
 * Simplificado, focado nos cursos do aluno
 * Inclui dropdown no avatar para trocar entre painéis
 * 
 * RISE V3: Uses useUnifiedAuth (unified identity)
 */

import { Outlet, useNavigate } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  LogOut, 
  ArrowLeftRight,
  Menu,
  X,
  Loader2,
  User
} from "lucide-react";
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

export default function StudentShell() {
  const navigate = useNavigate();
  // RISE V3: useUnifiedAuth em vez de useBuyerAuth + useAuth
  const { user, logout, isProducer, canSwitchToProducer, switchToProducer, isSwitching, isLoggingOut } = useUnifiedAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const handleBackToProducer = async () => {
    // RISE V3: switch-context em vez de navegação simples
    if (canSwitchToProducer) {
      await switchToProducer();
      navigate("/dashboard");
    }
  };

  // Check if user is also a producer (has producer roles)
  const isAlsoProducer = canSwitchToProducer;
  const initials = getInitials(user?.name, user?.email);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo / Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold">Área de Membros</h1>
                <p className="text-xs text-muted-foreground">
                  {user?.name || user?.email}
                </p>
              </div>
            </div>

            {/* User Avatar Dropdown */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    title={user?.name || user?.email || "Aluno"}
                  >
                    {initials}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => navigate("/dashboard/perfil")} 
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Meu Perfil</span>
                  </DropdownMenuItem>
                  
                  {/* Mudar para Painel do Produtor - se também é produtor */}
                  {isAlsoProducer && (
                    <DropdownMenuItem 
                      onClick={handleBackToProducer} 
                      className="cursor-pointer"
                      disabled={isSwitching}
                    >
                      {isSwitching ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowLeftRight className="mr-2 h-4 w-4" />
                      )}
                      <span>Mudar para Painel do Produtor</span>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="cursor-pointer text-destructive focus:text-destructive"
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg">
            <div className="container mx-auto px-4 py-3 space-y-1">
              {isAlsoProducer && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleBackToProducer}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Mudar para Painel do Produtor
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
