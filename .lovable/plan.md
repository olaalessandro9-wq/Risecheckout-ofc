
# Plano de Refatoração: checkout-submit.spec.ts

## Objetivo
Eliminar os 2 padrões defensivos `expect(typeof X).toBe("boolean")` e substituí-los por asserções assertivas que validam o comportamento real da UI, em conformidade com o RISE Protocol V3.

---

## Análise de Soluções (Seção 4.4 RISE V3)

### Solução A: Manter Padrão Defensivo
- Manutenibilidade: 0/10
- Zero DT: 0/10
- Arquitetura: 0/10
- Escalabilidade: 0/10
- Segurança: 5/10
- **NOTA FINAL: 0.5/10**
- Tempo estimado: 0 minutos

**Problema:** Violação direta do RISE Protocol V3. Testes que apenas verificam tipo não validam comportamento.

### Solução B: Asserções Assertivas com Expectativa de Estado
- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 15 minutos

**Benefício:** Testes validam comportamentos reais da UI. Se o loading spinner ou success indicator não aparecerem, o teste falha assertivamente.

### DECISÃO: Solução B (Nota 10.0)
Solução A é uma violação direta do protocolo. Solução B garante que os testes validam comportamento real.

---

## Problemas Identificados

| Linha | Padrão Proibido | Contexto |
|-------|-----------------|----------|
| 59 | `expect(typeof isLoading).toBe("boolean")` | Teste de loading state durante submit |
| 81 | `expect(typeof isSuccessful).toBe("boolean")` | Teste de success indicator na página de sucesso |

---

## Alterações Técnicas

### Arquivo: `e2e/specs/checkout-submit.spec.ts`

#### 1. Teste "should show loading state during submission" (linhas 37-62)

**Antes:**
```typescript
if (await checkoutPage.submitButton.isVisible()) {
  await checkoutPage.submit();
  
  await page.waitForTimeout(200);
  const isLoading = await checkoutPage.isLoading();
  
  expect(typeof isLoading).toBe("boolean");
}
```

**Depois:**
```typescript
// Aguardar submit button estar pronto
await expect(checkoutPage.submitButton).toBeVisible({ timeout: 5000 });
await expect(checkoutPage.submitButton).toBeEnabled();

// Preencher formulário com dados válidos
await checkoutPage.fillEmail(TEST_CHECKOUT.customer.email);
if (await checkoutPage.nameInput.isVisible()) {
  await checkoutPage.fillName(TEST_CHECKOUT.customer.name);
}
if (await checkoutPage.paymentMethodPix.isVisible()) {
  await checkoutPage.selectPaymentPix();
}

// Submeter e verificar comportamento de loading
await checkoutPage.submit();

// Verificar que o botão muda para estado de loading OU navega
const loadingOrNavigation = await Promise.race([
  checkoutPage.loadingSpinner.waitFor({ state: "visible", timeout: 2000 }).then(() => "loading"),
  page.waitForURL(/pix|success/, { timeout: 5000 }).then(() => "navigated")
]).catch(() => "timeout");

expect(["loading", "navigated"]).toContain(loadingOrNavigation);
```

**Justificativa:** Em vez de apenas verificar que `isLoading()` retorna boolean, o teste agora valida que:
1. O formulário pode ser preenchido
2. O submit pode ser executado
3. O sistema responde com loading spinner OU navegação

#### 2. Teste "success page should show success indicator" (linhas 73-82)

**Antes:**
```typescript
const isSuccessful = await successPage.isSuccessful();

expect(typeof isSuccessful).toBe("boolean");
```

**Depois:**
```typescript
// Aguardar página de sucesso carregar completamente
await successPage.waitForSuccess();

// Verificar que indicadores de sucesso estão visíveis
const hasSuccessIcon = await successPage.successIcon.isVisible();
const hasSuccessTitle = await successPage.successTitle.isVisible();

// Pelo menos um indicador de sucesso DEVE estar presente
expect(hasSuccessIcon || hasSuccessTitle).toBe(true);
```

**Justificativa:** Em vez de apenas verificar tipo, agora o teste:
1. Usa o helper `waitForSuccess()` que já existe no Page Object
2. Verifica que elementos visuais de sucesso estão presentes
3. Falha assertivamente se nenhum indicador existir

---

## Melhorias Adicionais

### Remoção de `waitForTimeout` desnecessários
Os `page.waitForTimeout(2000)` serão substituídos por waits explícitos baseados em estado, tornando os testes mais rápidos e confiáveis.

### Simplificação do fluxo
O teste de submit será reestruturado para:
1. Usar `expect().toBeVisible()` em vez de `if (await X.isVisible())`
2. Remover condicionais aninhados que mascaravam falhas
3. Garantir que o teste falha se os elementos esperados não existirem

---

## Resultado Final

O arquivo terá:
- 0 padrões defensivos `expect(typeof X).toBe("boolean")`
- 0 `waitForTimeout` arbitrários
- 100% conformidade com RISE Protocol V3
- Testes que validam comportamento real da UI
