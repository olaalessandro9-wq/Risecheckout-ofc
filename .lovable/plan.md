
# Plano: Correção de Conformidade RISE V3 - Zero Latency Architecture

## Contexto

A implementação da **Zero Latency Architecture** está **funcionalmente correta**, reduzindo latência em 60-70% conforme planejado. No entanto, a auditoria identificou **6 problemas de conformidade** que precisam ser corrigidos para atingir **RISE V3 Score 10.0/10**.

## Análise de Soluções (RISE Protocol V3 Seção 4.4)

### Solução A: Ignorar Pendências Documentais

Manter código como está, já que funciona.

- Manutenibilidade: 7/10 (testes falham, docs incorretas)
- Zero DT: 6/10 (código morto, inconsistências)
- Arquitetura: 9/10 (implementação correta)
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 8.2/10**
- Tempo estimado: 0

### Solução B: Correção Completa de Conformidade

Corrigir todos os 6 problemas identificados.

- Manutenibilidade: 10/10 (zero problemas)
- Zero DT: 10/10 (zero código morto, docs corretas)
- Arquitetura: 10/10 (consistência total)
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 1 hora

### DECISÃO: Solução B (Nota 10.0)

Conforme Lei Suprema Seção 4.6: A melhor solução VENCE. SEMPRE.

---

## Problemas Identificados e Correções

### PROBLEMA 1: Testes Desatualizados (CRÍTICO)

**Arquivo:** `src/modules/checkout-public/components/__tests__/CheckoutPublicLoader.test.tsx`

**Correção:** Adicionar mock do CheckoutSkeleton e atualizar assertions para verificar presença do skeleton em vez de texto.

```typescript
// ADICIONAR mock do CheckoutSkeleton
vi.mock("../CheckoutSkeleton", () => ({
  CheckoutSkeleton: () => (
    <div data-testid="checkout-skeleton">Loading Skeleton</div>
  ),
}));

// ATUALIZAR assertions (linhas 102, 112, 122)
// ANTES:
expect(screen.getByText("Carregando checkout...")).toBeInTheDocument();

// DEPOIS:
expect(screen.getByTestId("checkout-skeleton")).toBeInTheDocument();
```

### PROBLEMA 2: Código Morto - Import Não Utilizado

**Arquivo:** `src/routes/publicRoutes.tsx`

**Correção:** Remover linha 23 (import de PaymentLinkRedirect).

```typescript
// REMOVER esta linha:
const PaymentLinkRedirect = lazyWithRetry(() => import("@/pages/PaymentLinkRedirect"));
```

### PROBLEMA 3: Documentação Desatualizada (4x READMEs)

**Arquivos:** facebook, google-ads, tiktok, kwai READMEs

**Correção:** Atualizar linha 50 em cada arquivo.

```text
ANTES:
│     └── Action: resolve-and-load                            │

DEPOIS:
│     └── Action: resolve-universal                           │
```

Também atualizar changelog para refletir Zero Latency Architecture:

```markdown
### v2.2.0 (Fevereiro 2026)
- Atualizado para Zero Latency Architecture
- Action alterada: resolve-and-load → resolve-universal
- Single HTTP call para carregar todos os dados
```

### PROBLEMA 4: EDGE_FUNCTIONS_REGISTRY.md Desatualizado

**Arquivo:** `docs/EDGE_FUNCTIONS_REGISTRY.md`

**Correção:** Atualizar contagem de handlers (11 → 12) e documentar resolve-universal.

```markdown
| `checkout-public-data` | public | false | BFF Modular (12 handlers) |
```

Adicionar documentação da nova action na seção apropriada.

### PROBLEMA 5: CHECKOUT_PUBLIC_MODULE_ARCHITECTURE.md Desatualizado

**Arquivo:** `docs/CHECKOUT_PUBLIC_MODULE_ARCHITECTURE.md`

**Correção:** Adicionar resolve-universal-handler.ts na estrutura (linha 783) e na tabela de actions.

```text
├── resolve-and-load-handler.ts             # action: resolve-and-load (BFF) (~240 linhas)
└── resolve-universal-handler.ts            # action: resolve-universal (Zero Latency) (~300 linhas)
```

Adicionar na tabela:
```markdown
| `resolve-universal` | resolve-universal-handler | Zero Latency - resolve qualquer slug (checkout ou payment_link) |
```

### PROBLEMA 6: Console.warn em Código de Produção

**Arquivo:** `src/pages/PaymentLinkRedirect.tsx`

**Correção:** Mover console.warn para dentro de useEffect (executa apenas se página for renderizada) ou remover completamente já que o arquivo está deprecated.

```typescript
// REMOVER linha 25:
console.warn("[DEPRECATED] PaymentLinkRedirect is deprecated...");

// O @deprecated no JSDoc já é suficiente
```

---

## Árvore de Arquivos a Modificar

```text
# Testes
src/modules/checkout-public/components/__tests__/CheckoutPublicLoader.test.tsx

# Código Morto
src/routes/publicRoutes.tsx

# Documentação Tracking (4 arquivos)
src/integrations/tracking/facebook/README.md
src/integrations/tracking/google-ads/README.md
src/integrations/tracking/tiktok/README.md
src/integrations/tracking/kwai/README.md

# Documentação Principal
docs/EDGE_FUNCTIONS_REGISTRY.md
docs/CHECKOUT_PUBLIC_MODULE_ARCHITECTURE.md

# Código Deprecated
src/pages/PaymentLinkRedirect.tsx
```

---

## Resultado Esperado

| Item | Antes | Depois |
|------|-------|--------|
| Testes unitários | FALHAM | PASSAM |
| Import não utilizado | Presente | Removido |
| Docs action resolve-and-load | 4 arquivos | 0 arquivos |
| EDGE_FUNCTIONS_REGISTRY handlers | 11 | 12 |
| console.warn em produção | Presente | Removido |
| RISE V3 Score | 9.2/10 | 10.0/10 |

---

## Seção Técnica: Correções Detalhadas

### 1. Mock do CheckoutSkeleton nos Testes

```typescript
// Adicionar após linha 35 (após outros mocks)
vi.mock("../CheckoutSkeleton", () => ({
  CheckoutSkeleton: () => (
    <div data-testid="checkout-skeleton">Loading Skeleton</div>
  ),
}));
```

### 2. Assertions Atualizadas

```typescript
// Linha 102 - idle state
expect(screen.getByTestId("checkout-skeleton")).toBeInTheDocument();

// Linha 112 - loading state  
expect(screen.getByTestId("checkout-skeleton")).toBeInTheDocument();

// Linha 122 - validating state
expect(screen.getByTestId("checkout-skeleton")).toBeInTheDocument();
```

### 3. Documentação resolve-universal

Adicionar em CHECKOUT_PUBLIC_MODULE_ARCHITECTURE.md seção 17.2:

```markdown
| `resolve-universal` | resolve-universal-handler | Zero Latency BFF - aceita checkout_slug OU payment_link_slug, retorna todos os dados em 1 chamada. Reduz latência em 60-70%. |
```

---

## Métricas de Sucesso

| Métrica | Critério de Aceite |
|---------|-------------------|
| Testes unitários | 100% passando |
| Código morto | Zero imports não utilizados |
| Documentação | 100% atualizada para resolve-universal |
| console.* em produção | Zero ocorrências fora de logger |
| RISE V3 Score | 10.0/10 |

**RISE V3 Score Final Após Correções: 10.0/10**

- Zero código morto
- Zero testes falhando
- Zero documentação desatualizada
- Zero dívida técnica
- Conformidade total com Protocolo RISE V3
