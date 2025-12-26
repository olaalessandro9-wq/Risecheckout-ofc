/**
 * ConfigForm - Formulário de Configuração do Mercado Pago
 * Módulo: src/integrations/gateways/mercadopago
 * 
 * Componente para configurar credenciais do Mercado Pago no painel administrativo.
 * 
 * DOIS MODOS EXCLUSIVOS:
 * 1. PRODUÇÃO (OAuth) - Conecta via login no Mercado Pago
 * 2. TESTE/SANDBOX - Credenciais manuais (Access Token + Public Key)
 * 
 * Apenas um modo pode estar ativo por vez.
 * 
 * @version 2.0.0 - Modos exclusivos Produção/Teste
 */

import { useState, useEffect } from "react";
import { Loader2, Check, AlertCircle, Eye, EyeOff, CheckCircle2, CreditCard, Info, ExternalLink, XCircle, FlaskConical, Rocket } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

// ✅ P0-3: Usar variáveis de ambiente consistentes
const MERCADOPAGO_CLIENT_ID = import.meta.env.VITE_MERCADOPAGO_CLIENT_ID || '2354396684039370';
const MERCADOPAGO_REDIRECT_URI = import.meta.env.VITE_MERCADOPAGO_REDIRECT_URI || '';

/**
 * ✅ P0-2 FIX: Gerar nonce criptograficamente seguro
 */
function generateSecureNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

type ConnectionMode = 'none' | 'production' | 'sandbox';

interface IntegrationData {
  id: string;
  mode: ConnectionMode;
  isTest: boolean;
  email?: string;
  userId?: string;
}

export function ConfigForm({ onConnectionChange }: { onConnectionChange?: () => void }) {
  const { user } = useAuth();
  const { role } = usePermissions();
  
  // Apenas admin pode usar sandbox
  const isAdmin = role === 'admin';
  
  // Estado da conexão
  const [currentMode, setCurrentMode] = useState<ConnectionMode>('none');
  const [integration, setIntegration] = useState<IntegrationData | null>(null);
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

  // Carregar integração
  useEffect(() => {
    if (user?.id) {
      loadIntegration();
    }
  }, [user?.id]);

  // Listener para OAuth success
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'mercadopago_oauth_success') {
        console.log('[ConfigForm] OAuth success recebido');
        toast.success('Conta do Mercado Pago conectada com sucesso!');
        loadIntegration();
        if (onConnectionChange) {
          onConnectionChange();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-hide da mensagem
  useEffect(() => {
    if (message?.type === "success") {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function loadIntegration() {
    try {
      setLoading(true);
      
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('vendor_integrations')
        .select('*')
        .eq('vendor_id', user.id)
        .eq('integration_type', 'MERCADOPAGO')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const config = data.config as any;
        const isTest = config?.is_test ?? false;
        
        // Determinar modo baseado em is_test
        // Se is_test = true → Sandbox (credenciais manuais)
        // Se is_test = false → Produção (OAuth)
        const mode: ConnectionMode = isTest ? 'sandbox' : 'production';
        
        setCurrentMode(mode);
        setIntegration({
          id: data.id,
          mode,
          isTest,
          email: config?.email,
          userId: config?.user_id,
        });
      } else {
        setCurrentMode('none');
        setIntegration(null);
      }
      
      // Notificar mudança de status
      if (onConnectionChange) {
        onConnectionChange();
      }
    } catch (error) {
      console.error('[ConfigForm] Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  }

  // ========== OAUTH (PRODUÇÃO) ==========
  
  async function handleConnectOAuth() {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setConnectingOAuth(true);

    try {
      // Gerar nonce seguro
      const nonce = generateSecureNonce();
      
      // Salvar nonce no banco (usando type assertion para tabela oauth_states)
      const { error: insertError } = await (supabase as any)
        .from('oauth_states')
        .insert({
          state: nonce,
          vendor_id: user.id
        });

      if (insertError) {
        console.error('[ConfigForm] Erro ao salvar state:', insertError);
        toast.error('Erro ao iniciar autenticação. Tente novamente.');
        setConnectingOAuth(false);
        return;
      }

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
      console.error('[ConfigForm] Erro OAuth:', error);
      toast.error('Erro ao iniciar autenticação');
      setConnectingOAuth(false);
    }
  }

  // ========== SANDBOX (CREDENCIAIS MANUAIS) ==========
  
  async function handleSaveSandbox() {
    if (!accessToken.trim() || !publicKey.trim()) {
      setMessage({ type: "error", text: "Por favor, informe o Access Token e Public Key" });
      return;
    }

    // Validar que são credenciais de TESTE
    if (!accessToken.startsWith('TEST-') && !accessToken.startsWith('APP_USR-')) {
      setMessage({ type: "error", text: "Para sandbox, use credenciais de TESTE (começam com TEST- ou APP_USR-)" });
      return;
    }

    setSavingSandbox(true);
    setMessage(null);

    try {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const config = {
        access_token: accessToken,
        public_key: publicKey,
        is_test: true, // Sempre true para sandbox
        environment: 'sandbox' as const, // ✅ FIX: Explicitamente definir ambiente
      };

      // Verificar se já existe
      const { data: existing } = await supabase
        .from('vendor_integrations')
        .select('id')
        .eq('vendor_id', user.id)
        .eq('integration_type', 'MERCADOPAGO')
        .maybeSingle();

      if (existing) {
        // Atualizar
        const { error } = await supabase
          .from('vendor_integrations')
          .update({
            config,
            active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Inserir
        const { error } = await supabase
          .from('vendor_integrations')
          .insert({
            vendor_id: user.id,
            integration_type: 'MERCADOPAGO',
            config,
            active: true,
          });

        if (error) throw error;
      }

      setMessage({ type: "success", text: "Credenciais de Sandbox salvas com sucesso!" });
      toast.success("Credenciais de Sandbox salvas!");
      setAccessToken("");
      setPublicKey("");
      loadIntegration();
      if (onConnectionChange) {
        onConnectionChange();
      }
    } catch (error: any) {
      setMessage({ type: "error", text: `Erro: ${error.message}` });
      toast.error(`Erro: ${error.message}`);
    } finally {
      setSavingSandbox(false);
    }
  }

  // ========== DESCONECTAR ==========
  
  async function handleDisconnect() {
    try {
      if (!integration?.id) return;

      const { error } = await supabase
        .from('vendor_integrations')
        .delete()
        .eq('id', integration.id);

      if (error) throw error;

      toast.success('Integração desconectada');
      setCurrentMode('none');
      setIntegration(null);
      loadIntegration();
      if (onConnectionChange) {
        onConnectionChange();
      }
    } catch (error) {
      console.error('[ConfigForm] Erro ao desconectar:', error);
      toast.error('Erro ao desconectar');
    }
  }

  // ========== RENDER ==========

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-cyan-500/20 rounded-xl p-3">
                <CreditCard className="h-8 w-8 text-cyan-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                  Integração Mercado Pago
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--subtext)' }}>
                  PIX, Cartão de Crédito e Boleto
                </p>
              </div>
            </div>
            {currentMode !== 'none' && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                currentMode === 'production' 
                  ? 'bg-green-500/20 border-green-500/30' 
                  : 'bg-yellow-500/20 border-yellow-500/30'
              }`}>
                <CheckCircle2 className={`h-4 w-4 ${
                  currentMode === 'production' ? 'text-green-500' : 'text-yellow-500'
                }`} />
                <span className={`text-sm font-semibold ${
                  currentMode === 'production' ? 'text-green-500' : 'text-yellow-500'
                }`}>
                  {currentMode === 'production' ? 'PRODUÇÃO' : 'SANDBOX'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Status atual */}
          {currentMode !== 'none' && (
            <div className={`rounded-xl border-2 p-5 mb-6 ${
              currentMode === 'production' 
                ? 'border-green-500/50 bg-green-500/10' 
                : 'border-yellow-500/50 bg-yellow-500/10'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`rounded-lg p-2 ${
                  currentMode === 'production' ? 'bg-green-500/20' : 'bg-yellow-500/20'
                }`}>
                  {currentMode === 'production' ? (
                    <Rocket className={`h-6 w-6 text-green-500`} />
                  ) : (
                    <FlaskConical className={`h-6 w-6 text-yellow-500`} />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>
                    {currentMode === 'production' ? 'Modo Produção Ativo' : 'Modo Sandbox Ativo'}
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--subtext)' }}>
                    {currentMode === 'production' 
                      ? 'Seu checkout está conectado via OAuth e processando pagamentos reais.'
                      : 'Seu checkout está usando credenciais de teste. Pagamentos não são reais.'
                    }
                  </p>
                  {integration?.email && (
                    <p className="text-sm mt-2" style={{ color: 'var(--subtext)' }}>
                      <strong>Email:</strong> {integration.email}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Desconectar
                </button>
              </div>
            </div>
          )}

          {/* Mensagem de exclusividade */}
          {currentMode !== 'none' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm leading-relaxed" style={{ color: 'var(--subtext)' }}>
                <strong>Apenas um modo pode estar ativo por vez.</strong> Para trocar de modo, desconecte a integração atual primeiro.
              </p>
            </div>
          )}

          {/* Cards de opções */}
          <div className="grid gap-4">
            {/* Card Produção (OAuth) */}
            <div className={`rounded-xl border-2 p-5 transition-all ${
              currentMode === 'none' 
                ? 'border-border hover:border-green-500/50 cursor-pointer' 
                : currentMode === 'production'
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-border opacity-50 cursor-not-allowed'
            }`}>
              <div className="flex items-start gap-4">
                <div className="bg-green-500/20 rounded-lg p-2">
                  <Rocket className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>
                    🚀 Produção (OAuth)
                  </h4>
                  <p className="text-sm mb-4" style={{ color: 'var(--subtext)' }}>
                    Conecte sua conta real do Mercado Pago via login seguro. Recomendado para receber pagamentos reais.
                  </p>
                  
                  {currentMode === 'none' && (
                    <button
                      onClick={handleConnectOAuth}
                      disabled={connectingOAuth}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all disabled:opacity-50"
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
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      ⚠️ Desconecte o Sandbox para usar Produção
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Card Sandbox (Credenciais Manuais) - apenas para admin */}
            {isAdmin && (
              <div className={`rounded-xl border-2 p-5 transition-all ${
                currentMode === 'none' 
                  ? 'border-border hover:border-yellow-500/50' 
                  : currentMode === 'sandbox'
                    ? 'border-yellow-500/50 bg-yellow-500/5'
                    : 'border-border opacity-50 cursor-not-allowed'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-500/20 rounded-lg p-2">
                    <FlaskConical className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>
                      🧪 Sandbox (Teste)
                    </h4>
                    <p className="text-sm mb-4" style={{ color: 'var(--subtext)' }}>
                      Use credenciais de teste para validar sua integração. Pagamentos não são processados de verdade.
                    </p>
                    
                    {currentMode === 'production' && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        ⚠️ Desconecte a Produção para usar Sandbox
                      </p>
                    )}
                    
                    {(currentMode === 'none' || currentMode === 'sandbox') && (
                      <div className="space-y-4 mt-4">
                        {/* Access Token */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                            Access Token (Teste)
                          </label>
                          <div className="relative">
                            <input
                              type={showToken ? "text" : "password"}
                              value={accessToken}
                              onChange={(e) => setAccessToken(e.target.value)}
                              disabled={currentMode === 'sandbox'}
                              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                              placeholder="TEST-... ou APP_USR-..."
                            />
                            <button
                              type="button"
                              onClick={() => setShowToken(!showToken)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
                            >
                              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Public Key */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                            Public Key (Teste)
                          </label>
                          <div className="relative">
                            <input
                              type={showPublicKey ? "text" : "password"}
                              value={publicKey}
                              onChange={(e) => setPublicKey(e.target.value)}
                              disabled={currentMode === 'sandbox'}
                              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                              placeholder="TEST-... ou APP_USR-..."
                            />
                            <button
                              type="button"
                              onClick={() => setShowPublicKey(!showPublicKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
                            >
                              {showPublicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {currentMode === 'none' && (
                          <button
                            onClick={handleSaveSandbox}
                            disabled={savingSandbox || !accessToken || !publicKey}
                            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2.5 px-4 rounded-lg transition-all disabled:opacity-50"
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
            )}
          </div>

          {/* Mensagem de feedback */}
          {message && (
            <div className={`flex items-start gap-4 p-4 rounded-xl border-2 mt-6 animate-in fade-in duration-300 ${
              message.type === "success"
                ? "bg-green-500/10 border-green-500/50"
                : "bg-red-500/10 border-red-500/50"
            }`}>
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                {message.text}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
