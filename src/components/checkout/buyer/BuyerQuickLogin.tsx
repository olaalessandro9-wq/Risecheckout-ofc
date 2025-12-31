/**
 * Componente: BuyerQuickLogin
 * 
 * Barra de login rápido exibida no topo do checkout.
 * Mostra estado de autenticação e permite login/logout.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { User, LogIn, LogOut, ChevronDown, CreditCard, ShoppingBag, Loader2 } from "lucide-react";
import { BuyerAuthModal } from "./BuyerAuthModal";
import type { BuyerSession, SavedCard, OrderHistory } from "@/hooks/checkout/useBuyerAuth";

interface BuyerQuickLoginProps {
  session: BuyerSession;
  isLoading: boolean;
  error: string | null;
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (email: string, password: string, name?: string, phone?: string, document?: string) => Promise<{ success: boolean; error?: string }>;
  onLogout: () => Promise<void>;
  onClearError: () => void;
  savedCards?: SavedCard[];
  onFetchSavedCards?: () => Promise<void>;
  // Callback para preencher formulário com dados do comprador
  onFillForm?: (data: { name?: string; email?: string; phone?: string; maskedDocument?: string }) => void;
}

export function BuyerQuickLogin({
  session,
  isLoading,
  error,
  onLogin,
  onRegister,
  onLogout,
  onClearError,
  savedCards = [],
  onFetchSavedCards,
  onFillForm,
}: BuyerQuickLoginProps) {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Auto-preencher formulário quando autenticado
  const handleFillForm = () => {
    if (session.buyer && onFillForm) {
      onFillForm({
        name: session.buyer.name || undefined,
        email: session.buyer.email,
        phone: session.buyer.phone || undefined,
        maskedDocument: session.maskedDocument || undefined,
      });
    }
  };

  // Se estiver carregando, mostra indicador
  if (isLoading && !session.isAuthenticated) {
    return (
      <div className="flex items-center justify-end py-2 px-4 bg-muted/50 rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Usuário autenticado
  if (session.isAuthenticated && session.buyer) {
    return (
      <div className="flex items-center justify-between py-2 px-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {session.buyer.name || session.buyer.email}
            </span>
            {session.buyer.name && (
              <span className="text-xs text-muted-foreground">{session.buyer.email}</span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <span className="hidden sm:inline">Minha conta</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* Preencher formulário */}
            <DropdownMenuItem onClick={handleFillForm}>
              <User className="mr-2 h-4 w-4" />
              Usar meus dados
            </DropdownMenuItem>
            
            {/* Cartões salvos */}
            {savedCards.length > 0 && (
              <DropdownMenuItem onClick={onFetchSavedCards}>
                <CreditCard className="mr-2 h-4 w-4" />
                Cartões salvos ({savedCards.length})
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            {/* Logout */}
            <DropdownMenuItem 
              onClick={onLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Usuário não autenticado
  return (
    <>
      <div className="flex items-center justify-between py-2 px-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>Já tem conta? Faça login para agilizar</span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setAuthModalOpen(true)}
          className="gap-2"
        >
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Entrar</span>
        </Button>
      </div>

      <BuyerAuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onLogin={onLogin}
        onRegister={onRegister}
        isLoading={isLoading}
        error={error}
        onClearError={onClearError}
      />
    </>
  );
}
