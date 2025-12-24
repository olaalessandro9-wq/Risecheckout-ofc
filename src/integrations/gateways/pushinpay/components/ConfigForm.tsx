/**
 * ConfigForm - Formulário de Configuração da PushinPay
 * Módulo: src/integrations/gateways/pushinpay
 * 
 * Componente para configurar credenciais da PushinPay no painel administrativo.
 * Permite salvar/atualizar token e selecionar ambiente (sandbox/production).
 * 
 * Extraído de: src/pages/Financeiro.tsx
 */

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, AlertCircle, ChevronDown, Eye, EyeOff, Info } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { toast } from "@/components/ui/sonner";
import { savePushinPaySettings, getPushinPaySettings } from "../api";
import type { PushinPayEnvironment } from "../types";
import { usePermissions } from "@/hooks/usePermissions";

export function ConfigForm() {
  const { role } = usePermissions();
  
  // Apenas admin pode usar sandbox
  const isAdmin = role === 'admin';

  // Estados
  const [apiToken, setApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [environment, setEnvironment] = useState<PushinPayEnvironment>("production");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpdateSectionOpen, setIsUpdateSectionOpen] = useState(false);

  // Carregar configuração existente ao montar
  useEffect(() => {
    loadSettings();
  }, []);

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
    try {
      setLoadingData(true);
      const settings = await getPushinPaySettings();
      
      if (settings) {
        // Token mascarado indica que já existe
        if (settings.pushinpay_token === "••••••••") {
          setHasExistingToken(true);
          setApiToken("");
        } else {
          setApiToken(settings.pushinpay_token ?? "");
        }
        // Se não for admin, forçar produção
        const configEnv = settings.environment ?? "production";
        setEnvironment(isAdmin ? configEnv : "production");
      }
    } catch (error) {
      console.error("[PushinPay ConfigForm] Erro ao carregar configurações:", error);
    } finally {
      setLoadingData(false);
    }
  };

  /**
   * Salva ou atualiza as configurações da PushinPay
   */
  const onSave = async () => {
    // Validação: se não existe token e campo está vazio
    if (!hasExistingToken && !apiToken.trim()) {
      setMessage({ type: "error", text: "Por favor, informe o API Token" });
      return;
    }

    // Validação: se tem token existente e campo vazio
    if (hasExistingToken && !apiToken.trim()) {
      setMessage({ type: "error", text: "Para atualizar, informe um novo token ou mantenha o atual" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await savePushinPaySettings({
        pushinpay_token: apiToken,
        environment,
      });

      if (result.ok) {
        setMessage({ type: "success", text: "Integração PushinPay salva com sucesso!" });
        toast.success("Integração PushinPay salva com sucesso!");
        setHasExistingToken(true);
        setApiToken("");
        setIsUpdateSectionOpen(false);
      } else {
        setMessage({ type: "error", text: `Erro ao salvar: ${result.error}` });
        toast.error(`Erro ao salvar: ${result.error}`);
      }
    } catch (error: any) {
      setMessage({ type: "error", text: `Erro: ${error.message}` });
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
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
        Conecte sua conta PushinPay informando o <strong>API Token</strong>.
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
              : "bg-red-500/10 border-red-500/50"
          }`}
        >
          {message.type === "success" ? (
            <div className="bg-green-500/20 rounded-lg p-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
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
                Token atualizado às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
        {loading && <Loader2 className="h-5 w-5 animate-spin" />}
        {loading ? "Salvando integração..." : "Salvar integração"}
      </button>
    </div>
  );
}
