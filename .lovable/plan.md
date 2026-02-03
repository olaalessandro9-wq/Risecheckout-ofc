
# Plano RISE V3: Corrigir Navegação Após Pagamento com Cartão

## Diagnóstico

### Problema Identificado

O usuário reporta que após pagamento com cartão aprovado:
1. O spinner roda e para
2. Cliente permanece na tela de checkout
3. Acessos são enviados (emails funcionam)
4. Não há redirecionamento para `/success/{orderId}`

### Causa Raiz

**Arquivo:** `src/modules/checkout-public/machines/checkoutPublicMachine.ts`
**Linha:** 52-53

```typescript
// IMPLEMENTAÇÃO ATUAL (INCORRETA)
isCardApproved: (_, params: { output?: { navigationData?: NavigationData } }) => 
  params?.output?.navigationData?.type === 'card' && params.output.navigationData.status === 'approved',
```

**Problema:** O guard tenta acessar `params.output`, mas:
1. `params` é o SEGUNDO argumento do guard
2. Quando o guard é chamado como string `"isCardApproved"` (linha 231), NÃO são passados params
3. Em XState v5, o output do actor resolvido está em `event.output` (primeiro argumento)

### Fluxo do Bug

```text
1. Cartão aprovado pelo gateway
2. processCardPaymentActor retorna { success: true, navigationData: { type: 'card', status: 'approved' } }
3. XState dispara evento onDone com event.output = { success: true, navigationData: {...} }
4. Guard isCardApproved é chamado com:
   - Primeiro argumento: { context, event }  (event contém output)
   - Segundo argumento: undefined (nenhum params passado)
5. Guard tenta acessar params?.output => undefined?.output => undefined
6. Guard retorna false
7. XState pula para próxima transição que também falha
8. Máquina fica travada em "processingCard"
9. UI mostra spinner eternamente
```

---

## Análise de Soluções (RISE Protocol V3 Seção 4.4)

### Solução A: Corrigir Assinatura do Guard

Alterar o guard `isCardApproved` para acessar corretamente `event.output`.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | Correção simples em uma linha, segue padrão XState v5 |
| Zero DT | 10/10 | Remove bug sem criar novos problemas |
| Arquitetura | 10/10 | Alinha com documentação oficial do XState v5 |
| Escalabilidade | 10/10 | Padrão correto para todos os guards futuros |
| Segurança | 10/10 | Não afeta segurança |

- **NOTA FINAL: 10.0/10**
- Tempo estimado: 5 minutos

### Solução B: Remover Guard Nomeado e Usar Inline

Substituir o guard nomeado por um guard inline diretamente na transição.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 7/10 | Guards inline são menos testáveis e reutilizáveis |
| Zero DT | 10/10 | Resolve o bug |
| Arquitetura | 6/10 | Viola princípio de separação de concerns |
| Escalabilidade | 7/10 | Dificulta reutilização em outras transições |
| Segurança | 10/10 | Não afeta segurança |

- **NOTA FINAL: 7.8/10**
- Tempo estimado: 5 minutos

### DECISÃO: Solução A (Nota 10.0/10)

A Solução B viola separação de concerns e dificulta testes unitários. A Solução A mantém o guard nomeado (testável, reutilizável) e apenas corrige a assinatura.

---

## Plano de Implementação

### Arquivo a Modificar

```text
src/modules/checkout-public/machines/checkoutPublicMachine.ts
```

### Alteração Detalhada

**Antes (linha 52-53):**
```typescript
isCardApproved: (_, params: { output?: { navigationData?: NavigationData } }) => 
  params?.output?.navigationData?.type === 'card' && params.output.navigationData.status === 'approved',
```

**Depois:**
```typescript
isCardApproved: ({ event }: { event: { output?: { navigationData?: NavigationData } } }) => 
  event.output?.navigationData?.type === 'card' && event.output.navigationData?.status === 'approved',
```

### Explicação Técnica

| Aspecto | Antes (Incorreto) | Depois (Correto) |
|---------|-------------------|------------------|
| Acesso ao output | `params.output` | `event.output` |
| Posição do argumento | Segundo (`params`) | Primeiro (`{ event }`) |
| Conformidade XState v5 | Violado | Correto |
| Tipagem | Incorreta | Explícita e correta |

---

## Fluxo Corrigido

```text
1. Cartão aprovado pelo gateway
2. processCardPaymentActor retorna { success: true, navigationData: { type: 'card', status: 'approved' } }
3. XState dispara evento onDone com event.output = { success: true, navigationData: {...} }
4. Guard isCardApproved é chamado com:
   - Primeiro argumento: { context, event }
5. Guard acessa event.output.navigationData
6. Guard retorna TRUE (status === 'approved')
7. Transição para estado "success" é executada
8. navigationData é atribuído ao contexto
9. Componente React detecta isSuccess === true
10. useEffect dispara navigate('/success/{orderId}')
11. Cliente vê página de obrigado
```

---

## Validação Pós-Correção

Após a correção:
1. O estado da máquina deve transicionar para `success` quando `status === 'approved'`
2. O contexto `navigationData` deve conter os dados do pagamento
3. O componente `CheckoutPublicContent` deve detectar `isSuccess === true`
4. O `useEffect` na linha 101-118 deve disparar a navegação

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Manutenibilidade Infinita | Guard nomeado, testável, reutilizável |
| Zero Dívida Técnica | Corrige bug sem workarounds |
| Arquitetura Correta | Segue documentação XState v5 |
| Escalabilidade | Padrão aplicável a todos os guards |
| Segurança | Não afetada |

**RISE V3 Score: 10.0/10**

---

## Seção Técnica

### XState v5 Guard Signature

De acordo com a documentação oficial (`node_modules/xstate/dist/declarations/src/guards.d.ts`):

```typescript
export interface GuardArgs<TContext, TExpressionEvent> {
    context: TContext;
    event: TExpressionEvent;
}

export type GuardPredicate<...> = {
    (args: GuardArgs<TContext, TExpressionEvent>, params: TParams): boolean;
};
```

- **Primeiro argumento:** `{ context, event }` - sempre disponível
- **Segundo argumento:** `params` - só disponível se definido com `guard: { type: 'name', params: {...} }`

### Por que o Bug Não Apareceu Antes?

Em pagamentos PIX, o guard usado é inline (linha 208-209):
```typescript
guard: ({ event }) => event.output.success === true,
```

Apenas o guard `isCardApproved` (cartão) tinha a assinatura incorreta.

### Impacto em Outros Guards

Verificação dos outros guards no arquivo:

| Guard | Assinatura | Status |
|-------|------------|--------|
| `canRetry` | `({ context })` | CORRETO |
| `isDataValid` | `({ context })` | CORRETO |
| `hasRequiredFormFields` | `({ context })` | CORRETO |
| `isPixPayment` | `({ context })` | CORRETO |
| `isCardPayment` | `({ context })` | CORRETO |
| `isCardApproved` | `(_, params)` | INCORRETO |

Apenas `isCardApproved` precisa de correção.
