import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBuyerAuth } from "@/hooks/useBuyerAuth";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Save } from "lucide-react";

// Máscaras
const maskPhone = (value: string): string => {
  const cleaned = value.replace(/\D/g, "").slice(0, 11);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
};

const getInitials = (name: string | null | undefined): string => {
  if (!name) return "A";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export default function BuyerProfile() {
  const navigate = useNavigate();
  const { buyer, isAuthenticated, isLoading: authLoading } = useBuyerAuth();
  const queryClient = useQueryClient();

  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/minha-conta");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Buscar dados do perfil do buyer
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["buyer-profile", buyer?.id],
    queryFn: async () => {
      if (!buyer?.id) return null;
      const { data, error } = await supabase
        .from("buyer_profiles")
        .select("name, phone, email")
        .eq("id", buyer.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!buyer?.id,
  });

  // Preencher formulário quando carregar dados
  useEffect(() => {
    if (profile) {
      setNome(profile.name || "");
      setCelular(maskPhone(profile.phone || ""));
    }
  }, [profile]);

  // Mutation para atualizar perfil
  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!buyer?.id) throw new Error("Usuário não autenticado");

      const cleanPhone = celular.replace(/\D/g, "");

      const { error } = await supabase
        .from("buyer_profiles")
        .update({
          name: nome.trim(),
          phone: cleanPhone || null,
        })
        .eq("id", buyer.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyer-profile"] });
      queryClient.invalidateQueries({ queryKey: ["buyer-data"] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate();
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>

      <div className="grid gap-6">
        {/* Card do Avatar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  {getInitials(nome || profile?.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{nome || profile?.name || "Aluno"}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card do Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  value={profile?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O e-mail não pode ser alterado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="celular">Celular</Label>
                <Input
                  id="celular"
                  value={celular}
                  onChange={(e) => setCelular(maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
