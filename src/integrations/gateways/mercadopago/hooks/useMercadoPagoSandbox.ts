/**
 * useMercadoPagoSandbox Hook
 * 
 * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
 * 
 * Gerencia a lógica de credenciais sandbox (manuais) do Mercado Pago.
 * Usa vault-save para armazenar tokens sensíveis.
 */

import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';

const log = createLogger('UseMercadoPagoSandbox');

interface UseMercadoPagoSandboxProps {
  userId: string | undefined;
  onSuccess: () => void;
}

interface UseMercadoPagoSandboxReturn {
  accessToken: string;
  setAccessToken: (value: string) => void;
  publicKey: string;
  setPublicKey: (value: string) => void;
  showToken: boolean;
  setShowToken: (value: boolean) => void;
  showPublicKey: boolean;
  setShowPublicKey: (value: boolean) => void;
  savingSandbox: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
  handleSaveSandbox: () => Promise<void>;
}

export function useMercadoPagoSandbox({
  userId,
  onSuccess,
}: UseMercadoPagoSandboxProps): UseMercadoPagoSandboxReturn {
  const [accessToken, setAccessToken] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [savingSandbox, setSavingSandbox] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-hide success message
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSaveSandbox = async () => {
    if (!accessToken.trim() || !publicKey.trim()) {
      setMessage({ type: 'error', text: 'Por favor, informe o Access Token e Public Key' });
      return;
    }

    if (!accessToken.startsWith('TEST-') && !accessToken.startsWith('APP_USR-')) {
      setMessage({ type: 'error', text: 'Para sandbox, use credenciais de TESTE (começam com TEST- ou APP_USR-)' });
      return;
    }

    setSavingSandbox(true);
    setMessage(null);

    try {
      if (!userId) throw new Error('Usuário não autenticado');

      const { data: vaultResponse, error: vaultError } = await api.call<{ success?: boolean; error?: string }>('vault-save', {
        vendor_id: userId,
        integration_type: 'MERCADOPAGO',
        credentials: {
          access_token: accessToken,
          public_key: publicKey,
          is_test: true,
          environment: 'sandbox',
        },
      });

      if (vaultError) {
        log.error('Vault save error:', vaultError);
        throw new Error(vaultError.message || 'Erro ao salvar credenciais no Vault');
      }

      if (!vaultResponse?.success) {
        throw new Error(vaultResponse?.error || 'Erro desconhecido ao salvar no Vault');
      }

      setMessage({ type: 'success', text: 'Credenciais de Sandbox salvas com segurança!' });
      toast.success('Credenciais de Sandbox salvas no Vault!');
      setAccessToken('');
      setPublicKey('');
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setMessage({ type: 'error', text: `Erro: ${errorMessage}` });
      toast.error(`Erro: ${errorMessage}`);
    } finally {
      setSavingSandbox(false);
    }
  };

  return {
    accessToken,
    setAccessToken,
    publicKey,
    setPublicKey,
    showToken,
    setShowToken,
    showPublicKey,
    setShowPublicKey,
    savingSandbox,
    message,
    setMessage,
    handleSaveSandbox,
  };
}
