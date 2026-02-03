
# Plano RISE V3: Corrigir Testes Unitários do Status "Recusado"

## Diagnóstico

### Problema Identificado

Os testes unitários em `src/lib/order-status/__tests__/service.test.ts` estão **desatualizados** após a implementação do status "Recusado". O código atual mapeia `failed`, `rejected`, `declined` para `'refused'`, mas os testes ainda esperam `'pending'`.

### Impacto

- Testes falharão se executados
- Inconsistência entre código e documentação
- Viola RISE V3 Seção 4: Zero Dívida Técnica

---

## Análise de Soluções (RISE Protocol V3 Seção 4.4)

### Solução A: Atualizar Todos os Testes Afetados

Corrigir todos os testes para refletir o novo comportamento com status `'refused'`.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | Testes documentam comportamento real |
| Zero DT | 10/10 | Testes sincronizados com código |
| Arquitetura | 10/10 | Cobertura completa do novo status |
| Escalabilidade | 10/10 | Base sólida para testes futuros |
| Segurança | 10/10 | Não afeta segurança |

- **NOTA FINAL: 10.0/10**
- Tempo estimado: 30-45 minutos

### Solução B: Desabilitar Testes Afetados Temporariamente

Marcar testes como `it.skip()` até corrigir depois.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 3/10 | Testes desabilitados = dívida |
| Zero DT | 0/10 | Cria dívida técnica explícita |
| Arquitetura | 2/10 | Viola boas práticas |
| Escalabilidade | 2/10 | Problemas escondidos |
| Segurança | 10/10 | Não afeta segurança |

- **NOTA FINAL: 2.8/10**
- Tempo estimado: 5 minutos

### DECISÃO: Solução A (Nota 10.0/10)

A Solução B viola diretamente o mandamento "Podemos melhorar depois..." que está PROIBIDO pelo Protocolo RISE V3.

---

## Plano de Implementação

### Arquivo a Modificar

```text
src/lib/order-status/__tests__/service.test.ts
```

### Alterações Detalhadas

#### 1. Adicionar teste para `getDisplayLabel("refused")`

```typescript
it("should return 'Recusado' for refused status (cartão recusado)", () => {
  expect(orderStatusService.getDisplayLabel("refused")).toBe("Recusado");
});
```

#### 2. Corrigir teste da linha 57-58

**Antes:**
```typescript
it("should return 'Pendente' for failed status (padrão mercado)", () => {
  expect(orderStatusService.getDisplayLabel("failed")).toBe("Pendente");
});
```

**Depois:**
```typescript
it("should return 'Recusado' for failed status (cartão recusado)", () => {
  expect(orderStatusService.getDisplayLabel("failed")).toBe("Recusado");
});
```

#### 3. Adicionar teste para cores do status "refused"

```typescript
it("should return orange scheme for refused", () => {
  const colors = orderStatusService.getColorScheme("refused");
  expect(colors.bg).toContain("orange");
  expect(colors.text).toContain("orange");
});
```

#### 4. Corrigir seção "Failed/Rejected mappings" (linhas 154-159)

**Antes:**
```typescript
describe("Failed/Rejected mappings → pending (padrão mercado)", () => {
  const failedStatuses = ["failed", "rejected", "error", "declined"];
  
  it.each(failedStatuses)("should map %s to pending (padrão mercado)", (status) => {
    expect(orderStatusService.normalize(status)).toBe("pending");
  });
});
```

**Depois:**
```typescript
describe("Failed/Rejected mappings → refused (cartão recusado)", () => {
  const failedStatuses = ["failed", "rejected", "error", "declined", "refused", "card_declined", "cc_rejected"];
  
  it.each(failedStatuses)("should map %s to refused", (status) => {
    expect(orderStatusService.normalize(status)).toBe("refused");
  });
});
```

#### 5. Corrigir teste `isPending("failed")` (linha 226-227)

**Antes:**
```typescript
it("should return true for failed (padrão mercado)", () => {
  expect(orderStatusService.isPending("failed")).toBe(true);
});
```

**Depois:**
```typescript
it("should return false for failed (cartão recusado não é pending)", () => {
  expect(orderStatusService.isPending("failed")).toBe(false);
});
```

#### 6. Adicionar seção completa para `isRefused()`

```typescript
// ========== IS REFUSED ==========

describe("isRefused", () => {
  it("should return true for refused", () => {
    expect(orderStatusService.isRefused("refused")).toBe(true);
  });

  it("should return true for rejected (gateway)", () => {
    expect(orderStatusService.isRefused("rejected")).toBe(true);
  });

  it("should return true for declined (gateway)", () => {
    expect(orderStatusService.isRefused("declined")).toBe(true);
  });

  it("should return true for failed (gateway)", () => {
    expect(orderStatusService.isRefused("failed")).toBe(true);
  });

  it("should return true for card_declined (gateway)", () => {
    expect(orderStatusService.isRefused("card_declined")).toBe(true);
  });

  it("should return false for paid", () => {
    expect(orderStatusService.isRefused("paid")).toBe(false);
  });

  it("should return false for pending", () => {
    expect(orderStatusService.isRefused("pending")).toBe(false);
  });

  it("should return false for null", () => {
    expect(orderStatusService.isRefused(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(orderStatusService.isRefused(undefined)).toBe(false);
  });
});
```

#### 7. Corrigir `getAllStatuses` (linha 307)

**Antes:**
```typescript
expect(statuses).toHaveLength(4);
```

**Depois:**
```typescript
expect(statuses).toHaveLength(5);
```

#### 8. Corrigir `getStatusOptions` (linha 317)

**Antes:**
```typescript
expect(options).toHaveLength(4);
```

**Depois:**
```typescript
expect(options).toHaveLength(5);
```

#### 9. Adicionar teste para label do status "refused"

```typescript
it("should have correct label for refused status", () => {
  const options = orderStatusService.getStatusOptions();
  expect(options.find(o => o.value === "refused")?.label).toBe("Recusado");
});
```

#### 10. Atualizar comentário do service.ts (linha 38)

**Antes:**
```typescript
* - Apenas 4 status canônicos: paid, pending, refunded, chargeback
```

**Depois:**
```typescript
* - 5 status canônicos: paid, pending, refused, refunded, chargeback
```

---

## Validação Pós-Correção

Após as correções:

| Verificação | Critério |
|-------------|----------|
| Testes passam | `npm test -- service.test.ts` deve passar 100% |
| Cobertura de `refused` | Todos os métodos testados com status "refused" |
| Comentários atualizados | Documentação reflete 5 status |
| Consistência | Código e testes em sincronia |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Manutenibilidade Infinita | Testes documentam comportamento |
| Zero Dívida Técnica | Testes sincronizados com código |
| Arquitetura Correta | Cobertura completa |
| Escalabilidade | Base para testes futuros |
| Segurança | Não afetada |

**RISE V3 Score: 10.0/10**

---

## Resumo das Correções

| Local | Alteração |
|-------|-----------|
| Linha 57-58 | `failed` → `"Recusado"` |
| Linha 96-111 (getColorScheme) | Adicionar teste para `refused` → orange |
| Linhas 154-159 | `failed/rejected/declined` → `refused` (não `pending`) |
| Linhas 226-227 | `isPending("failed")` → `false` |
| Após linha 241 | Nova seção `isRefused()` com 9 testes |
| Linha 307 | `toHaveLength(5)` |
| Linha 317 | `toHaveLength(5)` |
| Linhas 322-329 | Adicionar teste para label "Recusado" |
| `service.ts` linha 38 | Comentário: "5 status canônicos" |
