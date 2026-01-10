/**
 * Stripe ConfigForm - Componente de configuração do Stripe Connect
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface StripeStatus {
  connected: boolean;
  account_id: string | null;
  email: string | null;
  livemode: boolean | null;
  connected_at: string | null;
}

export function ConfigForm() {
  const { user } = useAuth();
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkStatus();
    }
  }, [user?.id]);

  // Verificar URL params para callback OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_success') === 'true') {
      toast.success("Stripe conectado com sucesso!");
      checkStatus();
      // Limpar URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('stripe_error')) {
      toast.error(`Erro ao conectar Stripe: ${params.get('stripe_error')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      
      // Usar supabase.functions.invoke com query param via body
      const { data: statusData, error } = await supabase.functions.invoke('stripe-connect-oauth', {
        body: { action: 'status' },
      });

      if (error) {
        console.error('[StripeConfig] Error checking status:', error);
        return;
      }

      setStatus(statusData);
    } catch (error) {
      console.error('[StripeConfig] Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      
      const { data, error } = await supabase.functions.invoke('stripe-connect-oauth', {
        body: { action: 'start' },
      });
      
      if (error) {
        throw new Error(error.message || 'Erro ao iniciar conexão');
      }
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data?.error || 'Erro ao iniciar conexão');
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar sua conta Stripe?')) return;
    
    try {
      setDisconnecting(true);
      
      const { data, error } = await supabase.functions.invoke('stripe-connect-oauth', {
        body: { action: 'disconnect' },
      });
      
      if (error) {
        throw new Error(error.message || 'Erro ao desconectar');
      }
      
      if (data?.success) {
        toast.success("Stripe desconectado com sucesso");
        setStatus({ connected: false, account_id: null, email: null, livemode: null, connected_at: null });
      } else {
        throw new Error(data?.error || 'Erro ao desconectar');
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setDisconnecting(false);
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
    <div className="space-y-6 py-4">
      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Status da Conexão</CardTitle>
            <Button variant="ghost" size="sm" onClick={checkStatus}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {status?.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-600">Conectado</span>
                <Badge variant={status.livemode ? "default" : "secondary"}>
                  {status.livemode ? "Produção" : "Teste"}
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Conta:</strong> {status.account_id}</p>
                {status.email ? (
                  <p><strong>Email:</strong> {status.email}</p>
                ) : (
                  <p><strong>Email:</strong> <span className="text-muted-foreground/60 italic">Não disponível na conta Stripe</span></p>
                )}
                {status.connected_at && (
                  <p><strong>Conectado em:</strong> {new Date(status.connected_at).toLocaleDateString('pt-BR')}</p>
                )}
              </div>

              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Desconectar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <XCircle className="h-5 w-5" />
                <span>Não conectado</span>
              </div>

              <Button onClick={handleConnect} disabled={connecting}>
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Conectar com Stripe
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Sobre o Stripe</CardTitle>
          <CardDescription>
            Aceite pagamentos com cartão de crédito e PIX
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Cartão de crédito com parcelamento</p>
          <p>• PIX instantâneo</p>
          <p>• Split automático de pagamentos</p>
          <p>• Taxa da plataforma: 7,5%</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ConfigForm;
