import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, TestTube2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function TestModeConfig() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testModeEnabled, setTestModeEnabled] = useState(false);
  const [testPublicKey, setTestPublicKey] = useState("");
  const [testAccessToken, setTestAccessToken] = useState("");

  useEffect(() => {
    if (user?.id) {
      loadTestModeConfig();
    }
  }, [user?.id]);

  const loadTestModeConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("test_mode_enabled, test_public_key, test_access_token")
        .eq("id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTestModeEnabled(data.test_mode_enabled || false);
        setTestPublicKey(data.test_public_key || "");
        setTestAccessToken(data.test_access_token || "");
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
      toast.error("Erro ao carregar configuração do modo teste");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      console.log('[TestMode] Salvando configuração:', {
        user_id: user?.id,
        testModeEnabled,
        hasPublicKey: !!testPublicKey,
        hasAccessToken: !!testAccessToken
      });

      // Validar se as credenciais foram preenchidas quando modo teste está ativado
      if (testModeEnabled && (!testPublicKey || !testAccessToken)) {
        toast.error("Preencha as credenciais de teste para ativar o modo teste");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          test_mode_enabled: testModeEnabled,
          test_public_key: testModeEnabled ? testPublicKey : null,
          test_access_token: testModeEnabled ? testAccessToken : null,
        })
        .eq("id", user?.id)
        .select();

      console.log('[TestMode] Resultado do update:', { data, error });

      if (error) throw error;

      toast.success("Configuração salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <TestTube2 className="h-5 w-5" />
          Modo Teste - Mercado Pago
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Use suas credenciais de teste do Mercado Pago para fazer testes sem pagamentos reais
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Quando o modo teste estiver ativado, todos os pagamentos
          usarão suas credenciais de teste. Desative antes de ir para produção!
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="test-mode">Ativar Modo Teste</Label>
          <p className="text-sm text-muted-foreground">
            Usar credenciais de teste em vez das credenciais OAuth
          </p>
        </div>
        <Switch
          id="test-mode"
          checked={testModeEnabled}
          onCheckedChange={setTestModeEnabled}
        />
      </div>

      {testModeEnabled && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="test-public-key">Public Key de Teste</Label>
            <Input
              id="test-public-key"
              type="text"
              placeholder="TEST-c2f3f7ab-c3cb-4c74-899a-4aff2f943914"
              value={testPublicKey}
              onChange={(e) => setTestPublicKey(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Encontre em: Mercado Pago → Developers → Credenciais de teste
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-access-token">Access Token de Teste</Label>
            <Input
              id="test-access-token"
              type="password"
              placeholder="TEST-2354396684039370-111909-..."
              value={testAccessToken}
              onChange={(e) => setTestAccessToken(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Mantenha este token seguro e nunca compartilhe publicamente
            </p>
          </div>

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Lembre-se:</strong> Para testar pagamentos, use os{" "}
              <a
                href="https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                cartões de teste do Mercado Pago
              </a>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
}
