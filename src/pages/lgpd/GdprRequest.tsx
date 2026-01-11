/**
 * Página de Solicitação de Direito ao Esquecimento (LGPD)
 * 
 * Permite que usuários solicitem a exclusão de seus dados pessoais
 * conforme previsto na Lei Geral de Proteção de Dados (Art. 18).
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, AlertTriangle, Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function GdprRequest() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Por favor, informe seu email");
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Por favor, informe um email válido");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("gdpr-request", {
        body: { email: email.trim().toLowerCase() }
      });

      if (error) {
        throw new Error(error.message || "Erro ao processar solicitação");
      }

      if (!data?.success) {
        throw new Error(data?.message || "Falha ao processar solicitação");
      }

      setIsSuccess(true);
      toast.success("Solicitação enviada com sucesso!");

    } catch (err: unknown) {
      console.error("[GdprRequest] Error:", err);
      const message = err instanceof Error ? err.message : "Erro ao processar solicitação";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email Enviado!</CardTitle>
            <CardDescription className="text-base">
              Verifique sua caixa de entrada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Enviamos um email de confirmação para <strong>{email}</strong>.
              Clique no link do email para confirmar a exclusão dos seus dados.
            </p>
            
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertTitle>Não recebeu o email?</AlertTitle>
              <AlertDescription>
                Verifique sua pasta de spam ou lixo eletrônico.
                O link expira em 24 horas.
              </AlertDescription>
            </Alert>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Direito ao Esquecimento</CardTitle>
          <CardDescription className="text-base">
            Solicitação de exclusão de dados pessoais (LGPD Art. 18)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Warning Alert */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Atenção: Ação Irreversível</AlertTitle>
              <AlertDescription>
                Ao confirmar, todos os seus dados pessoais serão permanentemente 
                anonimizados e não poderão ser recuperados.
              </AlertDescription>
            </Alert>

            {/* Info about what will happen */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">O que será anonimizado:</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Nome, email e telefone</li>
                <li>CPF/CNPJ e documentos</li>
                <li>Histórico de navegação e IP</li>
                <li>Acesso à área de membros</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-sm">O que será mantido (obrigação legal):</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Registros fiscais por 5 anos (valores e datas)</li>
                <li>Dados de transação anonimizados</li>
              </ul>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Seu email cadastrado</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enviaremos um email de confirmação para este endereço.
              </p>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full"
              variant="destructive"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Solicitar Exclusão de Dados
                </>
              )}
            </Button>

            {/* Back Link */}
            <Button 
              type="button"
              variant="ghost" 
              className="w-full"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancelar e voltar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
