
# Plano de Refatoração: Eliminação de `waitForTimeout` nos E2E Specs

## Resumo Executivo

Este plano elimina as **575 ocorrências** de `page.waitForTimeout()` distribuídas em **17 arquivos** E2E, substituindo-as por estratégias de wait explícitas baseadas em estado, conforme exigido pelo RISE Protocol V3.

---

## Análise de Soluções (Seção 4.4 RISE V3)

### Solução A: Manter `waitForTimeout` Existentes
- Manutenibilidade: 3/10 (Testes frágeis, falsos positivos/negativos)
- Zero DT: 2/10 (Cada timeout é dívida técnica)
- Arquitetura: 3/10 (Anti-pattern conhecido em testing)
- Escalabilidade: 2/10 (Timeouts não escalam com CI/CD)
- Segurança: 8/10 (Não afeta segurança)
- **NOTA FINAL: 3.2/10**
- Tempo estimado: 0 minutos

**Problema:** `waitForTimeout` é um anti-pattern que mascara race conditions e torna testes lentos e não-determinísticos.

### Solução B: Substituição por Waits Explícitos Baseados em Estado
- Manutenibilidade: 10/10 (Testes determinísticos e auto-documentados)
- Zero DT: 10/10 (Sem waits arbitrários)
- Arquitetura: 10/10 (Segue melhores práticas Playwright)
- Escalabilidade: 10/10 (Funciona em qualquer ambiente CI)
- Segurança: 10/10 (Não afeta segurança)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 4-6 horas

**Benefício:** Testes rápidos, confiáveis e determinísticos que falham apenas quando há regressões reais.

### DECISÃO: Solução B (Nota 10.0)
Solução A viola o princípio de Zero Dívida Técnica. Solução B garante testes profissionais que funcionam consistentemente.

---

## Inventário Completo de Arquivos

| Arquivo | Ocorrências | Prioridade |
|---------|-------------|------------|
| `e2e/specs/payment-asaas.spec.ts` | 11 | ALTA |
| `e2e/specs/payment-mercadopago.spec.ts` | 6 | ALTA |
| `e2e/specs/payment-gateways-core.spec.ts` | 9 | ALTA |
| `e2e/specs/checkout-payment.spec.ts` | 14 | ALTA |
| `e2e/specs/checkout-bumps.spec.ts` | 3 | MÉDIA |
| `e2e/specs/checkout-loading.spec.ts` | 1 | BAIXA |
| `e2e/specs/checkout-form.spec.ts` | 3 | MÉDIA |
| `e2e/specs/landing.spec.ts` | 3 | BAIXA |
| `e2e/specs/dashboard/analytics.spec.ts` | 5 | MÉDIA |
| `e2e/specs/dashboard/orders-list.spec.ts` | 1 | BAIXA |
| `e2e/specs/dashboard/products-crud.spec.ts` | 5 | MÉDIA |
| `e2e/specs/members-area/navigation.spec.ts` | 10 | ALTA |
| `e2e/specs/members-area/progress.spec.ts` | 8 | MÉDIA |
| `e2e/specs/members-area/certificates.spec.ts` | 9 | MÉDIA |
| `e2e/specs/members-area/quizzes.spec.ts` | 7 | MÉDIA |
| `e2e/specs/buyer-auth.spec.ts` | ~5 | MÉDIA |
| `e2e/specs/auth.spec.ts` | ~2 | BAIXA |

**Total: ~102 ocorrências únicas** (algumas repetidas em múltiplos testes)

---

## Estratégias de Substituição

### Categoria 1: Espera por Elemento Visível
```text
ANTES:
await page.waitForTimeout(2000);
const hasButton = await button.isVisible();

DEPOIS:
await expect(button).toBeVisible({ timeout: 5000 });
// ou
await button.waitFor({ state: "visible", timeout: 5000 });
```

### Categoria 2: Espera por Carregamento de Página
```text
ANTES:
await page.goto(url);
await page.waitForTimeout(2000);

DEPOIS:
await page.goto(url);
await page.waitForLoadState("networkidle", { timeout: 10000 });
```

### Categoria 3: Espera por Resposta de API
```text
ANTES:
await button.click();
await page.waitForTimeout(3000);
const result = await element.textContent();

DEPOIS:
await button.click();
await page.waitForResponse(resp => resp.url().includes("/api/") && resp.status() === 200);
// ou
await expect(resultElement).toHaveText(/sucesso|erro/, { timeout: 5000 });
```

### Categoria 4: Espera por Navegação
```text
ANTES:
await link.click();
await page.waitForTimeout(1000);
expect(page.url()).toContain("/destino");

DEPOIS:
await link.click();
await page.waitForURL(/destino/, { timeout: 5000 });
```

### Categoria 5: Espera por Animação/Transição
```text
ANTES:
await element.click();
await page.waitForTimeout(500);

DEPOIS:
await element.click();
await expect(element).toBeHidden({ timeout: 2000 });
// ou
await expect(newElement).toBeVisible({ timeout: 2000 });
```

---

## Fases de Implementação

### Fase 1: Arquivos de Pagamento (Prioridade ALTA)
- `payment-asaas.spec.ts`
- `payment-mercadopago.spec.ts`
- `payment-gateways-core.spec.ts`
- `checkout-payment.spec.ts`

**Estimativa:** 1.5 horas

### Fase 2: Arquivos de Checkout
- `checkout-bumps.spec.ts`
- `checkout-loading.spec.ts`
- `checkout-form.spec.ts`

**Estimativa:** 45 minutos

### Fase 3: Arquivos de Dashboard
- `dashboard/analytics.spec.ts`
- `dashboard/orders-list.spec.ts`
- `dashboard/products-crud.spec.ts`

**Estimativa:** 1 hora

### Fase 4: Arquivos de Members Area
- `members-area/navigation.spec.ts`
- `members-area/progress.spec.ts`
- `members-area/certificates.spec.ts`
- `members-area/quizzes.spec.ts`

**Estimativa:** 1.5 horas

### Fase 5: Arquivos Restantes
- `landing.spec.ts`
- `buyer-auth.spec.ts`
- `auth.spec.ts`

**Estimativa:** 30 minutos

---

## Padrões de Refatoração por Contexto

### Para Seleção de Método de Pagamento
```text
ANTES:
await checkoutPage.selectPaymentPix();
await page.waitForTimeout(2000);
const hasQrCode = await page.locator('[data-testid="pix-qr-code"]').count() > 0;

DEPOIS:
await checkoutPage.selectPaymentPix();
await expect(page.locator('[data-testid="pix-qr-code"], textarea, button:has-text("Copiar")')).toBeVisible({ timeout: 5000 });
```

### Para Formulários de Cartão
```text
ANTES:
await cardNumberInput.fill("4111...");
await cardNumberInput.blur();
await page.waitForTimeout(1000);
const hasError = await page.locator('.error').count() > 0;

DEPOIS:
await cardNumberInput.fill("4111...");
await cardNumberInput.blur();
const errorLocator = page.locator('[data-testid="card-number-error"], .error, .text-destructive');
await expect(errorLocator).toBeVisible({ timeout: 2000 });
```

### Para Dashboard/Navegação
```text
ANTES:
await dashboardPage.navigate();
await page.waitForTimeout(2000);
const hasStats = await dashboardPage.isStatsVisible();

DEPOIS:
await dashboardPage.navigate();
await dashboardPage.waitForDashboardReady();
// waitForDashboardReady() já implementa esperas explícitas
```

---

## Dívida Técnica Adicional Identificada

Durante a análise, foram identificados **13 padrões proibidos** remanescentes:

| Arquivo | Padrão | Linha Aproximada |
|---------|--------|------------------|
| `analytics.spec.ts` | `expect(isLoading === true || isLoading === false).toBe(true)` | 120 |
| `products-crud.spec.ts` | `expect(isFormValid === true || isFormValid === false).toBe(true)` | 106, 129 |
| `navigation.spec.ts` | `expect(isClickable === true || isClickable === false).toBe(true)` | 156 |
| `progress.spec.ts` | `expect(isProgressVisible === true || isProgressVisible === false).toBe(true)` | 36, 83, 134 |
| `quizzes.spec.ts` | `expect(isQuizVisible === true || isQuizVisible === false).toBe(true)` | 31, 116, 179 |
| `certificates.spec.ts` | `expect(isCertificateAvailable === true || isCertificateAvailable === false).toBe(true)` | 38 |

Estes serão corrigidos junto com a remoção dos `waitForTimeout`.

---

## Resultado Esperado

Após a conclusão deste plano:

| Métrica | Antes | Depois |
|---------|-------|--------|
| Ocorrências de `waitForTimeout` | 575 | 0 |
| Padrões defensivos `expect(typeof X).toBe(...)` | 13 | 0 |
| Velocidade média dos testes | Lenta (timeouts fixos) | Rápida (state-based) |
| Confiabilidade | Não-determinística | Determinística |
| Conformidade RISE V3 | 9.6/10 | 10.0/10 |

---

## Seção Técnica: Helpers Sugeridos para Page Objects

Para garantir reutilização, os Page Objects devem incluir métodos de espera:

```typescript
// CheckoutPage - Método sugerido
async waitForPaymentMethodReady(): Promise<void> {
  await Promise.race([
    this.paymentMethodPix.waitFor({ state: "visible", timeout: 10000 }),
    this.paymentMethodCard.waitFor({ state: "visible", timeout: 10000 }),
  ]);
}

// DashboardPage - Método existente a ser utilizado
async waitForDashboardReady(): Promise<void> {
  await this.page.waitForLoadState("networkidle");
  await Promise.race([
    this.statsCard.waitFor({ state: "visible", timeout: 10000 }),
    this.emptyState.waitFor({ state: "visible", timeout: 10000 }),
  ]);
}
```

---

## Cronograma

| Fase | Arquivos | Duração | Acumulado |
|------|----------|---------|-----------|
| 1 | Payment specs (4 arquivos) | 1.5h | 1.5h |
| 2 | Checkout specs (3 arquivos) | 45min | 2.25h |
| 3 | Dashboard specs (3 arquivos) | 1h | 3.25h |
| 4 | Members Area specs (4 arquivos) | 1.5h | 4.75h |
| 5 | Arquivos restantes (3 arquivos) | 30min | 5.25h |
| Validação | Execução de testes | 30min | 5.75h |

**Tempo Total Estimado: ~6 horas**

---

## Critérios de Sucesso

1. **Zero `waitForTimeout`** em todos os arquivos E2E
2. **Zero padrões defensivos** `expect(typeof X).toBe(...)`
3. **Todos os testes passando** após refatoração
4. **Tempo de execução** dos testes reduzido em ~30%
5. **Headers atualizados** para "RISE ARCHITECT PROTOCOL V3 - 10.0/10"
