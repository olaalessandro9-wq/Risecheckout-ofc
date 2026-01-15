/**
 * ConfigForm - Formulário de Configuração da PushinPay (Refatorado)
 * 
 * Orquestrador que compõe os sub-componentes do formulário.
 */

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { savePushinPaySettings, getPushinPaySettings } from "../api";
import { supabase } from "@/integrations/supabase/client";
import type { PushinPayEnvironment, PushinPaySettings, PushinPayAccountInfo } from "../types";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";

import { IntegrationStatus } from "./IntegrationStatus";
import { AccountInfoCard } from "./AccountInfoCard";
import { TokenInput } from "./TokenInput";
import { UpdateTokenSection } from "./UpdateTokenSection";
import { EnvironmentSelector } from "./EnvironmentSelector";
import { FeedbackMessage } from "./FeedbackMessage";
import { SaveButton } from "./SaveButton";

export function ConfigForm() {
  const { role } = usePermissions();
  const { user } = useAuth();
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
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadSettings = async () => {
    if (!user?.id) return;
    try {
      setLoadingData(true);
      const settings = await getPushinPaySettings(user.id);
      
      if (settings) {
        if (settings.pushinpay_token === "••••••••") {
          setHasExistingToken(true);
          setApiToken("");
        } else {
          setApiToken(settings.pushinpay_token ?? "");
        }
        setExistingAccountId(settings.pushinpay_account_id ?? null);
        const configEnv = settings.environment ?? "production";
        setEnvironment(isAdmin ? configEnv : "production");
      }
    } catch (error: unknown) {
      console.error("[PushinPay ConfigForm] Erro ao carregar configurações:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const onSave = async () => {
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

      if (tokenToSave) {
        setValidatingToken(true);
        setMessage({ type: "info", text: "Verificando token com a PushinPay..." });
        
        const { data: validationResult, error: validationError } = await supabase.functions.invoke(
          'pushinpay-validate-token',
          { body: { api_token: tokenToSave, environment } }
        );
        
        setValidatingToken(false);
        
        if (validationError || !validationResult?.valid) {
          const errorMsg = validationResult?.error || validationError?.message || "Token inválido ou sem permissão";
          setMessage({ type: "error", text: errorMsg });
          setLoading(false);
          return;
        }
        
        const fetchedAccountInfo = validationResult.account;
        accountIdToSave = fetchedAccountInfo?.id || null;
        setAccountInfo(fetchedAccountInfo);
      }

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
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      setMessage({ type: "error", text: `Erro: ${errorMessage}` });
      toast.error(`Erro: ${errorMessage}`);
    } finally {
      setLoading(false);
      setValidatingToken(false);
    }
  };

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

      <IntegrationStatus isActive={hasExistingToken} accountId={existingAccountId} />
      
      <AccountInfoCard accountInfo={accountInfo} />

      {/* Formulário: Atualizar Token ou Novo Token */}
      {hasExistingToken ? (
        <UpdateTokenSection
          isOpen={isUpdateSectionOpen}
          onOpenChange={setIsUpdateSectionOpen}
          apiToken={apiToken}
          onTokenChange={setApiToken}
          showToken={showToken}
          onToggleShowToken={() => setShowToken(!showToken)}
        />
      ) : (
        <TokenInput
          apiToken={apiToken}
          onTokenChange={setApiToken}
          showToken={showToken}
          onToggleShowToken={() => setShowToken(!showToken)}
        />
      )}

      <EnvironmentSelector
        environment={environment}
        onEnvironmentChange={setEnvironment}
        isAdmin={isAdmin}
      />

      <FeedbackMessage message={message} />

      <SaveButton
        onClick={onSave}
        loading={loading}
        validatingToken={validatingToken}
        disabled={loading || (!hasExistingToken && !apiToken)}
      />
    </div>
  );
}
