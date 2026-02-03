
# Plano RISE V3: Unificar Cores de Status Negativos para Vermelho

## Diagnóstico

O usuário identificou inconsistência visual: status "Reembolso" está em azul, mas todos os status negativos (Recusado, Reembolso, Chargeback) devem ser **vermelho** para comunicar claramente "problema/perda".

### Estado Atual vs Desejado

| Status | Cor Atual | Cor Desejada | Mudança |
|--------|-----------|--------------|---------|
| Pago | Verde (emerald) | Verde | Manter |
| Pendente | Amarelo (amber) | Amarelo | Manter |
| Recusado | Laranja (orange) | **Vermelho (red)** | Alterar |
| Reembolso | Azul (blue) | **Vermelho (red)** | Alterar |
| Chargeback | Vermelho (red) | Vermelho | Manter |

---

## Análise de Soluções (RISE Protocol V3 Seção 4.4)

### Solução A: Atualizar Todos os Arquivos de Cores

Modificar a fonte da verdade (types.ts) e todos os arquivos que definem cores de status.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | SSOT atualizado, UI consistente |
| Zero DT | 10/10 | Todas as referências sincronizadas |
| Arquitetura | 10/10 | Padrão visual coerente |
| Escalabilidade | 10/10 | Fácil adicionar novos status |
| Segurança | 10/10 | Não afeta segurança |

- **NOTA FINAL: 10.0/10**
- Tempo estimado: 30 minutos

### Solução B: Apenas Atualizar types.ts

Confiar que os outros arquivos usam a fonte da verdade.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 7/10 | Arquivos com cores hardcoded não serão atualizados |
| Zero DT | 6/10 | CustomerTableRow.tsx tem cores inline |
| Arquitetura | 6/10 | Inconsistência entre componentes |
| Escalabilidade | 7/10 | Problema parcialmente resolvido |
| Segurança | 10/10 | Não afeta segurança |

- **NOTA FINAL: 7.0/10**
- Tempo estimado: 10 minutos

### DECISÃO: Solução A (Nota 10.0/10)

A Solução B deixaria o `CustomerTableRow.tsx` e `statusConfig.ts` com cores desatualizadas, criando dívida técnica explícita.

---

## Plano de Implementação

### Arquivos a Modificar

```text
src/lib/order-status/types.ts           (SSOT)
src/components/dashboard/order-details/statusConfig.ts
src/components/dashboard/recent-customers/CustomerTableRow.tsx
src/lib/order-status/__tests__/service.test.ts
docs/ORDER_STATUS_MODEL.md
```

---

### 1. `src/lib/order-status/types.ts` (Linhas 110-121)

Alterar cores de `refused` e `refunded` para vermelho:

**De:**
```typescript
refused: {
  bg: 'bg-orange-500/10',
  text: 'text-orange-500',
  border: 'border-orange-500/20',
  dot: 'bg-orange-500',
},
refunded: {
  bg: 'bg-blue-500/10',
  text: 'text-blue-500',
  border: 'border-blue-500/20',
  dot: 'bg-blue-500',
},
```

**Para:**
```typescript
refused: {
  bg: 'bg-red-500/10',
  text: 'text-red-500',
  border: 'border-red-500/20',
  dot: 'bg-red-500',
},
refunded: {
  bg: 'bg-red-500/10',
  text: 'text-red-500',
  border: 'border-red-500/20',
  dot: 'bg-red-500',
},
```

---

### 2. `src/components/dashboard/order-details/statusConfig.ts` (Linhas 29-42)

**De:**
```typescript
case "Recusado":
  return {
    color: "bg-orange-500/10 text-orange-700 border-orange-500/20",
    icon: XCircle,
    iconColor: "text-orange-600",
    gradient: "from-orange-500/5 to-transparent"
  };
case "Reembolso":
  return {
    color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    icon: XCircle,
    iconColor: "text-blue-600",
    gradient: "from-blue-500/5 to-transparent"
  };
```

**Para:**
```typescript
case "Recusado":
  return {
    color: "bg-red-500/10 text-red-700 border-red-500/20",
    icon: XCircle,
    iconColor: "text-red-600",
    gradient: "from-red-500/5 to-transparent"
  };
case "Reembolso":
  return {
    color: "bg-red-500/10 text-red-700 border-red-500/20",
    icon: XCircle,
    iconColor: "text-red-600",
    gradient: "from-red-500/5 to-transparent"
  };
```

---

### 3. `src/components/dashboard/recent-customers/CustomerTableRow.tsx` (Linhas 67-72)

**De:**
```typescript
: customer.status === "Recusado"
? "bg-orange-500/10 text-orange-500 border-orange-500/20"
: customer.status === "Reembolso"
? "bg-blue-500/10 text-blue-500 border-blue-500/20"
: customer.status === "Chargeback"
? "bg-red-500/10 text-red-500 border-red-500/20"
```

**Para:**
```typescript
: customer.status === "Recusado"
? "bg-red-500/10 text-red-500 border-red-500/20"
: customer.status === "Reembolso"
? "bg-red-500/10 text-red-500 border-red-500/20"
: customer.status === "Chargeback"
? "bg-red-500/10 text-red-500 border-red-500/20"
```

---

### 4. `src/lib/order-status/__tests__/service.test.ts` (Linhas 101-111)

**De:**
```typescript
it("should return orange scheme for refused (cartão recusado)", () => {
  const colors = orderStatusService.getColorScheme("refused");
  expect(colors.bg).toContain("orange");
  expect(colors.text).toContain("orange");
});

it("should return blue scheme for refunded", () => {
  const colors = orderStatusService.getColorScheme("refunded");
  expect(colors.bg).toContain("blue");
  expect(colors.text).toContain("blue");
});
```

**Para:**
```typescript
it("should return red scheme for refused (cartão recusado)", () => {
  const colors = orderStatusService.getColorScheme("refused");
  expect(colors.bg).toContain("red");
  expect(colors.text).toContain("red");
});

it("should return red scheme for refunded", () => {
  const colors = orderStatusService.getColorScheme("refunded");
  expect(colors.bg).toContain("red");
  expect(colors.text).toContain("red");
});
```

---

### 5. `docs/ORDER_STATUS_MODEL.md` (Linhas 49-66)

Atualizar tabela de cores e exemplo de código:

**De:**
```markdown
| `refused` | Recusado | 🟠 Laranja (orange) | Cartão recusado |
| `refunded` | Reembolso | 🔵 Azul (blue) | Valor devolvido |

refused: { bg: 'bg-orange-500/10', text: 'text-orange-500', dot: 'bg-orange-500' },
refunded: { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500' },
```

**Para:**
```markdown
| `refused` | Recusado | 🔴 Vermelho (red) | Cartão recusado |
| `refunded` | Reembolso | 🔴 Vermelho (red) | Valor devolvido |

refused: { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500' },
refunded: { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500' },
```

---

## Semântica Visual Final

| Status | Cor | Semântica |
|--------|-----|-----------|
| Pago | Verde | Sucesso, dinheiro recebido |
| Pendente | Amarelo | Atenção, aguardando ação |
| Recusado | Vermelho | Problema, perda potencial |
| Reembolso | Vermelho | Problema, dinheiro devolvido |
| Chargeback | Vermelho | Problema, contestação |

---

## Validação Pós-Correção

| Verificação | Critério |
|-------------|----------|
| types.ts | refused e refunded = red |
| statusConfig.ts | Recusado e Reembolso = red |
| CustomerTableRow.tsx | Recusado e Reembolso = red |
| Testes | Esperam "red" para refused/refunded |
| Documentação | Atualizada com cores corretas |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Manutenibilidade Infinita | Cores semânticas coerentes |
| Zero Dívida Técnica | Todos os arquivos sincronizados |
| Arquitetura Correta | SSOT respeitado |
| Escalabilidade | Padrão claro para novos status |
| Segurança | Não afetada |

**RISE V3 Score: 10.0/10**

---

## Seção Técnica

### Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `types.ts` | refused/refunded → red-500 |
| `statusConfig.ts` | Recusado/Reembolso → red |
| `CustomerTableRow.tsx` | Recusado/Reembolso → red |
| `service.test.ts` | Testes esperam "red" |
| `ORDER_STATUS_MODEL.md` | Documentação atualizada |
