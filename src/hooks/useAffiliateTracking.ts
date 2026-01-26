import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// ============================================================================
// CONSTANTES
// ============================================================================
const STORAGE_KEY = 'rise_affiliate_ref';
const SESSION_STORAGE_KEY = 'rise_affiliate_pending';
const DEFAULT_COOKIE_DAYS = 30;

// ============================================================================
// INTERFACES
// ============================================================================

/** Dados persistidos no localStorage (com expiração) */
interface StoredAffiliateData {
  code: string;
  expiresAt: number;
  capturedAt: number;
}

/** Dados temporários no sessionStorage (sem expiração) */
interface PendingAffiliateData {
  code: string;
  capturedAt: number;
  sourceUrl: string;
}

interface AffiliateTrackingOptions {
  /**
   * Modo de operação do hook
   * - 'capture': Captura temporária em sessionStorage (usado em páginas não-checkout)
   * - 'persist': Persiste no localStorage com expiração (usado no checkout)
   * @default 'persist'
   */
  mode?: 'capture' | 'persist';
  
  /**
   * Duração do cookie em dias (1-365)
   * Só é usado no modo 'persist'
   * @default 30
   */
  cookieDuration?: number;
  
  /**
   * Modelo de atribuição
   * Só é usado no modo 'persist'
   * @default 'last_click'
   */
  attributionModel?: 'last_click' | 'first_click';
  
  /**
   * Habilita o tracking. Use false para aguardar dados carregarem.
   * @default true
   */
  enabled?: boolean;
}

// ============================================================================
// FUNÇÕES DE LEITURA
// ============================================================================

/**
 * Recupera o código de afiliado persistido (localStorage ou cookie)
 * Usada no momento da criação do pedido
 */
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

/**
 * Recupera código de afiliado pendente (sessionStorage)
 * Usado pelo checkout para verificar se há código aguardando persistência
 */
export const getPendingAffiliateCode = (): PendingAffiliateData | null => {
  if (typeof window === 'undefined') return null;

  const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionData) return null;

  try {
    return JSON.parse(sessionData) as PendingAffiliateData;
  } catch {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

// ============================================================================
// FUNÇÕES DE ESCRITA
// ============================================================================

/**
 * Limpa código de afiliado (localStorage + cookie)
 */
export const clearAffiliateCode = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${STORAGE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

/**
 * Limpa código de afiliado pendente (sessionStorage)
 */
export const clearPendingAffiliateCode = (): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
};

/**
 * Armazena código no sessionStorage para persistência posterior no checkout
 * Chamada pelo modo 'capture' (páginas não-checkout)
 */
const savePendingAffiliateCode = (code: string): void => {
  if (typeof window === 'undefined') return;

  const pendingData: PendingAffiliateData = {
    code,
    capturedAt: Date.now(),
    sourceUrl: window.location.href,
  };

  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(pendingData));
};

/**
 * Persiste código no localStorage com expiração
 * Chamada pelo modo 'persist' (checkout)
 */
export const persistAffiliateCode = (
  code: string,
  options: { cookieDuration: number; attributionModel: 'last_click' | 'first_click' }
): boolean => {
  if (typeof window === 'undefined') return false;

  const { cookieDuration, attributionModel } = options;

  // Verificar modelo de atribuição
  const existingCode = getAffiliateCode();
  
  if (existingCode && attributionModel === 'first_click') {
    clearPendingAffiliateCode();
    return false;
  }

  // Salva no LocalStorage COM EXPIRAÇÃO
  const expirationTimestamp = Date.now() + (cookieDuration * 24 * 60 * 60 * 1000);
  const affiliateData: StoredAffiliateData = {
    code,
    expiresAt: expirationTimestamp,
    capturedAt: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(affiliateData));

  // Salva no Cookie com duração configurável (fallback)
  const date = new Date();
  date.setTime(date.getTime() + (cookieDuration * 24 * 60 * 60 * 1000));
  document.cookie = `${STORAGE_KEY}=${code}; expires=${date.toUTCString()}; path=/; SameSite=Strict; Secure`;

  // Limpa sessionStorage após persistência
  clearPendingAffiliateCode();

  return true;
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook para tracking de afiliados com Lazy Loading
 * 
 * Modo 'capture' (App.tsx - páginas não-checkout):
 * - Detecta ?ref= na URL
 * - Armazena em sessionStorage para persistência no checkout
 * - Limpa a URL
 * 
 * Modo 'persist' (Checkout):
 * - Verifica sessionStorage por código pendente
 * - Verifica ?ref= na URL do checkout
 * - Persiste no localStorage com expiração correta do produto
 * - Respeita modelo de atribuição
 */
export function useAffiliateTracking(options: AffiliateTrackingOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const mode = options.mode || 'persist';
  const cookieDays = options.cookieDuration || DEFAULT_COOKIE_DAYS;
  const attributionModel = options.attributionModel || 'last_click';
  const enabled = options.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;
    
    const refCode = searchParams.get('ref');

    // ========================================================================
    // MODO CAPTURE: Apenas captura temporária (sessionStorage)
    // ========================================================================
    if (mode === 'capture') {
      if (refCode) {
        savePendingAffiliateCode(refCode);

        // Limpa a URL removendo o parâmetro ?ref=
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('ref');
        setSearchParams(newParams, { replace: true });
      }
      return;
    }

    // ========================================================================
    // MODO PERSIST: Persistência final com configurações do produto
    // ========================================================================
    
    // 1. Verificar se há código pendente no sessionStorage
    const pendingData = getPendingAffiliateCode();
    
    // 2. Determinar qual código usar (URL tem prioridade)
    const codeToProcess = refCode || pendingData?.code;

    if (codeToProcess) {
      // Persistir com configurações corretas do produto
      persistAffiliateCode(codeToProcess, {
        cookieDuration: cookieDays,
        attributionModel,
      });

      // Limpa a URL se o código veio dela
      if (refCode) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('ref');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, setSearchParams, mode, cookieDays, attributionModel, enabled]);
}
