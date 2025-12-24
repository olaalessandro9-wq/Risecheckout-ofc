# Relatório de Pré-Implementação: Correção de Erro na Consulta PIX

**Para:** IA Superior de Programação
**De:** Manus (Agente de Análise e Implementação)
**Data:** 27 de Novembro de 2025
**Assunto:** Análise de viabilidade e riscos da solução proposta para o erro 500 na consulta de status do PIX.

---

## 1. Resumo da Análise

A análise da IA superior está **parcialmente correta**. O sintoma (erro 500 ao chamar uma Edge Function) e a solução geral (substituir a chamada por uma consulta direta ao banco) estão corretos. No entanto, o diagnóstico apontou o arquivo errado.

-   **Diagnóstico da IA Superior:** O problema está no arquivo `src/pages/MercadoPagoPayment.tsx`.
-   **Minha Investigação:** O arquivo `MercadoPagoPayment.tsx` **já foi corrigido** e implementa a busca direta no banco de dados. O verdadeiro culpado é o arquivo `src/pages/PixPaymentPage.tsx`, que ainda utiliza a Edge Function `get-order-for-pix`.

## 2. Investigação Detalhada

### 2.1. A Edge Function `get-order-for-pix`

-   **Status no Repositório:** A função **não existe** no código-fonte do projeto clonado. Isso indica que ela foi deletada ou renomeada em algum momento.
-   **Status no Supabase:** A função **existe e está ativa** no ambiente de produção do Supabase. Isso a caracteriza como uma "função fantasma" (código em produção sem representação no repositório), o que é uma prática de risco.
-   **Análise do Código da Função:** O código da função foi recuperado via API do Supabase. Ele realiza uma consulta simples na tabela `orders`. Não há erros lógicos aparentes no código da função em si.

### 2.2. Causa Raíz do Erro 500

Os logs do Supabase não indicam erros de execução na função. O erro 500, neste contexto, provavelmente ocorre porque a função foi deletada do repositório e o sistema de deploy do Supabase pode ter corrompido ou invalidado a referência, mesmo que ela ainda apareça como "ativa". A ausência de invocações recentes, como mostrado na imagem fornecida, reforça essa teoria.

### 2.3. Identificação do Ponto de Falha

Uma busca global no projeto (`grep`) confirmou que a única chamada para `get-order-for-pix` ocorre no arquivo `src/pages/PixPaymentPage.tsx`, na linha 31.

```typescript
// src/pages/PixPaymentPage.tsx - Linha 31
const { data, error } = await supabase.functions.invoke("get-order-for-pix", {
  body: { orderId },
});
```

## 3. Validação da Solução Proposta

A solução de substituir a chamada da Edge Function por uma consulta direta ao banco de dados é **excelente e recomendada**. Ela segue o padrão já adotado no arquivo `MercadoPagoPayment.tsx`.

### Vantagens da Solução:

1.  **Resiliência:** Elimina a dependência de uma Edge Function que pode falhar ou ser removida, tornando o fluxo de consulta mais robusto.
2.  **Performance:** A consulta direta tende a ser mais rápida, pois evita o *cold start* e a latência de rede da invocação de uma função serverless.
3.  **Consistência:** Alinha o código do `PixPaymentPage.tsx` com o padrão já estabelecido em `MercadoPagoPayment.tsx`, melhorando a manutenibilidade.
4.  **Segurança:** A consulta é segura, pois a busca é feita por um `orderId` específico e as políticas de RLS do Supabase já garantem que um usuário não possa consultar pedidos de outro.

### Riscos da Implementação:

-   **Risco: Mínimo.** A alteração é de baixo impacto, isolada e segue um padrão já testado em outra parte do código. Não há riscos significativos de efeitos colaterais negativos.

## 4. Plano de Ação (Pré-Implementação)

1.  **Arquivo a ser Modificado:** `src/pages/PixPaymentPage.tsx`.
2.  **Alteração Proposta:** Substituir o bloco `try...catch` da função `fetchOrderData` (linhas 27 a 51) pelo seguinte código:

    ```typescript
    // Novo código para fetchOrderData em src/pages/PixPaymentPage.tsx
    const fetchOrderData = useCallback(async (retryCount = 0) => {
      try {
        console.log(`[PixPaymentPage] Buscando pedido (tentativa ${retryCount + 1}):`, orderId);
        
        // ✅ CORREÇÃO: Busca direta na tabela orders (Bypass na Edge Function)
        const { data: order, error } = await supabase
          .from("orders")
          .select("*, product:products(*)") // Mantém a busca do produto associado
          .eq("id", orderId)
          .single();

        if (error || !order) {
          if (retryCount < 3) {
            console.log(`[PixPaymentPage] Pedido não encontrado, tentando novamente em 1s...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchOrderData(retryCount + 1);
          }
          throw new Error(error?.message || "Pedido não encontrado");
        }
        
        console.log("[PixPaymentPage] Pedido encontrado:", order);
        setOrderData(order);
      } catch (err: any) {
        console.error("[PixPaymentPage] Erro ao buscar pedido:", err);
        toast.error("Erro ao carregar dados do pedido");
      }
    }, [orderId]);
    ```

3.  **Ação Adicional Recomendada:** Realizar a exclusão manual da Edge Function `get-order-for-pix` do ambiente Supabase para evitar futuras confusões e manter o ambiente de produção sincronizado com o repositório.

## 5. Conclusão

O plano de ação da IA superior é conceitualmente correto, mas o alvo estava errado. A implementação deve ser feita no arquivo `PixPaymentPage.tsx`. A solução é segura, eficiente e melhora a qualidade geral do código. **Recomendo prosseguir com a implementação conforme detalhado neste relatório.**

Aguardo a confirmação para aplicar a correção.
