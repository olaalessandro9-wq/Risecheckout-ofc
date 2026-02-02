

# Plano de Correção: Eliminação de Padrões Defensivos Restantes

## Objetivo
Corrigir as 8 ocorrências restantes de `expect(typeof X).toBe("boolean")` para atingir conformidade 10.0/10 com RISE Protocol V3.

---

## Inventário de Dívida Técnica

| Arquivo | Linha | Padrão Proibido | Contexto |
|---------|-------|-----------------|----------|
| `members-area/certificates.spec.ts` | 36 | `expect(typeof isCertificateAvailable).toBe("boolean")` | Teste de disponibilidade de certificado |
| `members-area/progress.spec.ts` | 35 | `expect(typeof isProgressVisible).toBe("boolean")` | Teste de barra de progresso |
| `members-area/progress.spec.ts` | 129 | `expect(typeof isDisabled).toBe("boolean")` | Teste de lição bloqueada |
| `members-area/progress.spec.ts` | 146 | `expect(typeof hasDripMessage).toBe("boolean")` | Teste de drip content |
| `members-area/quizzes.spec.ts` | 30 | `expect(typeof isQuizVisible).toBe("boolean")` | Teste de quiz visível |
| `members-area/quizzes.spec.ts` | 114 | `expect(typeof isDisabled).toBe("boolean")` | Teste de botão submit |
| `members-area/quizzes.spec.ts` | 176 | `expect(typeof hasFeedback).toBe("boolean")` | Teste de feedback |
| `members-area/navigation.spec.ts` | 153 | `expect(typeof isLocked).toBe("boolean")` | Teste de lição bloqueada |
| `dashboard/products-crud.spec.ts` | 108 | `expect(typeof isFormValid).toBe("boolean")` | Teste de validação de formulário |

---

## Estratégia de Correção

Cada asserção defensiva será substituída por uma validação assertiva que verifica comportamento real:

### Padrão de Substituição

```text
ANTES (Defensivo - Proibido):
const isX = await someMethod();
expect(typeof isX).toBe("boolean");

DEPOIS (Assertivo - Correto):
// Se o valor DEVE ser true:
const isX = await someMethod();
expect(isX).toBe(true);

// Se o valor pode variar baseado em estado:
const isX = await someMethod();
if (isX) {
  // Validar consequência de isX === true
  await expect(someElement).toBeVisible();
} else {
  // Validar consequência de isX === false
  await expect(alternativeElement).toBeVisible();
}
```

---

## Correções por Arquivo

### 1. `members-area/certificates.spec.ts` (1 correção)

**Linha 36** - Teste de disponibilidade de certificado:
```typescript
// ANTES:
expect(typeof isCertificateAvailable).toBe("boolean");

// DEPOIS:
// O teste já tem lógica condicional abaixo - a asserção é redundante
// Remover a asserção e deixar o fluxo condicional validar o comportamento
if (isCertificateAvailable) {
  await membersAreaPage.openCertificate();
  await expect(membersAreaPage.certificatePreview).toBeVisible({ timeout: 10000 });
}
// Nenhuma asserção de tipo necessária - o fluxo valida comportamento
```

### 2. `members-area/progress.spec.ts` (3 correções)

**Linha 35** - Barra de progresso:
```typescript
// ANTES:
expect(typeof isProgressVisible).toBe("boolean");

// DEPOIS:
// Validar que a página está em estado consistente
if (isProgressVisible) {
  await expect(membersAreaPage.progressBar).toBeVisible();
}
// Remover asserção de tipo
```

**Linha 129** - Lição bloqueada:
```typescript
// ANTES:
expect(typeof isDisabled).toBe("boolean");

// DEPOIS:
// O elemento já foi verificado por avaliação - validar consequência
if (isDisabled) {
  // Lição está bloqueada - não deve ser clicável
  await expect(firstLocked).toHaveAttribute("data-locked", "true");
}
```

**Linha 146** - Drip content:
```typescript
// ANTES:
expect(typeof hasDripMessage).toBe("boolean");

// DEPOIS:
// Validar presença da mensagem de drip se existir
if (hasDripMessage) {
  await expect(page.locator(':has-text("disponível"), :has-text("liberado")')).toBeVisible();
}
```

### 3. `members-area/quizzes.spec.ts` (3 correções)

**Linha 30** - Quiz visível:
```typescript
// ANTES:
expect(typeof isQuizVisible).toBe("boolean");

// DEPOIS:
// O teste já usa isQuizVisible como condição - remover asserção redundante
// A lógica if (isQuizVisible) { ... } já valida o comportamento
```

**Linha 114** - Botão submit:
```typescript
// ANTES:
expect(typeof isDisabled).toBe("boolean");

// DEPOIS:
// Validar estado real do botão
await expect(membersAreaPage.quizSubmitButton).toBeVisible();
// Se quisermos verificar estado enabled/disabled:
// await expect(membersAreaPage.quizSubmitButton).toBeEnabled();
// OU
// await expect(membersAreaPage.quizSubmitButton).toBeDisabled();
```

**Linha 176** - Feedback:
```typescript
// ANTES:
expect(typeof hasFeedback).toBe("boolean");

// DEPOIS:
// Validar presença de feedback se existir
if (hasFeedback) {
  await expect(membersAreaPage.quizFeedback).toBeVisible();
}
```

### 4. `members-area/navigation.spec.ts` (1 correção)

**Linha 153** - Lição bloqueada:
```typescript
// ANTES:
expect(typeof isLocked).toBe("boolean");

// DEPOIS:
// O teste já está dentro de um if (lessonCount > 0)
// Validar consequência do estado locked/unlocked
if (isLocked) {
  await expect(firstLesson).toHaveAttribute("data-locked", "true");
} else {
  // Lição desbloqueada deve ser clicável
  await expect(firstLesson).not.toHaveAttribute("data-locked", "true");
}
```

### 5. `dashboard/products-crud.spec.ts` (1 correção)

**Linha 108** - Validação de formulário:
```typescript
// ANTES:
expect(typeof isFormValid).toBe("boolean");

// DEPOIS:
// Validar estado real do formulário
if (!isFormValid) {
  // Formulário inválido deve mostrar erro
  const errorIndicator = page.locator('.text-destructive, [data-error]');
  await expect(errorIndicator.first()).toBeVisible({ timeout: 3000 });
}
```

---

## Seção Técnica: Princípio RISE V3 Aplicado

O princípio central sendo aplicado:

> **"Testes que validam tipo em vez de comportamento são inúteis."**

Verificar `typeof X === "boolean"` NUNCA falha para um método que retorna boolean. Isso significa:
1. O teste passa mesmo se o comportamento estiver quebrado
2. Não detecta regressões
3. Não valida a experiência do usuário

A solução correta é validar a **consequência** do estado, não o tipo do estado.

---

## Resultado Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Padrões defensivos `expect(typeof X).toBe("boolean")` | 8 | 0 |
| Conformidade RISE V3 | 9.7/10 | 10.0/10 |

---

## Tempo Estimado

| Fase | Tempo |
|------|-------|
| Correção dos 5 arquivos | 15 minutos |
| Validação | 5 minutos |
| **Total** | **20 minutos** |

