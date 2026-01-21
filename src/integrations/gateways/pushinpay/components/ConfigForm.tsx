/**
 * ConfigForm - Formulário de Configuração da PushinPay
 * 
 * @module integrations/gateways/pushinpay/components
 * @version 3.0.0 - RISE Protocol V3 - SSOT Architecture
 * 
 * SSOT (Single Source of Truth):
 * - O estado de conexão vem do FinanceiroContext via prop connectionStatus
 * - Este componente NÃO faz fetch de status inicial - apenas renderiza
 * - Os hooks são usados APENAS para ações (save, validate)
 * 
 * Resultado: Zero piscadas, UI estável
 */

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { savePushinPaySettings } from "../api";
import { api } from "@/lib/api/client";
import type { PushinPayEnvironment, PushinPaySettings, PushinPayAccountInfo } from "../types";
import type { GatewayConfigFormProps, GatewayConnectionStatus } from "@/config/gateways/types";
import { createLogger } from "@/lib/logger";

const log = createLogger("PushinPayConfigForm");

interface ValidateTokenResponse {
  valid: boolean;
  error?: string;
  account?: PushinPayAccountInfo;
}

import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";

import { IntegrationStatus } from "./IntegrationStatus";
import { AccountInfoCard } from "./AccountInfoCard";
import { TokenInput } from "./TokenInput";
import { UpdateTokenSection } from "./UpdateTokenSection";
import { EnvironmentSelector } from "./EnvironmentSelector";
import { FeedbackMessage } from "./FeedbackMessage";
import { SaveButton } from "./SaveButton";

// ============================================================================
// HELPER: Deriva estado do connectionStatus (SSOT)
// ============================================================================

interface DerivedState {
  readonly hasExistingToken: boolean;
  readonly existingAccountId: string | null;
  readonly currentEnvironment: PushinPayEnvironment;
}

function deriveStateFromConnectionStatus(
  connectionStatus: GatewayConnectionStatus | null | undefined,
  isAdmin: boolean
): DerivedState {
  if (!connectionStatus?.connected) {
    return {
      hasExistingToken: false,
      existingAccountId: null,
      currentEnvironment: 'production',
    };
  }

  const env: PushinPayEnvironment = connectionStatus.mode === 'sandbox' ? 'sandbox' : 'production';
  
  // Extrai accountId dos detalhes se disponível
  const details = (connectionStatus as { details?: Record<string, unknown> }).details;
  const accountId = (details?.account_id as string) ?? null;
  
  return {
    hasExistingToken: true,
    existingAccountId: accountId,
    currentEnvironment: isAdmin ? env : 'production',
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ConfigForm({ onConnectionChange, connectionStatus }: GatewayConfigFormProps) {
  const { role } = usePermissions();
  const { user } = useAuth();
  const isAdmin = role === 'admin';

  // Deriva estado inicial do connectionStatus (SSOT)
  const derivedState = deriveStateFromConnectionStatus(connectionStatus, isAdmin);

  // Estados locais apenas para formulário (não para status de conexão)
  const [apiToken, setApiToken] = useState("");
  const [accountInfo, setAccountInfo] = useState<PushinPayAccountInfo | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [environment, setEnvironment] = useState<PushinPayEnvironment>(derivedState.currentEnvironment);
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isUpdateSectionOpen, setIsUpdateSectionOpen] = useState(false);

  // Sincroniza environment quando connectionStatus muda
  useEffect(() => {
    setEnvironment(derivedState.currentEnvironment);
  }, [derivedState.currentEnvironment]);

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

  // Handle refresh - dispara BACKGROUND_REFRESH via Context
  const handleRefresh = () => {
    toast.info('Atualizando status...');
    onConnectionChange?.();
  };

  const onSave = async () => {
    if (!derivedState.hasExistingToken && !apiToken.trim()) {
      setMessage({ type: "error", text: "Por favor, informe o API Token" });
      return;
    }

    const tokenToSave = apiToken.trim() || null;

    setLoading(true);
    setMessage(null);
    setAccountInfo(null);

    try {
      let accountIdToSave = derivedState.existingAccountId;

      if (tokenToSave) {
        setValidatingToken(true);
        setMessage({ type: "info", text: "Verificando token com a PushinPay..." });
        
        const { data: validationResult, error: validationError } = await api.publicCall<ValidateTokenResponse>(
          'pushinpay-validate-token',
          { api_token: tokenToSave, environment }
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
        setAccountInfo(fetchedAccountInfo ?? null);
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
          setApiToken("");
        }
        setIsUpdateSectionOpen(false);
        // Notificar parent para atualizar via SSOT
        onConnectionChange?.();
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

  return (
    <div className="space-y-6 mt-6">
      {/* Header com Refresh */}
      <div className="flex items-center justify-between">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--subtext)' }}>
          Conecte sua conta PushinPay informando apenas o <strong>API Token</strong>. 
          O ID da conta será obtido automaticamente.
          {isAdmin && (
            <> Você pode solicitar acesso ao <em>Sandbox</em> direto no suporte deles.</>
          )}
        </p>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          title="Atualizar status"
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <IntegrationStatus isActive={derivedState.hasExistingToken} accountId={derivedState.existingAccountId} />
      
      <AccountInfoCard accountInfo={accountInfo} />

      {/* Formulário: Atualizar Token ou Novo Token */}
      {derivedState.hasExistingToken ? (
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
        disabled={loading || (!derivedState.hasExistingToken && !apiToken)}
      />
    </div>
  );
}
