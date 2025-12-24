# Relatório de Problema: Validação Visual dos Iframes do Mercado Pago SDK

**Data:** 27 de Novembro de 2025  
**Autor:** Manus AI  
**Projeto:** RiseCheckout - Refatoração 2.0

---

## 1. Objetivo

Implementar uma validação visual robusta para os campos de Cartão de Crédito (Número, Validade e CVV), que são renderizados em iframes cross-origin pelo SDK do Mercado Pago. O comportamento esperado é:

1.  Campos vazios ou inválidos devem exibir uma **borda vermelha** e uma **mensagem de erro**.
2.  O erro do campo "Número do Cartão" deve **desaparecer** assim que o usuário começa a digitar.
3.  Os erros dos campos "Validade" e "CVV" devem ser re-validados a cada nova tentativa de submissão.

---

## 2. Estado Atual: Validação Quebrada

Após a última tentativa de correção (commit `6e5df66`), a validação dos campos do SDK parou de funcionar completamente. 

-   Ao clicar em "Pagar com Cartão" com todos os campos vazios, **apenas os campos que não são do SDK (Nome, CPF) ficam vermelhos**. 
-   Os campos do SDK (Número do Cartão, Validade, CVV) **não recebem a borda vermelha** nem exibem mensagens de erro, mesmo estando vazios.

![image](https://i.imgur.com/9O5E3Jg.png)
*(Screenshot do problema atual)*

---

## 3. Histórico de Tentativas e Falhas

### Tentativa 1: `addEventListener` (Falhou)

-   **Abordagem:** Adicionar `event listeners` de `click` ou `focus` diretamente nos `divs` que contêm os iframes.
-   **Resultado:** Falhou. Devido à política de segurança cross-origin, o JavaScript da nossa página não pode detectar eventos que ocorrem dentro dos iframes do domínio `mercadopago.com`.

### Tentativa 2: Solução do Gemini (Inconsistente)

-   **Abordagem (Commit `ebc9b33`):**
    1.  Usar o callback `onBinChange` do SDK para limpar o erro do campo de cartão (`clearFieldError('cardNumber')`).
    2.  Adicionar `setFieldErrors({})` no início da função `submit` para limpar todos os erros antes de uma nova tentativa.
-   **Resultado:** Gerou inconsistências graves:
    -   Se o campo de cartão estivesse vazio, mas Validade/CVV preenchidos, clicar em "Pagar" marcava os 3 campos como inválidos.
    -   Digitar apenas 1 dígito no cartão limpava os erros de Validade e CVV, mesmo que eles estivessem errados.
    -   A causa raiz foi o `setFieldErrors({})`, que limpava o estado de forma indiscriminada.

### Tentativa 3: Refinamento da Lógica (Falha Atual)

-   **Abordagem (Commit `6e5df66`):**
    1.  **Remover** o `setFieldErrors({})` do início da função `submit`.
    2.  **Melhorar** o callback `onFormTokenError` para ser mais genérico e capturar mensagens de erro de campos vazios (`required`, `empty`).
-   **Resultado:** A validação dos iframes parou completamente. O `onFormTokenError` parece **não ser disparado pelo SDK** quando os campos estão completamente vazios. Ele só é ativado quando há dados a serem validados (mesmo que inválidos).

---

## 4. Código Relevante Atual (`useMercadoPagoBrick.ts`)

```typescript
// ... (imports e setup inicial)

export function useMercadoPagoBrick(...) {
  // ... (useState, useRefs)

  // ✅ CORRETO: Limpa apenas o erro do campo especificado
  const clearFieldError = useCallback((field: keyof FieldErrors) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // ... (useEffect de inicialização)
  
  const cardForm = mp.cardForm({
    // ... (config do form)
    callbacks: {
      // ✅ CORRETO: Limpa o erro do cartão ao digitar
      onBinChange: (bin: string) => {
        clearFieldError('cardNumber');
      },

      // 🚨 PROBLEMA AQUI: Parece não ser chamado para campos vazios
      onFormTokenError: (error: any) => {
        const errors: FieldErrors = {};
        const errorList = Array.isArray(error) ? error : (error.cause || [error]);
        
        errorList.forEach((e: any) => {
          const msg = String(e.message || '').toLowerCase();

          if (msg.includes('card number') || msg.includes('cardnumber')) {
            errors.cardNumber = msg.includes('empty') ? "Número do cartão é obrigatório" : "Número inválido";
          }
          if (msg.includes('expiration') || msg.includes('expiry')) {
            errors.expirationDate = msg.includes('empty') ? "Validade é obrigatória" : "Data inválida";
          }
          if (msg.includes('security') || msg.includes('cvv')) {
            errors.securityCode = msg.includes('empty') ? "CVV é obrigatório" : "CVV inválido";
          }
        });

        if (Object.keys(errors).length > 0) {
          setFieldErrors(prev => ({ ...prev, ...errors }));
        }
      },
      // ... (outros callbacks)
    }
  });

  // ... (useEffect de CSS)

  const submit = async () => {
    // ...
    let tokenData;
    try {
      // 🚨 PROBLEMA AQUI: O catch não é ativado se os campos estiverem vazios
      tokenData = await cardFormRef.current.createCardToken(...);
    } catch (error: any) {
      // Esta lógica raramente é alcançada com campos vazios
      throw error;
    }

    // 🚨 PROBLEMA AQUI: Esta validação é a única que funciona, mas é um fallback
    if (!tokenData?.id) {
        setFieldErrors({
          cardNumber: "Número do cartão é obrigatório",
          expirationDate: "Validade é obrigatória",
          securityCode: "CVV é obrigatório"
        });
        throw new Error('Dados do cartão inválidos');
    }
    // ...
  };

  return { ... };
}
```

---

## 5. Pergunta para o Gemini

Considerando que:
-   Não podemos acessar os iframes (cross-origin).
-   O callback `onFormTokenError` não parece ser confiável para campos **vazios**.
-   O `try/catch` em `createCardToken` também não captura o erro de campos vazios de forma consistente.

**Qual seria a estratégia "Clean Code" para forçar a validação e exibição de erros nos campos do SDK (Número, Validade, CVV) quando o usuário clica em "Pagar" e eles estão vazios?**

Estamos presos neste último bug para concluir a refatoração. Qualquer ajuda seria muito apreciada.
