import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const STORAGE_KEY = 'rise_affiliate_ref';
const DEFAULT_COOKIE_DAYS = 30;

// Estrutura de dados para armazenamento com expiração
interface StoredAffiliateData {
  code: string;
  expiresAt: number;
  capturedAt: number;
}

// Função auxiliar para recuperar o código (usada no checkout)
export const getAffiliateCode = (): string | null => {
  if (typeof window === 'undefined') return null;

  // 1. Tenta LocalStorage (Prioridade)
  const localData = localStorage.getItem(STORAGE_KEY);
  if (localData) {
    try {
      const parsed: StoredAffiliateData = JSON.parse(localData);
      
      // Validar expiração
      if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
        return parsed.code;
      }
      
      // Expirado - limpar
      localStorage.removeItem(STORAGE_KEY);
      
    } catch {
      // Formato antigo (string pura) - limpar para forçar novo tracking
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // 2. Tenta Cookie (Fallback)
  const match = document.cookie.match(new RegExp('(^| )' + STORAGE_KEY + '=([^;]+)'));
  if (match) return match[2];

  return null;
};

// Função para limpar código de afiliado manualmente
export const clearAffiliateCode = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${STORAGE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

interface AffiliateTrackingOptions {
  /**
   * Duração do cookie em dias (1-365)
   * @default 30
   */
  cookieDuration?: number;
  
  /**
   * Modelo de atribuição
   * @default 'last_click'
   */
  attributionModel?: 'last_click' | 'first_click';
  
  /**
   * Habilita o tracking. Use false para aguardar dados carregarem.
   * @default true
   */
  enabled?: boolean;
}

// Hook principal para captura e limpeza
export function useAffiliateTracking(options: AffiliateTrackingOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const cookieDays = options.cookieDuration || DEFAULT_COOKIE_DAYS;
  const attributionModel = options.attributionModel || 'last_click';
  const enabled = options.enabled ?? true;

  useEffect(() => {
    // Guard: não executa se desabilitado (aguardando dados)
    if (!enabled) return;
    
    const refCode = searchParams.get('ref');

    if (refCode) {
      // Verificar modelo de atribuição
      const existingCode = getAffiliateCode();
      
      if (existingCode && attributionModel === 'first_click') {
        // Primeiro clique: manter código existente
        console.log(`[Affiliate] Primeiro clique: mantendo código ${existingCode}`);
        
        // Limpa a URL sem atualizar o código
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('ref');
        setSearchParams(newParams, { replace: true });
        return;
      }

      // Último clique (padrão): atualizar código
      // Salva no LocalStorage COM EXPIRAÇÃO
      const expirationTimestamp = Date.now() + (cookieDays * 24 * 60 * 60 * 1000);
      const affiliateData: StoredAffiliateData = {
        code: refCode,
        expiresAt: expirationTimestamp,
        capturedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(affiliateData));

      // Salva no Cookie com duração configurável
      const date = new Date();
      date.setTime(date.getTime() + (cookieDays * 24 * 60 * 60 * 1000));
      document.cookie = `${STORAGE_KEY}=${refCode}; expires=${date.toUTCString()}; path=/; SameSite=Strict; Secure`;

      // Log apenas em ambiente de desenvolvimento
      if (import.meta.env.DEV) {
        console.log(`[Affiliate] Código capturado: ${refCode} (duração: ${cookieDays} dias, modelo: ${attributionModel})`);
      }

      // Limpa a URL removendo o parâmetro ?ref= (Melhor UX)
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('ref');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, cookieDays, attributionModel, enabled]);
}
