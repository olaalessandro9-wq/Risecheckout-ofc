import { Outlet, useNavigate } from "react-router-dom";
import { useBuyerAuth } from "@/hooks/useBuyerAuth";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  LogOut, 
  LayoutDashboard, 
  History, 
  ArrowLeft,
  Menu,
  X
} from "lucide-react";

export default function StudentShell() {
  const navigate = useNavigate();
  const { buyer, logout } = useBuyerAuth();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/minha-conta");
  };

  const handleBackToProducer = () => {
    navigate("/dashboard");
  };

  // Check if user is also a producer (has Supabase auth session)
  const isAlsoProducer = !!user;

  const navItems = [
    {
      label: "Meus Cursos",
      icon: GraduationCap,
      path: "/minha-conta/dashboard",
    },
    {
      label: "Histórico",
      icon: History,
      path: "/minha-conta/historico",
    },
  ];

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
                  {buyer?.name || buyer?.email}
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2",
                    window.location.pathname === item.path && "bg-muted"
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isAlsoProducer && (
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex gap-2"
                  onClick={handleBackToProducer}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Painel Produtor
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>

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
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-2",
                    window.location.pathname === item.path && "bg-muted"
                  )}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
              
              {isAlsoProducer && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleBackToProducer}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Painel Produtor
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
