/**
 * MercadoPagoConfig - Configuração do Mercado Pago
 * 
 * DOIS MODOS EXCLUSIVOS:
 * 1. PRODUÇÃO (OAuth) - Conecta via login no Mercado Pago
 * 2. SANDBOX (Credenciais Manuais) - Access Token + Public Key de teste
 * 
 * Apenas um modo pode estar ativo por vez.
 * 
 * @version 2.0.0 - Modos exclusivos Produção/Sandbox
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, ExternalLink, CreditCard, FlaskConical, Rocket, Eye, EyeOff, Info, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// ✅ P0-3: Usar variáveis de ambiente consistentes
const MERCADOPAGO_CLIENT_ID = import.meta.env.VITE_MERCADOPAGO_CLIENT_ID || '2354396684039370';
const MERCADOPAGO_REDIRECT_URI = import.meta.env.VITE_MERCADOPAGO_REDIRECT_URI || '';

if (!MERCADOPAGO_REDIRECT_URI) {
  console.error('[MercadoPago Config] VITE_MERCADOPAGO_REDIRECT_URI não configurado!');
}

type ConnectionMode = 'none' | 'production' | 'sandbox';

export function MercadoPagoConfig({ onOpen, onConnectionChange }: { onOpen?: boolean; onConnectionChange?: () => void }) {
  const { user } = useAuth();
  
  // Estado da conexão
  const [currentMode, setCurrentMode] = useState<ConnectionMode>('none');
  const [integration, setIntegration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado do formulário Sandbox
  const [accessToken, setAccessToken] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [savingSandbox, setSavingSandbox] = useState(false);
  
  // Estado do OAuth
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  
  // Feedback
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Carregar integração quando user estiver disponível
  useEffect(() => {
    if (user?.id) {
      loadIntegration();
    }
  }, [user?.id]);

  // Recarregar quando Sheet abrir
  useEffect(() => {
    if (onOpen && user?.id) {
      loadIntegration();
    }
  }, [onOpen, user?.id]);

  // Listener para OAuth success
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'mercadopago_oauth_success') {
        console.log('[MercadoPago OAuth] Sucesso recebido da janela popup');
        toast.success('Conta do Mercado Pago conectada com sucesso!');
        if (user?.id) {
          loadIntegration();
          // Notificar página pai para atualizar
          if (onConnectionChange) {
            onConnectionChange();
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user?.id]);

  // Auto-hide da mensagem
  useEffect(() => {
    if (message?.type === "success") {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadIntegration = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setIntegration(null);
        setCurrentMode('none');
        return;
      }

      // Usar Edge Function para buscar status
      const { data: response, error } = await supabase.functions.invoke('integration-management', {
        body: {
          action: 'status',
          integration_type: 'MERCADOPAGO',
        },
      });

      if (error) throw error;

      const integrations = response?.integrations || [];
      const mpIntegration = integrations.find((i: any) => i.integration_type === 'MERCADOPAGO');

      if (mpIntegration) {
        const config = mpIntegration.config as any;
        const isTest = config?.is_test ?? false;
        
        // Determinar modo baseado em is_test
        const mode: ConnectionMode = isTest ? 'sandbox' : 'production';
        
        setCurrentMode(mode);
        setIntegration(mpIntegration);
      } else {
        setCurrentMode('none');
        setIntegration(null);
      }
      
      // Notificar página pai sobre mudança de estado
      if (onConnectionChange) {
        onConnectionChange();
      }
    } catch (error) {
      console.error('[MercadoPago Config] Erro ao carregar integração:', error);
      toast.error('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  // ========== OAUTH (PRODUÇÃO) ==========
  
  const handleConnectOAuth = async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setConnectingOAuth(true);

    try {
      // Usar Edge Function para iniciar OAuth (cria state seguro no backend)
      const { data: response, error } = await supabase.functions.invoke('integration-management', {
        body: {
          action: 'init-oauth',
          integration_type: 'MERCADOPAGO',
        },
      });

      if (error || !response?.state) {
        console.error('[MercadoPago OAuth] Erro ao iniciar OAuth:', error || response?.error);
        toast.error('Erro ao iniciar autenticação. Tente novamente.');
        setConnectingOAuth(false);
        return;
      }

      const nonce = response.state;

      // Construir URL de autorização
      const authUrl = new URL('https://auth.mercadopago.com.br/authorization');
      authUrl.searchParams.set('client_id', MERCADOPAGO_CLIENT_ID);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('platform_id', 'mp');
      authUrl.searchParams.set('state', nonce);
      authUrl.searchParams.set('redirect_uri', MERCADOPAGO_REDIRECT_URI);

      // Abrir popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl.toString(),
        'MercadoPago OAuth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
      );

      if (!popup) {
        toast.error('Popup bloqueado! Permita popups para este site.');
        setConnectingOAuth(false);
        return;
      }

      // Monitorar popup
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          setConnectingOAuth(false);
          setTimeout(() => loadIntegration(), 1000);
        }
      }, 500);
    } catch (error) {
      console.error('[MercadoPago OAuth] Erro:', error);
      toast.error('Erro ao iniciar autenticação');
      setConnectingOAuth(false);
    }
  };

  // ========== SANDBOX (CREDENCIAIS MANUAIS) ==========
  
  const handleSaveSandbox = async () => {
    if (!accessToken.trim() || !publicKey.trim()) {
      setMessage({ type: "error", text: "Por favor, informe o Access Token e Public Key" });
      return;
    }

    setSavingSandbox(true);
    setMessage(null);

    try {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Usar Edge Function para salvar credenciais
      const { data: response, error } = await supabase.functions.invoke('integration-management', {
        body: {
          action: 'save-credentials',
          integration_type: 'MERCADOPAGO',
          credentials: {
            access_token: accessToken,
            public_key: publicKey,
            is_test: true, // Sempre true para sandbox
          },
        },
      });

      if (error) throw error;
      if (!response?.success) throw new Error(response?.error || 'Erro ao salvar credenciais');

      setMessage({ type: "success", text: "Credenciais de Sandbox salvas com sucesso!" });
      toast.success("Credenciais de Sandbox salvas!");
      setAccessToken("");
      setPublicKey("");
      loadIntegration();
      
      if (onConnectionChange) {
        onConnectionChange();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      setMessage({ type: "error", text: `Erro: ${message}` });
      toast.error(`Erro: ${message}`);
    } finally {
      setSavingSandbox(false);
    }
  };

  // ========== DESCONECTAR ==========
  
  const handleDisconnect = async () => {
    try {
      if (!integration?.id) return;

      // Usar Edge Function para desconectar
      const { data: response, error } = await supabase.functions.invoke('integration-management', {
        body: {
          action: 'disconnect',
          integration_type: 'MERCADOPAGO',
        },
      });

      if (error) throw error;
      if (!response?.success) throw new Error(response?.error || 'Erro ao desconectar');

      toast.success('Integração desconectada');
      setCurrentMode('none');
      setIntegration(null);
      
      // Recarregar integração para garantir estado atualizado
      await loadIntegration();
      
      if (onConnectionChange) {
        onConnectionChange();
      }
    } catch (error) {
      console.error('[MercadoPago Config] Erro ao desconectar:', error);
      toast.error('Erro ao desconectar conta');
    }
  };

  // ========== RENDER ==========

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Card Principal - Mercado Pago */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                Mercado Pago
              </h3>
              <p className="text-xs" style={{ color: 'var(--subtext)' }}>
                PIX e Cartão de Crédito
              </p>
            </div>
          </div>
          
          {currentMode !== 'none' ? (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              currentMode === 'production' 
                ? 'bg-success/10 border-success/30' 
                : 'bg-warning/10 border-warning/30'
            }`}>
              {currentMode === 'production' ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Produção</span>
                </>
              ) : (
                <>
                  <FlaskConical className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Sandbox</span>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border">
              <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Não Conectado</span>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-4">
          {/* Status atual quando conectado */}
          {currentMode !== 'none' && integration && (
            <div className={`rounded-lg border p-4 ${
              currentMode === 'production' 
                ? 'bg-success/5 border-success/30' 
                : 'bg-warning/5 border-warning/30'
            }`}>
              <div className="flex items-start gap-3">
                {currentMode === 'production' ? (
                  <Rocket className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <FlaskConical className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                )}
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {currentMode === 'production' 
                      ? '🚀 Modo Produção Ativo' 
                      : '🧪 Modo Sandbox Ativo'
                    }
                  </p>
                  <p className="text-xs" style={{ color: 'var(--subtext)' }}>
                    {currentMode === 'production' 
                      ? 'Pagamentos reais sendo processados.' 
                      : 'Pagamentos de teste (não são reais).'
                    }
                  </p>
                  {integration.config?.email && (
                    <p className="text-xs" style={{ color: 'var(--subtext)' }}>
                      <strong>Email:</strong> {integration.config.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Aviso de exclusividade */}
          {currentMode !== 'none' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs" style={{ color: 'var(--subtext)' }}>
                <strong>Apenas um modo pode estar ativo.</strong> Para trocar, desconecte primeiro.
              </p>
            </div>
          )}

          {/* Opção 1: Produção (OAuth) */}
          <div className={`rounded-lg border p-4 transition-all ${
            currentMode === 'none' 
              ? 'border-border hover:border-green-500/50' 
              : currentMode === 'production'
                ? 'border-success/50 bg-success/5'
                : 'border-border opacity-50'
          }`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                <Rocket className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  🚀 Produção (OAuth)
                </h4>
                <p className="text-xs mb-3" style={{ color: 'var(--subtext)' }}>
                  Conecte sua conta real via login seguro.
                </p>
                
                {currentMode === 'none' && (
                  <button
                    onClick={handleConnectOAuth}
                    disabled={connectingOAuth}
                    className="flex items-center gap-2 bg-success hover:bg-success/90 text-white text-sm font-medium py-2 px-3 rounded-lg transition-all disabled:opacity-50"
                  >
                    {connectingOAuth ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Conectando...</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4" />
                        <span>Conectar com Mercado Pago</span>
                      </>
                    )}
                  </button>
                )}
                
                {currentMode === 'sandbox' && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ Desconecte o Sandbox primeiro
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Opção 2: Sandbox (Credenciais Manuais) */}
          <div className={`rounded-lg border p-4 transition-all ${
            currentMode === 'none' 
              ? 'border-border hover:border-yellow-500/50' 
              : currentMode === 'sandbox'
                ? 'border-warning/50 bg-warning/5'
                : 'border-border opacity-50'
          }`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                <FlaskConical className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  🧪 Sandbox (Teste)
                </h4>
                <p className="text-xs mb-3" style={{ color: 'var(--subtext)' }}>
                  Use credenciais de teste para validar a integração.
                </p>
                
                {currentMode === 'production' && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ⚠️ Desconecte a Produção primeiro
                  </p>
                )}
                
                {(currentMode === 'none' || currentMode === 'sandbox') && (
                  <div className="space-y-3 mt-3">
                    {/* Access Token */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                        Access Token (Teste)
                      </label>
                      <div className="relative">
                        <input
                          type={showToken ? "text" : "password"}
                          value={accessToken}
                          onChange={(e) => setAccessToken(e.target.value)}
                          disabled={currentMode === 'sandbox'}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                          placeholder="TEST-... ou APP_USR-..."
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                        >
                          {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Public Key */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                        Public Key (Teste)
                      </label>
                      <div className="relative">
                        <input
                          type={showPublicKey ? "text" : "password"}
                          value={publicKey}
                          onChange={(e) => setPublicKey(e.target.value)}
                          disabled={currentMode === 'sandbox'}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                          placeholder="TEST-... ou APP_USR-..."
                        />
                        <button
                          type="button"
                          onClick={() => setShowPublicKey(!showPublicKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                        >
                          {showPublicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {currentMode === 'none' && (
                      <button
                        onClick={handleSaveSandbox}
                        disabled={savingSandbox || !accessToken || !publicKey}
                        className="flex items-center gap-2 bg-warning hover:bg-warning/90 text-black text-sm font-medium py-2 px-3 rounded-lg transition-all disabled:opacity-50"
                      >
                        {savingSandbox ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Salvando...</span>
                          </>
                        ) : (
                          <>
                            <FlaskConical className="h-4 w-4" />
                            <span>Ativar Sandbox</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mensagem de feedback */}
          {message && (
            <div className={`flex items-start gap-2 p-3 rounded-lg border ${
              message.type === "success"
                ? "bg-success/10 border-success/30"
                : "bg-red-500/10 border-red-500/30"
            }`}>
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
              )}
              <p className="text-xs" style={{ color: 'var(--text)' }}>
                {message.text}
              </p>
            </div>
          )}

          {/* Botão Desconectar */}
          {currentMode !== 'none' && (
            <button
              onClick={handleDisconnect}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 text-sm"
            >
              Desconectar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
