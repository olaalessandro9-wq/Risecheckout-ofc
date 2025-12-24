# Relatório de Validação: Correção do Mercado Pago Bricks

**Autor:** Manus AI
**Data:** 09 de Dezembro de 2025
**Status:** ✅ Aprovado com Ressalvas Críticas

---

## 1. Diagnóstico Confirmado

A análise do código confirmou a hipótese levantada no documento `pasted_content.txt`. Existe uma discrepância fundamental entre como os preços são armazenados no banco de dados (Reais) e como o hook `usePaymentGateway` espera recebê-los (Centavos).

### Evidências no Código:

1.  **Banco de Dados (Reais):**
    *   O hook `useCheckoutData.ts` (linhas 179, 228) carrega o preço diretamente do banco (`productData.price`).
    *   Não há conversão explícita para centavos neste hook. Se o banco armazena `29.90`, o hook retorna `29.90`.

2.  **Fluxo de Dados (Reais):**
    *   `PublicCheckoutV2.tsx` (linha 90) passa `checkout?.product?.price` (29.90) para `useFormManager`.
    *   `useFormManager.ts` (linha 104) usa esse valor base para calcular o total: `let total = productPrice`.
    *   `PublicCheckoutV2.tsx` (linha 109) passa o resultado de `calculateTotal()` (29.90) para `usePaymentGateway`.

3.  **Gateway de Pagamento (Espera Centavos):**
    *   `usePaymentGateway.ts` (linha 179) valida: `if (!amountRef.current || amountRef.current < 100)`.
    *   **O Erro:** `29.90 < 100` é VERDADEIRO. O sistema rejeita o pagamento achando que é menos de 1 real, quando na verdade são R$ 29,90.
    *   Além disso, na linha 184, ele tenta converter de novo: `parseFloat((amountRef.current / 100).toFixed(2))`. Se entrasse 29.90, viraria 0.29!

## 2. Validação do Plano de Ação

O plano proposto no arquivo anexo está **CORRETO** em sua essência, mas precisa ser aplicado com cuidado para não quebrar a exibição visual.

### Fase 1: Conversão na Entrada (Aprovado)
Alterar `PublicCheckoutV2.tsx` para multiplicar por 100 é a solução correta para isolar a lógica de centavos apenas no frontend.

### Fase 2: Order Bumps (Aprovado)
Os Order Bumps também precisam ser convertidos. O plano sugere fazer isso em `useCheckoutData.ts`. Isso é bom porque centraliza a normalização dos dados vindos do banco.

### Fase 3: Exibição Visual (Ponto de Atenção)
**CRÍTICO:** Ao converter tudo para centavos no `useCheckoutData` e `PublicCheckoutV2`, precisamos garantir que os componentes visuais (`SharedOrderSummary`, `SharedProductSection`) saibam lidar com isso.
*   Se eles esperam reais e receberem centavos (ex: 2990), vão exibir "R$ 2.990,00" ao invés de "R$ 29,90".
*   **Recomendação:** Utilizar a função utilitária `toReais()` ou dividir por 100 apenas no momento da renderização visual.

## 3. Compatibilidade com Arquitetura Server-Side

O projeto utiliza Edge Functions para recálculo de preço (`mercadopago-create-payment`).
*   **Validação:** A Edge Function provavelmente espera o valor em centavos ou busca do banco novamente.
*   **Risco:** Se a Edge Function buscar do banco (que está em reais) e o frontend enviar em centavos, pode haver discrepância na validação de integridade.
*   **Mitigação:** O frontend envia apenas os IDs (`product_id`, `bump_ids`). A Edge Function deve ser a fonte da verdade final sobre o preço. O valor enviado pelo frontend para o Brick é apenas para *autorização* no cartão. A captura real deve bater com o cálculo do servidor.

## 4. Conclusão e Próximos Passos

O plano é sólido e resolve o bug impeditivo.

**Ações Imediatas:**
1.  Aplicar a conversão `* 100` em `PublicCheckoutV2.tsx`.
2.  Aplicar a normalização de Bumps em `useCheckoutData.ts`.
3.  Revisar `SharedOrderSummary` para garantir que ele formate corretamente (dividindo por 100 se necessário).
