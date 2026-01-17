/**
 * Página de Confirmação de Exclusão de Dados (LGPD)
 * 
 * MIGRATED: Uses api.publicCall() instead of supabase.functions.invoke()
 * 
 * Recebe o token de verificação e permite ao usuário
 * confirmar a anonimização permanente de seus dados.
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, AlertTriangle, Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface AnonymizationSummary {
  total_records: number;
  tables_affected: Array<{
    table: string;
    records_affected: number;
    fields_anonymized: string[];
  }>;
}

export default function GdprConfirm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [summary, setSummary] = useState<AnonymizationSummary | null>(null);

  // Verificar se token está presente
  useEffect(() => {
    if (!token) {
      setError("Token de verificação não encontrado. Verifique o link do email.");
    }
  }, [token]);

  const handleConfirm = async () => {
    if (!token) {
      toast.error("Token inválido");
      return;
    }

    if (!confirmed) {
      toast.error("Você precisa confirmar que entende que esta ação é irreversível");
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error: fnError } = await api.publicCall<{ 
        success?: boolean; 
        message?: string; 
        summary?: AnonymizationSummary 
      }>("gdpr-forget", {
        token: token,
        confirm: true,
      });

      if (fnError) {
        throw new Error(fnError.message || "Erro ao processar solicitação");
      }

      if (!data?.success) {
        throw new Error(data?.message || "Falha ao processar anonimização");
      }

      setSummary(data.summary);
      setIsSuccess(true);
      toast.success("Dados anonimizados com sucesso!");

    } catch (err: unknown) {
      console.error("[GdprConfirm] Error:", err);
      const message = err instanceof Error ? err.message : "Erro ao processar solicitação";
      setError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Estado de erro
  if (error && !isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Erro na Verificação</CardTitle>
            <CardDescription className="text-base">
              Não foi possível processar sua solicitação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Falha</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground text-center">
              Se o problema persistir, você pode fazer uma nova solicitação.
            </p>

            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => navigate("/lgpd/esquecimento")}
                className="w-full"
              >
                Fazer Nova Solicitação
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para a página inicial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado de sucesso
  if (isSuccess && summary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Dados Anonimizados!</CardTitle>
            <CardDescription className="text-base">
              Sua solicitação foi processada com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Concluído</AlertTitle>
              <AlertDescription className="text-green-700">
                {summary.total_records} registro(s) foram anonimizados em {summary.tables_affected.filter(t => t.records_affected > 0).length} tabela(s).
              </AlertDescription>
            </Alert>

            {/* Summary Table */}
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Tabela</th>
                    <th className="px-4 py-2 text-center font-medium">Registros</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.tables_affected
                    .filter(t => t.records_affected > 0)
                    .map((table, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{table.table}</td>
                        <td className="px-4 py-2 text-center">{table.records_affected}</td>
                      </tr>
                    ))}
                  {summary.tables_affected.filter(t => t.records_affected > 0).length === 0 && (
                    <tr className="border-t">
                      <td colSpan={2} className="px-4 py-2 text-center text-muted-foreground">
                        Nenhum registro encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Um email de confirmação foi enviado para você.
            </p>

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

  // Estado de confirmação
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Confirmar Exclusão de Dados</CardTitle>
          <CardDescription className="text-base">
            Última etapa para anonimização permanente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>⚠️ ATENÇÃO: Ação Irreversível</AlertTitle>
            <AlertDescription>
              Ao confirmar, todos os seus dados pessoais serão permanentemente 
              anonimizados. Esta ação <strong>NÃO PODE SER DESFEITA</strong>.
            </AlertDescription>
          </Alert>

          {/* What will happen */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">O que acontecerá:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Seu nome será substituído por "Usuário Anonimizado"</li>
              <li>Seu email será substituído por um código aleatório</li>
              <li>Telefone, CPF e documentos serão removidos</li>
              <li>Histórico de navegação será limpo</li>
              <li>Acesso à área de membros será revogado</li>
            </ul>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-3 rounded-lg border p-4 bg-muted/30">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              disabled={isProcessing}
            />
            <Label 
              htmlFor="confirm" 
              className="text-sm leading-relaxed cursor-pointer"
            >
              Eu entendo que esta ação é <strong>irreversível</strong> e que 
              meus dados pessoais serão permanentemente anonimizados, 
              não podendo ser recuperados.
            </Label>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button 
              variant="destructive"
              className="w-full"
              onClick={handleConfirm}
              disabled={!confirmed || isProcessing || !token}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando Anonimização...
                </>
              ) : (
                "Confirmar Exclusão Permanente"
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/")}
              disabled={isProcessing}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancelar e manter meus dados
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
