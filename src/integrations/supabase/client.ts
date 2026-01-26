/**
 * Supabase Client - DEPRECATED
 * 
 * RISE Protocol V3 - Zero Database Access from Frontend
 * 
 * ⚠️  ESTE ARQUIVO ESTÁ DEPRECADO  ⚠️
 * 
 * O frontend NÃO deve acessar o banco de dados diretamente.
 * Todas as operações devem passar por Edge Functions via api.call().
 * 
 * Se você precisa fazer uma operação de banco:
 * 1. Crie ou use uma Edge Function existente
 * 2. Chame via api.call() ou api.publicCall()
 * 
 * @see docs/API_GATEWAY_ARCHITECTURE.md
 * @deprecated Use api.call() from @/lib/api instead
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ============================================
// DEPRECATION WARNING
// ============================================

const DEPRECATION_WARNING = `
[RISE V3 DEPRECATION WARNING]
O uso direto do Supabase client está deprecado.
Use api.call() de @/lib/api para todas as operações de backend.

Motivos:
- Segurança: Evita exposição de queries no bundle
- Arquitetura: Centraliza lógica de negócio no backend
- Manutenibilidade: Single point of change para RLS/políticas

Migração:
  // ❌ Antes (deprecado)
  const { data } = await supabase.from('products').select('*');
  
  // ✅ Depois (correto)
  const { data } = await api.call('products-crud', { action: 'list' });
`;

// Log warning apenas uma vez por sessão
let warningLogged = false;
function logDeprecationWarning() {
  if (!warningLogged && typeof console !== 'undefined') {
    console.warn(DEPRECATION_WARNING);
    warningLogged = true;
  }
}

// ============================================
// CLIENT (mantido para compatibilidade)
// ============================================

const SUPABASE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdmJ0bXRncHN4dXBmand3b3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3Mjg2NzIsImV4cCI6MjA4MTA4ODY3Mn0.h8HDRdHaVTZpZLqBxj7bODaUPCox2h6HF_3U1xfbSXY";

// Criar client com warning de deprecação
const baseClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Proxy para logar warning na primeira utilização
export const supabase = new Proxy(baseClient, {
  get(target, prop) {
    // Logar warning apenas para operações de query
    if (prop === 'from' || prop === 'rpc') {
      logDeprecationWarning();
    }
    return Reflect.get(target, prop);
  }
});
