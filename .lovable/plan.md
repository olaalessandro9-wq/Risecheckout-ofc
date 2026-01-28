
# Plano: Correção do Sistema de Auto-Refresh e Recuperação de Erros

## RISE Protocol V3 - Seção 4: LEI SUPREMA

---

## Diagnóstico Completo (Revisado Após Revert)

### Análise dos Erros do Console (Print do Usuário)

| Erro | Causa Raiz | Impacto |
|------|------------|---------|
| `x-tab-id is not allowed by Access-Control-Allow-Headers` | Header X-Tab-Id **NÃO ESTÁ** na lista CORS | **CRÍTICO** - Bloqueia refresh |
| `net::ERR_NAME_NOT_RESOLVED` | Falha transitória de DNS | Agrava após CORS falhar |
| `Failed to fetch dynamically imported module` | Chunk loading falha após erro de rede | Quebra a aplicação |
| `Unexpected Application Error!` | React Router sem errorElement | Usuário vê erro genérico |

### Cadeia de Falhas (Root Cause Analysis)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Frontend (coordinator.ts:213) envia X-Tab-Id header para /request-refresh│
│                              ▼                                               │
│ 2. CORS bloqueia (cors-v2.ts linha 60-66 NÃO inclui x-tab-id)               │
│                              ▼                                               │
│ 3. Fetch falha com CORS error → SessionCommander retorna { status: "error" }│
│                              ▼                                               │
│ 4. TokenService não consegue fazer refresh → state = "error"                │
│                              ▼                                               │
│ 5. Network instability → Dynamic import falha (Auth chunk)                  │
│                              ▼                                               │
│ 6. React Router não tem errorElement → Mostra "Unexpected Application Error"│
│                              ▼                                               │
│ 7. AppErrorBoundary captura MAS não tenta auto-recovery                     │
│                              ▼                                               │
│ 8. Usuário precisa dar F5 manualmente                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Por Que F5 Funciona?

1. Página recarrega completamente
2. `useUnifiedAuth` chama `/validate` (não `/request-refresh`)
3. Backend faz auto-refresh via validate (linha 52-65 de validate.ts)
4. Cookie `__Secure-rise_refresh` ainda válido → Sessão restaurada

---

## Análise de Soluções

### Solução A: Correção Completa com Resiliência Sistêmica (10.0/10)

- **Manutenibilidade:** 10/10 (correção na raiz + auto-recovery)
- **Zero DT:** 10/10 (resolve problema permanentemente)
- **Arquitetura:** 10/10 (múltiplas camadas de fallback)
- **Escalabilidade:** 10/10 (padrão robusto para futuras features)
- **Segurança:** 10/10 (sem impacto negativo)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 2-3 horas

### Solução B: Apenas Adicionar Header CORS

- **Manutenibilidade:** 6/10 (não resolve chunk loading)
- **Zero DT:** 5/10 (outros erros ainda quebram)
- **Arquitetura:** 4/10 (sem fallback para erros)
- **Escalabilidade:** 5/10 (problema ressurge com outros erros)
- **Segurança:** 10/10 (sem impacto)
- **NOTA FINAL: 6.0/10**
- Tempo estimado: 10 minutos

### Solução C: Remover X-Tab-Id do Frontend

- **Manutenibilidade:** 5/10 (perde coordenação multi-tab)
- **Zero DT:** 4/10 (degrada arquitetura Session Commander)
- **Arquitetura:** 3/10 (viola RISE V3 - server-side locking)
- **Escalabilidade:** 4/10 (race conditions em múltiplas tabs)
- **Segurança:** 6/10 (menos coordenação = mais vulnerável)
- **NOTA FINAL: 4.4/10**
- Tempo estimado: 15 minutos

### DECISÃO: Solução A (10.0/10)

As outras soluções são inferiores porque:
- **B** apenas corrige CORS mas não adiciona resiliência
- **C** degrada a arquitetura removendo feature importante

---

## Implementação em 4 Camadas

### Camada 1: Correção CORS (Causa Raiz)

**Arquivo:** `supabase/functions/_shared/cors-v2.ts`

**Problema:** Linha 60-66 define `CORS_ALLOWED_HEADERS` mas NÃO inclui `x-tab-id`.

**Correção:** Adicionar `x-tab-id` à lista de headers permitidos:

```typescript
// Linha 60-66: ANTES
const CORS_ALLOWED_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-correlation-id",
].join(", ");

// DEPOIS
const CORS_ALLOWED_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-correlation-id",
  "x-tab-id",  // ← NOVO: Session Commander multi-tab coordination
].join(", ");
```

---

### Camada 2: React Router errorElement

**Arquivo:** `src/App.tsx`

**Problema:** O router (linha 57-69) não tem `errorElement`, então erros de rota mostram "Unexpected Application Error".

**Correção:** Adicionar `errorElement` ao router:

```typescript
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />, // ← NOVO
    children: [
      ...publicRoutes,
      ...lgpdRoutes,
      ...buyerRoutes,
      ...builderRoutes,
      ...dashboardRoutes,
      { path: "*", element: <NotFound /> },
    ],
  },
]);
```

---

### Camada 3: RouteErrorBoundary (Novo Componente)

**Arquivo:** `src/components/RouteErrorBoundary.tsx` (NOVO)

Componente dedicado para erros de rota com auto-recovery:

```typescript
/**
 * RouteErrorBoundary - React Router Error Recovery
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Captura erros de rota (errorElement) e tenta auto-recovery
 * para erros de rede antes de mostrar UI de erro.
 */

import { useEffect, useState } from "react";
import { useRouteError } from "react-router-dom";
import { isChunkLoadError } from "@/lib/lazyWithRetry";
import { createLogger } from "@/lib/logger";
import { WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const log = createLogger("RouteErrorBoundary");

// Limite de auto-recoveries para evitar loops infinitos
const MAX_AUTO_RECOVERY_ATTEMPTS = 2;
const RECOVERY_ATTEMPT_KEY = "route_error_recovery_attempts";
const RECOVERY_TIMESTAMP_KEY = "route_error_recovery_timestamp";

export function RouteErrorBoundary() {
  const error = useRouteError();
  const [recovering, setRecovering] = useState(false);
  
  // Detectar se é erro de rede/chunk
  const isNetworkError = error instanceof Error && isChunkLoadError(error);
  
  // Auto-recovery para erros de rede (com limite)
  useEffect(() => {
    if (!isNetworkError || recovering) return;
    
    // Verificar contagem de tentativas (reset após 1 minuto)
    const now = Date.now();
    const lastTimestamp = parseInt(sessionStorage.getItem(RECOVERY_TIMESTAMP_KEY) || "0");
    let attempts = parseInt(sessionStorage.getItem(RECOVERY_ATTEMPT_KEY) || "0");
    
    // Reset contador se passou mais de 1 minuto
    if (now - lastTimestamp > 60000) {
      attempts = 0;
    }
    
    if (attempts >= MAX_AUTO_RECOVERY_ATTEMPTS) {
      log.warn("Max auto-recovery attempts reached, showing manual UI");
      return;
    }
    
    // Incrementar e salvar
    sessionStorage.setItem(RECOVERY_ATTEMPT_KEY, String(attempts + 1));
    sessionStorage.setItem(RECOVERY_TIMESTAMP_KEY, String(now));
    
    log.info(`Network error - auto-recovery attempt ${attempts + 1}/${MAX_AUTO_RECOVERY_ATTEMPTS}`);
    setRecovering(true);
    
    const timer = setTimeout(() => {
      window.location.reload();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isNetworkError, recovering]);
  
  // Durante recovery, mostrar feedback visual
  if (recovering) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Reconectando...</p>
        </div>
      </div>
    );
  }
  
  // UI de erro para quando auto-recovery falhou ou não é erro de rede
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          {isNetworkError ? (
            <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/20">
              <WifiOff className="h-12 w-12 text-amber-600 dark:text-amber-400" />
            </div>
          ) : (
            <div className="p-4 rounded-full bg-destructive/10">
              <RefreshCw className="h-12 w-12 text-destructive" />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {isNetworkError ? "Problemas de conexão" : "Erro inesperado"}
          </h1>
          <p className="text-muted-foreground">
            {isNetworkError
              ? "Não foi possível carregar a página. Verifique sua conexão."
              : "Ocorreu um erro. Por favor, tente novamente."}
          </p>
        </div>
        
        <Button onClick={() => window.location.reload()} size="lg" className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    </div>
  );
}
```

---

### Camada 4: AppErrorBoundary com Auto-Recovery

**Arquivo:** `src/components/AppErrorBoundary.tsx`

**Problema:** O AppErrorBoundary atual (linha 54-80) captura o erro mas NÃO tenta auto-recovery.

**Correção:** Adicionar lógica de auto-recovery para erros de rede:

```typescript
// Adicionar state para controle de recovery
interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryAttempted: boolean; // ← NOVO
}

// No constructor
this.state = {
  hasError: false,
  error: null,
  errorInfo: null,
  recoveryAttempted: false, // ← NOVO
};

// No componentDidCatch
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  const isNetworkIssue = isChunkLoadError(error);
  
  // AUTO-RECOVERY: Tentar recarregar após erros de rede (apenas 1 vez)
  if (isNetworkIssue && !this.state.recoveryAttempted) {
    log.info("Network error detected - attempting auto-recovery in 2s");
    this.setState({ recoveryAttempted: true });
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    return;
  }
  
  // ... resto do código existente de log e Sentry
}
```

---

## Fluxo Após Correção

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FLUXO CORRIGIDO (RISE V3 10.0/10)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Cenário 1: Refresh Normal (Sem Erros)                                       │
│ ─────────────────────────────────────────                                    │
│ Frontend → X-Tab-Id → CORS OK → /request-refresh → Tokens Renovados ✓       │
│                                                                              │
│ Cenário 2: Erro de Rede Transitório                                          │
│ ─────────────────────────────────────────                                    │
│ Refresh falha → SessionCommander retry (3x com backoff) → Sucesso ✓         │
│                                                                              │
│ Cenário 3: Erro Persistente + Chunk Loading                                  │
│ ─────────────────────────────────────────                                    │
│ Chunk falha → RouteErrorBoundary detecta → Auto-reload em 2s ✓              │
│ Após reload → /validate com auto-refresh → Sessão Restaurada ✓              │
│                                                                              │
│ Cenário 4: Múltiplos Erros (Proteção Anti-Loop)                             │
│ ─────────────────────────────────────────                                    │
│ 2 auto-recoveries falham → Mostra UI com botão manual "Tentar Novamente"    │
│                                                                              │
│ Cenário 5: Refresh Token Expirado (Legítimo)                                │
│ ─────────────────────────────────────────                                    │
│ Backend retorna 401 → SessionCommander mostra "Sessão expirada" →           │
│ Usuário redirecionado para /auth (comportamento correto)                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Resumo de Arquivos a Alterar

| Arquivo | Alteração | Prioridade |
|---------|-----------|------------|
| `supabase/functions/_shared/cors-v2.ts` | Adicionar `x-tab-id` aos headers CORS | **CRÍTICA** |
| `src/components/RouteErrorBoundary.tsx` | NOVO - Error boundary para rotas | **ALTA** |
| `src/App.tsx` | Adicionar `errorElement` ao router | **ALTA** |
| `src/components/AppErrorBoundary.tsx` | Adicionar auto-recovery para erros de rede | **MÉDIA** |

---

## Testes de Validação

Após implementação, validar os seguintes cenários:

| Cenário | Comportamento Esperado |
|---------|------------------------|
| Refresh normal | Sem erros, tokens renovados silenciosamente |
| Erro DNS transitório | Toast "Reconectando..." → Sucesso automático |
| Chunk loading falha | Spinner "Reconectando..." → Reload automático em 2s |
| Múltiplas tabs | Apenas uma faz refresh (lock), outras esperam |
| Refresh token expirado | Toast "Sessão expirada" → Redirect para /auth |
| Loop de erros | Máximo 2 auto-recoveries, depois UI manual |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| LEI SUPREMA (4.1) | Nota 10.0/10 - Solução mais completa |
| Manutenibilidade Infinita | Múltiplas camadas de fallback |
| Zero Dívida Técnica | Corrige causa raiz + adiciona resiliência |
| Arquitetura Correta | Session Commander + Error Boundaries |
| Escalabilidade | Padrão aplicável a qualquer erro de rede |

**NOTA FINAL: 10.0/10** - Correção completa com resiliência sistêmica
