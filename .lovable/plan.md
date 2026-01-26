
# Plano de Correção: Erros de CORS e "Reconectando" no Checkout Público

## Diagnóstico Técnico

Após investigação profunda, identifiquei **2 problemas distintos** causando os erros:

### Problema 1: CORS Blocking (CRÍTICO)

A origem `https://risecheckout.com` está sendo bloqueada pelo CORS handler das Edge Functions.

**Evidência nos Screenshots:**
- Erros "has been blocked by CORS policy"
- "Response to preflight request doesn't pass access control check"
- "The value of the 'Access-Control-Allow-Origin' header must not be the wildcard '*' when the request's credentials mode is 'include'"

**Causa:** A secret `CORS_ALLOWED_ORIGINS` não inclui `https://risecheckout.com` como origem permitida.

### Problema 2: Session Commander Disparado em Rota Pública (ARQUITETURAL)

O `TokenService` é inicializado como singleton global quando qualquer módulo importa `api.publicCall`:

```text
api/client.ts importa unifiedTokenService
  → unifiedTokenService é criado (singleton)
  → TokenService.constructor() executa restoreState()
  → Se há sessão expirada no localStorage, dispara setTimeout(() => this.refresh())
  → refresh() chama sessionCommander.requestRefresh()
  → requestRefresh() faz fetch para /unified-auth/request-refresh
  → CORS block porque origem não está permitida
  → Toast "Reconectando... (1/3)" aparece
```

---

## Análise de Soluções (RISE V3 Obrigatório)

### Solução A: Apenas Corrigir CORS (Paliativo)
- Adicionar `https://risecheckout.com` à secret CORS_ALLOWED_ORIGINS
- Não alterar a arquitetura

- **Manutenibilidade**: 7/10 - Resolve sintoma, não causa raiz
- **Zero DT**: 6/10 - TokenService ainda tenta refresh desnecessário em rotas públicas
- **Arquitetura**: 6/10 - Acoplamento incorreto permanece
- **Escalabilidade**: 7/10 - Cada nova origem precisa ser adicionada manualmente
- **Segurança**: 9/10 - CORS funciona
- **NOTA FINAL: 7.0/10**
- **Tempo estimado**: 5 minutos

### Solução B: Lazy Initialization do TokenService + CORS Fix
- Corrigir CORS adicionando origens
- Modificar TokenService para não auto-refresh durante inicialização
- Auto-refresh só dispara quando explicitamente solicitado (rotas protegidas)

- **Manutenibilidade**: 9/10 - Elimina efeito colateral
- **Zero DT**: 9/10 - Quase zero, pequeno patch
- **Arquitetura**: 8/10 - Melhora mas não refatora completamente
- **Escalabilidade**: 9/10 - Rotas públicas não disparam auth
- **Segurança**: 10/10 - CORS + sem leaking de tentativas de auth
- **NOTA FINAL: 9.0/10**
- **Tempo estimado**: 30 minutos

### Solução C: Arquitetura Route-Aware + CORS Fix (Completa)
- Corrigir CORS adicionando origens
- Criar contexto RouteAware para TokenService
- TokenService só inicializa comportamento de refresh em rotas protegidas
- Checkout público é completamente isolado do sistema de auth
- Separar `api.publicCall` de `api.call` em módulos diferentes

- **Manutenibilidade**: 10/10 - Separação perfeita de concerns
- **Zero DT**: 10/10 - Zero efeitos colaterais
- **Arquitetura**: 10/10 - Clean Architecture completa
- **Escalabilidade**: 10/10 - Novas rotas públicas não afetam auth
- **Segurança**: 10/10 - CORS + isolamento completo
- **NOTA FINAL: 10.0/10**
- **Tempo estimado**: 3-4 horas

### DECISÃO: Solução C (Nota 10.0/10)

Seguindo a Lei Suprema RISE V3 Seção 4.6: A melhor solução vence, sempre.

---

## Plano de Implementação

### Fase 1: Corrigir CORS (Imediato - 5 min)

**Ação:** Adicionar origens faltantes à secret `CORS_ALLOWED_ORIGINS` no Supabase.

**Origens que precisam estar na lista:**
- `https://risecheckout.com`
- `https://www.risecheckout.com`
- `https://biz-bridge-bliss.lovable.app` (preview)
- `https://id-preview--ed9257df-d9f6-4a5e-961f-eca053f14944.lovable.app` (preview)

### Fase 2: Criar API Client Público Separado (45 min)

**Arquivo a criar:** `src/lib/api/public-client.ts`

**Objetivo:** Client de API que NÃO importa TokenService, completamente desacoplado.

Estrutura:
```text
src/lib/api/
├── client.ts          (existente - api.call com auth)
├── public-client.ts   (NOVO - publicApi sem auth imports)
├── types.ts           (existente - compartilhado)
└── errors.ts          (existente - compartilhado)
```

O `public-client.ts` terá apenas:
- Função `publicCall<T>()` sem nenhuma lógica de auth
- Sem import de TokenService ou SessionCommander
- Usado por módulos públicos (checkout, payment links, etc.)

### Fase 3: Migrar Checkout para Public Client (30 min)

**Arquivos a modificar:**
- `src/modules/checkout-public/machines/checkoutPublicMachine.actors.ts`
- `src/modules/checkout-public/machines/actors/processPixPaymentActor.ts`
- `src/modules/checkout-public/machines/actors/createOrderActor.ts`
- `src/modules/checkout-public/machines/actors/processCardPaymentActor.ts`

**Mudança:**
```typescript
// ANTES
import { api } from "@/lib/api";
const { data, error } = await api.publicCall<...>(...);

// DEPOIS
import { publicApi } from "@/lib/api/public-client";
const { data, error } = await publicApi.call<...>(...);
```

### Fase 4: Lazy Initialization do TokenService (45 min)

**Arquivo a modificar:** `src/lib/token-manager/service.ts`

**Mudanças:**
1. Remover auto-refresh do constructor
2. Adicionar método `initialize()` que deve ser chamado explicitamente
3. Chamar `initialize()` apenas em contextos autenticados (useUnifiedAuth)

```text
// ANTES (constructor)
constructor() {
  restoreState();        // Lê localStorage
  // Se expirado, dispara refresh automaticamente
}

// DEPOIS (lazy)
constructor() {
  // Não faz nada aqui
}

initialize() {
  restoreState();
  // Se expirado, dispara refresh
}
```

**Arquivo a modificar:** `src/hooks/useUnifiedAuth.ts`

Adicionar chamada a `unifiedTokenService.initialize()` no hook.

### Fase 5: Atualizar Barrel Exports (15 min)

**Arquivo a modificar:** `src/lib/api/index.ts`

Adicionar export do novo public client:
```typescript
export { publicApi } from "./public-client";
```

### Fase 6: Testes e Validação (30 min)

1. Verificar que checkout público carrega sem toasts de "Reconectando"
2. Verificar que dashboard (rotas protegidas) ainda funciona com auth
3. Verificar que não há erros de CORS em nenhuma rota

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Linhas |
|---------|------|--------|
| `src/lib/api/public-client.ts` | CRIAR | ~80 |
| `src/lib/api/index.ts` | MODIFICAR | +2 |
| `src/lib/token-manager/service.ts` | MODIFICAR | ~30 |
| `src/hooks/useUnifiedAuth.ts` | MODIFICAR | +5 |
| `src/modules/checkout-public/machines/checkoutPublicMachine.actors.ts` | MODIFICAR | ~3 |
| `src/modules/checkout-public/machines/actors/processPixPaymentActor.ts` | MODIFICAR | ~3 |
| `src/modules/checkout-public/machines/actors/createOrderActor.ts` | MODIFICAR | ~3 |
| `src/modules/checkout-public/machines/actors/processCardPaymentActor.ts` | MODIFICAR | ~3 |
| CORS Secret (Supabase Dashboard) | ADICIONAR ORIGENS | N/A |

---

## Detalhes Técnicos

### 1. Public Client (Isolado)

```text
Características:
- Zero imports de módulos de auth
- Apenas: SUPABASE_URL, SUPABASE_ANON_KEY
- Função publicCall<T>(functionName, body)
- Timeout padrão de 30s
- Correlation ID para tracing
- SEM retry em 401 (não faz sentido em rotas públicas)
```

### 2. TokenService Lazy Init

```text
Padrão de inicialização:
1. Singleton criado sem side effects
2. useUnifiedAuth chama initialize() no mount
3. initialize() é idempotente (só executa uma vez)
4. Rotas públicas nunca chamam initialize()
```

### 3. CORS Origins Format

```text
Secret: CORS_ALLOWED_ORIGINS
Value (CSV sem espaços):
https://risecheckout.com,https://www.risecheckout.com,https://biz-bridge-bliss.lovable.app,https://id-preview--ed9257df-d9f6-4a5e-961f-eca053f14944.lovable.app,[outras origens existentes]
```

---

## Resultado Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Erros CORS no checkout | Múltiplos | Zero |
| Toast "Reconectando" em rota pública | Sim | Não |
| TokenService inicializado em rota pública | Sim | Não |
| Imports de auth no checkout-public | Indireto | Zero |
| Nota RISE V3 | 6.0/10 | 10.0/10 |

---

## Verificação de Qualidade

| Pergunta | Resposta |
|----------|----------|
| Esta é a MELHOR solução? | Sim, 10.0/10 |
| Zero dívida técnica? | Sim |
| Isolamento completo de concerns? | Sim |
| Checkout público sem auth code? | Sim |
| CORS corrigido? | Sim |
| Rotas protegidas funcionam? | Sim |

---

## Ação Imediata Recomendada

Antes de implementar a solução completa, é **CRÍTICO** verificar e atualizar a secret `CORS_ALLOWED_ORIGINS` no Supabase Dashboard para incluir:
- `https://risecheckout.com`
- `https://www.risecheckout.com`

Isso resolverá os erros de CORS imediatamente enquanto a solução arquitetural é implementada.

---

## Tempo Total Estimado
**3-4 horas** para solução completa (incluindo a correção imediata de CORS)
