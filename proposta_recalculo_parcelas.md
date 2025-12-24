# Proposta: Recálculo Automático de Parcelas do Cartão

## O Problema

Quando o usuário marca ou desmarca bumps no checkout, o valor total muda, mas as parcelas do cartão de crédito **não são recalculadas**. Elas ficam "travadas" no valor antigo.

### Exemplo do Problema

1. Usuário seleciona formulário de cartão → Parcelas carregam com R$ 29,90
2. Usuário marca 3 bumps → Total vira R$ 41,87
3. **BUG:** Parcelas continuam mostrando R$ 29,90 ❌

### O Que Deveria Acontecer

Quando o usuário marca/desmarca bumps, as parcelas deveriam **recarregar automaticamente** com o novo valor, mostrando "Carregando parcelas..." brevemente.

## Análise Técnica

### Fluxo Atual

1. `PublicCheckout.tsx` (linha 1397) passa `amount={toReais(logic.calculateTotal())}` para `PaymentSection`
2. `PaymentSection` repassa o `amount` para `CustomCardForm`
3. `CustomCardForm` carrega as parcelas **UMA VEZ** quando o componente é montado (linha 862)
4. Quando `amount` muda, o componente **NÃO recarrega** as parcelas

### Código Problemático

**CustomCardForm.tsx (linhas 506-524 e 862):**

```typescript
useEffect(() => {
  // ... código de inicialização do SDK ...
  
  // Buscar parcelas antecipadamente com BIN de teste
  mp.getInstallments({
    amount: amount.toString(),
    bin: '520000',
    locale: 'pt-BR'
  }).then((data: any) => {
    if (data && data.length > 0) {
      const payerCosts = data[0].payer_costs;
      setInstallments(payerCosts);
    }
  });
  
  // ... resto do código ...
  
}, []); // ❌ Array vazio = executa apenas UMA vez
```

## Solução Proposta

Adicionar um `useEffect` **separado** que monitora mudanças no `amount` e recarrega as parcelas quando necessário.

### Implementação

**Adicionar após o useEffect principal (após linha 862):**

```typescript
// ✅ NOVO: Recalcular parcelas quando o valor total mudar
useEffect(() => {
  // Só executa se o formulário já foi montado e o SDK está pronto
  if (!formMountedRef.current || !window.MercadoPago || !mercadoPagoPublicKey) {
    return;
  }
  
  console.log('[CustomCardForm] Valor mudou, recalculando parcelas...', amount);
  
  // Criar instância do MercadoPago
  const mp = new window.MercadoPago(mercadoPagoPublicKey, {
    locale: 'pt-BR'
  });
  
  // Buscar parcelas com o novo valor
  mp.getInstallments({
    amount: amount.toString(),
    bin: '520000', // BIN de teste (Mastercard)
    locale: 'pt-BR'
  }).then((data: any) => {
    if (data && data.length > 0) {
      const payerCosts = data[0].payer_costs;
      console.log('[CustomCardForm] Parcelas atualizadas:', payerCosts);
      setInstallments(payerCosts);
    }
  }).catch((error: any) => {
    console.warn('[CustomCardForm] Erro ao recalcular parcelas:', error);
  });
  
}, [amount, mercadoPagoPublicKey]); // ✅ Executa quando amount ou publicKey mudar
```

## Benefícios

1. ✅ **UX Melhorada:** Parcelas sempre refletem o valor atual
2. ✅ **Transparência:** Usuário vê exatamente quanto vai pagar
3. ✅ **Sem Confusão:** Não há discrepância entre resumo e parcelas
4. ✅ **Baixo Risco:** Código isolado, não afeta fluxo existente

## Riscos e Mitigações

### Risco 1: Loop Infinito

**Problema:** Se o `amount` mudar muito rápido, pode causar múltiplas requisições.

**Mitigação:** O `useEffect` só executa quando `formMountedRef.current === true`, garantindo que o formulário está pronto.

### Risco 2: Flicker Visual

**Problema:** As parcelas podem "piscar" ao serem atualizadas.

**Mitigação:** Já existe um placeholder "Carregando parcelas..." (linha 1193) que aparece quando `installments.length === 0`.

### Risco 3: Requisições Desnecessárias

**Problema:** Pode fazer requisições mesmo quando o formulário não está visível.

**Mitigação:** O `useEffect` verifica `formMountedRef.current` antes de executar.

## Alternativa (Mais Conservadora)

Se preferir uma abordagem mais conservadora, podemos adicionar um **debounce** para evitar requisições excessivas:

```typescript
useEffect(() => {
  if (!formMountedRef.current || !window.MercadoPago || !mercadoPagoPublicKey) {
    return;
  }
  
  // Debounce de 500ms
  const timer = setTimeout(() => {
    console.log('[CustomCardForm] Recalculando parcelas...');
    
    const mp = new window.MercadoPago(mercadoPagoPublicKey, {
      locale: 'pt-BR'
    });
    
    mp.getInstallments({
      amount: amount.toString(),
      bin: '520000',
      locale: 'pt-BR'
    }).then((data: any) => {
      if (data && data.length > 0) {
        setInstallments(data[0].payer_costs);
      }
    }).catch((error: any) => {
      console.warn('[CustomCardForm] Erro ao recalcular parcelas:', error);
    });
  }, 500);
  
  return () => clearTimeout(timer); // Limpa timer se amount mudar novamente
  
}, [amount, mercadoPagoPublicKey]);
```

## Recomendação

Implementar a **solução com debounce** (alternativa) por ser mais robusta e evitar requisições desnecessárias quando o usuário marca/desmarca bumps rapidamente.

## Conclusão

Esta é uma melhoria de UX importante que garante consistência entre o valor total exibido e as parcelas calculadas. A implementação é simples, isolada e de baixo risco.
