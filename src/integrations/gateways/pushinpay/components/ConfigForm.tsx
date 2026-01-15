/**
 * ConfigForm - Formulário de Configuração da PushinPay
 * Módulo: src/integrations/gateways/pushinpay
 * 
 * Componente para configurar credenciais da PushinPay no painel administrativo.
 * Permite salvar/atualizar token e selecionar ambiente (sandbox/production).
 * O Account ID é obtido automaticamente via API ao validar o token.
 */

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, AlertCircle, ChevronDown, Eye, EyeOff, Info, User } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { toast } from "@/components/ui/sonner";
import { savePushinPaySettings, getPushinPaySettings, fetchPushinPayAccountInfo } from "../api";
import type { PushinPayEnvironment, PushinPaySettings, PushinPayAccountInfo } from "../types";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";

export function ConfigForm() {
  const { role } = usePermissions();
  const { user } = useAuth();
  
  // Apenas admin pode usar sandbox
  const isAdmin = role === 'admin';

  // Estados
  const [apiToken, setApiToken] = useState("");
  const [accountInfo, setAccountInfo] = useState<PushinPayAccountInfo | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [existingAccountId, setExistingAccountId] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<PushinPayEnvironment>("production");
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isUpdateSectionOpen, setIsUpdateSectionOpen] = useState(false);

  // Carregar configuração existente ao montar
  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id]);

  // Forçar produção se não for admin
  useEffect(() => {
    if (!isAdmin && environment === 'sandbox') {
      setEnvironment('production');
    }
  }, [isAdmin, environment]);

  // Auto-hide da mensagem de sucesso após 5 segundos
  useEffect(() => {
    if (message?.type === "success") {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  /**
   * Carrega configurações existentes da PushinPay
   */
  const loadSettings = async () => {
    if (!user?.id) return;
    try {
      setLoadingData(true);
      const settings = await getPushinPaySettings(user.id);
      
      if (settings) {
        // Token mascarado indica que já existe
        if (settings.pushinpay_token === "••••••••") {
          setHasExistingToken(true);
          setApiToken("");
        } else {
          setApiToken(settings.pushinpay_token ?? "");
        }
        // Guardar account_id existente
        setExistingAccountId(settings.pushinpay_account_id ?? null);
        // Se não for admin, forçar produção
        const configEnv = settings.environment ?? "production";
        setEnvironment(isAdmin ? configEnv : "production");
      }
    } catch (error: unknown) {
      console.error("[PushinPay ConfigForm] Erro ao carregar configurações:", error);
    } finally {
      setLoadingData(false);
    }
  };

  /**
   * Salva ou atualiza as configurações da PushinPay
   * Auto-fetch do Account ID ao validar token
   */
  const onSave = async () => {
    // Validação: se não existe token e campo está vazio
    if (!hasExistingToken && !apiToken.trim()) {
      setMessage({ type: "error", text: "Por favor, informe o API Token" });
      return;
    }

    const tokenToSave = apiToken.trim() || null;

    setLoading(true);
    setMessage(null);
    setAccountInfo(null);

    try {
      let accountIdToSave = existingAccountId;

      // Se tem novo token, validar e buscar account_id automaticamente
      if (tokenToSave) {
        setValidatingToken(true);
        setMessage({ type: "info", text: "Verificando token com a PushinPay..." });
        
        const fetchedAccountInfo = await fetchPushinPayAccountInfo(tokenToSave, environment);
        setValidatingToken(false);
        
        if (!fetchedAccountInfo) {
          setMessage({ type: "error", text: "Token inválido ou sem permissão. Verifique se o token está correto e se possui acesso à API." });
          setLoading(false);
          return;
        }
        
        // Usar account_id retornado pela API
        accountIdToSave = fetchedAccountInfo.id;
        setAccountInfo(fetchedAccountInfo);
        
        console.log("[PushinPay] Conta validada:", fetchedAccountInfo.name, "ID:", fetchedAccountInfo.id);
      }

      // Build settings object conditionally
      const settingsToSave: PushinPaySettings = {
        environment,
        pushinpay_account_id: accountIdToSave ?? undefined,
        pushinpay_token: tokenToSave ?? '',
      };

      const result = await savePushinPaySettings(user!.id, settingsToSave);

      if (result.ok) {
        const successMsg = accountInfo 
          ? `Conectado como: ${accountInfo.name}` 
          : "Integração PushinPay salva com sucesso!";
        setMessage({ type: "success", text: successMsg });
        toast.success(successMsg);
        if (tokenToSave) {
          setHasExistingToken(true);
          setApiToken("");
          setExistingAccountId(accountIdToSave);
        }
        setIsUpdateSectionOpen(false);
      } else {
        setMessage({ type: "error", text: `Erro ao salvar: ${result.error}` });
        toast.error(`Erro ao salvar: ${result.error}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      setMessage({ type: "error", text: `Erro: ${message}` });
      toast.error(`Erro: ${message}`);
    } finally {
      setLoading(false);
      setValidatingToken(false);
    }
  };

  // Loading inicial
  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Descrição */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--subtext)' }}>
        Conecte sua conta PushinPay informando apenas o <strong>API Token</strong>. 
        O ID da conta será obtido automaticamente.
        {isAdmin && (
          <> Você pode solicitar acesso ao <em>Sandbox</em> direto no suporte deles.</>
        )}
      </p>

      {/* Badge de Integração Ativa */}
      {hasExistingToken && (
        <div className="rounded-xl border-2 border-green-500/50 bg-green-500/10 p-5">
          <div className="flex items-start gap-4">
            <div className="bg-green-500/20 rounded-lg p-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>
                Integração Ativa
              </h4>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--subtext)' }}>
                Seu checkout está conectado e processando pagamentos PIX via PushinPay.
              </p>
              {existingAccountId && (
                <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                  <User className="h-3.5 w-3.5" />
                  <span>ID da Conta: {existingAccountId.substring(0, 8)}...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conta validada - mostrar após salvar com sucesso */}
      {accountInfo && (
        <div className="rounded-xl border-2 border-blue-500/50 bg-blue-500/10 p-5">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500/20 rounded-lg p-2">
              <User className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>
                {accountInfo.name}
              </h4>
              <p className="text-sm" style={{ color: 'var(--subtext)' }}>
                {accountInfo.email}
              </p>
              <p className="text-xs opacity-60 mt-1">
                ID: {accountInfo.id}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulário: Atualizar Token (Collapsible) ou Novo Token */}
      {hasExistingToken ? (
        <Collapsible open={isUpdateSectionOpen} onOpenChange={setIsUpdateSectionOpen} className="space-y-4">
          <CollapsibleTrigger className="flex items-center gap-3 text-sm font-semibold hover:opacity-80 transition-opacity w-full p-4 rounded-xl bg-accent/50 border border-border">
            <ChevronDown className={`h-5 w-5 transition-transform ${isUpdateSectionOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text)' }} />
            <span style={{ color: 'var(--text)' }}>Atualizar Token</span>
            <span className="text-xs opacity-60 ml-auto" style={{ color: 'var(--subtext)' }}>
              (clique para expandir)
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            <div className="space-y-3">
              <label className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                API Token
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
                >
                  {showToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--subtext)' }}>
                  Token já está configurado e funcionando. Deixe em branco para manter o atual ou informe um novo para atualizar.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
            API Token
          </label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Bearer token da PushinPay"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              {showToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Seleção de Ambiente - apenas para admin */}
      {isAdmin && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Ambiente
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEnvironment("sandbox")}
              className={`p-4 rounded-xl border-2 transition-all ${
                environment === "sandbox"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-border bg-background hover:border-blue-500/50"
              }`}
            >
              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Sandbox
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--subtext)' }}>
                Testes
              </div>
            </button>
            <button
              type="button"
              onClick={() => setEnvironment("production")}
              className={`p-4 rounded-xl border-2 transition-all ${
                environment === "production"
                  ? "border-green-500 bg-green-500/10"
                  : "border-border bg-background hover:border-green-500/50"
              }`}
            >
              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Produção
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--subtext)' }}>
                Pagamentos reais
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Mensagem de Feedback */}
      {message && (
        <div
          className={`flex items-start gap-4 p-5 rounded-xl border-2 animate-in fade-in duration-300 ${
            message.type === "success"
              ? "bg-green-500/10 border-green-500/50"
              : message.type === "info"
              ? "bg-blue-500/10 border-blue-500/50"
              : "bg-red-500/10 border-red-500/50"
          }`}
        >
          {message.type === "success" ? (
            <div className="bg-green-500/20 rounded-lg p-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
          ) : message.type === "info" ? (
            <div className="bg-blue-500/20 rounded-lg p-2">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="bg-red-500/20 rounded-lg p-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
              {message.text}
            </p>
            {message.type === "success" && (
              <p className="text-xs" style={{ color: 'var(--subtext)' }}>
                Configurações salvas às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Botão Salvar */}
      <button
        disabled={loading || (!hasExistingToken && !apiToken)}
        onClick={onSave}
        className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        {validatingToken && <Loader2 className="h-5 w-5 animate-spin" />}
        {loading && !validatingToken && <Loader2 className="h-5 w-5 animate-spin" />}
        {validatingToken ? "Validando token..." : loading ? "Salvando integração..." : "Salvar integração"}
      </button>
    </div>
  );
}
