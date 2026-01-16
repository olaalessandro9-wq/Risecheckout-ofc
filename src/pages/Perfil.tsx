/**
 * Perfil Page
 * 
 * MIGRATED: Uses Edge Function instead of direct database access
 * @see RISE Protocol V2 - Zero direct database access from frontend
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, User } from "lucide-react";
const SESSION_KEY = "producer_session_token";

// Máscaras
function maskCPF(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return numbers
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function getInitials(name: string | null | undefined): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return "??";
}

export default function Perfil() {
  const { user } = useAuth();
  const sessionToken = localStorage.getItem(SESSION_KEY);
  const queryClient = useQueryClient();
  
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [cpf, setCpf] = useState("");
  const [celular, setCelular] = useState("");
  
  /**
   * Load profile via Edge Function
   * MIGRATED: Uses supabase.functions.invoke instead of supabase.from()
   */
  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile-full", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase.functions.invoke("products-crud", {
        body: {
          action: "get-profile",
        },
        headers: {
          "x-producer-session-token": sessionToken || "",
        },
      });
      
      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      
      return data?.profile || null;
    },
    enabled: !!user?.id && !!sessionToken,
  });
  
  // Preencher formulário quando os dados chegarem
  useEffect(() => {
    if (profile) {
      const nameParts = (profile.name || "").split(" ");
      setNome(nameParts[0] || "");
      setSobrenome(nameParts.slice(1).join(" ") || "");
      setCpf(profile.cpf_cnpj ? maskCPF(profile.cpf_cnpj) : "");
      setCelular(profile.phone ? maskPhone(profile.phone) : "");
    }
  }, [profile]);
  
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      if (!sessionToken) throw new Error("Sessão não encontrada");
      
      const fullName = `${nome.trim()} ${sobrenome.trim()}`.trim();
      const cleanCpf = cpf.replace(/\D/g, "");
      const cleanPhone = celular.replace(/\D/g, "");
      
      const { data, error } = await supabase.functions.invoke(
        "integration-management/update-profile",
        {
          body: {
            sessionToken,
            name: fullName,
            cpf_cnpj: cleanCpf || null,
            phone: cleanPhone || null,
          },
        }
      );
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || "Erro ao atualizar perfil");
      }
    },
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile-full"] });
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    },
  });
  
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(maskCPF(e.target.value));
  };
  
  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCelular(maskPhone(e.target.value));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const initials = getInitials(profile?.name);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Avatar Card */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground text-3xl font-bold mb-4">
              {initials}
            </div>
            <p className="text-lg font-medium text-center">
              {nome} {sobrenome}
            </p>
            <p className="text-sm text-muted-foreground text-center truncate max-w-full">
              {user?.email}
            </p>
          </CardContent>
        </Card>
        
        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sobrenome">Sobrenome</Label>
                  <Input
                    id="sobrenome"
                    value={sobrenome}
                    onChange={(e) => setSobrenome(e.target.value)}
                    placeholder="Seu sobrenome"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted cursor-not-allowed opacity-70"
                />
                <p className="text-xs text-muted-foreground">
                  O e-mail não pode ser alterado
                </p>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="celular">Celular</Label>
                  <Input
                    id="celular"
                    value={celular}
                    onChange={handleCelularChange}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
