# Relatório de Refatoração: Normalização de Preços (Centavos)

**Data:** 10/12/2025
**Autor:** Manus AI (Rise Architect)
**Status:** ✅ Concluído

## 1. Objetivo
Corrigir o erro crítico de integração com o Mercado Pago Bricks ("Valor mínimo não atingido") e alinhar o frontend com a arquitetura de dados do banco (que armazena inteiros/centavos).

## 2. Diagnóstico (Root Cause Analysis)
O sistema sofria de uma inconsistência de unidades:
*   **Banco de Dados:** Armazena `amount_cents` como `INTEGER` (ex: 2990).
*   **Frontend (Legado):** Tratava preços como `FLOAT` (Reais, ex: 29.90).
*   **Consequência:** Ao enviar `29.90` para validações que esperavam centavos, o sistema interpretava como "29 centavos", falhando na validação de valor mínimo (> R$ 1,00).

## 3. Execução (Alterações Realizadas)

### A. Camada de Dados (`useCheckoutData.ts`)
*   **Normalização na Entrada:** Assim que os dados chegam do Supabase, eles são imediatamente convertidos para centavos (`Math.round(price * 100)`).
*   **Benefício:** Todo o restante da aplicação agora opera com números inteiros seguros, eliminando erros de ponto flutuante.

### B. Camada de Pagamento (`usePaymentGateway.ts`)
*   **Correção de Lógica:** Removida a conversão redundante. O hook agora recebe centavos e apenas divide por 100 no momento exato de inicializar o Brick (que exige Reais na interface visual), mas mantém a integridade dos centavos para o backend.
*   **Log:** Adicionado log explícito `Amount para Brick (Cents)` para facilitar debug futuro.

### C. Camada de Apresentação (UI Components)
Todos os componentes visuais foram atualizados para formatar centavos de volta para Reais apenas no momento da renderização:
*   `SharedProductSection.tsx`: Divide por 100 antes do `.toFixed(2)`.
*   `SharedOrderSummary.tsx`: Divide subtotal, descontos e total por 100.
*   `SharedOrderBumps.tsx`: Divide preços originais e promocionais por 100.

## 4. Validação Arquitetural
*   **Single Source of Truth:** O banco de dados continua sendo a fonte da verdade. O frontend agora respeita o tipo de dado do banco.
*   **Edge Functions:** Nenhuma alteração necessária. Como elas já esperavam centavos, a correção no frontend fez com que o fluxo se alinhasse automaticamente.
*   **Segurança:** Operar com inteiros previne erros de arredondamento financeiro comuns em JavaScript.

## 5. Próximos Passos
*   Testar o fluxo de ponta a ponta (compra real em Sandbox).
*   Monitorar logs do Supabase para garantir que o Mercado Pago está recebendo os valores corretos.
