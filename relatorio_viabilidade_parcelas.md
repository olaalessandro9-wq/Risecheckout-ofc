# Relatório de Viabilidade Técnica: Campo de Parcelas (Installments)

**Data:** 10/12/2025
**Autor:** Manus AI (Rise Architect)
**Status:** ⚠️ Análise Crítica

## 1. O Problema
O usuário deseja que o campo de parcelas ("Installments") seja **sempre visível** no formulário de cartão, similar ao layout da Cakto.
Atualmente, o **Mercado Pago Payment Brick v2** oculta este campo por padrão e só o exibe **após** o usuário digitar os primeiros 6 dígitos do cartão (BIN).

## 2. Análise do Mercado Pago Brick v2
Após pesquisa aprofundada na documentação e testes de comportamento:
*   **Comportamento Padrão:** O Brick é projetado para ser "inteligente". Ele não sabe quais parcelas oferecer até identificar a bandeira e o banco emissor do cartão (via BIN). Por isso, ele esconde o campo para evitar prometer parcelamentos que o cartão do usuário não suporta.
*   **Limitação de Customização:** A API de customização do Brick (`customization.visual`) permite alterar cores, fontes e textos, mas **NÃO** permite forçar a exibição de campos que dependem de lógica de negócios (como parcelas).
*   **Conclusão:** Não é possível forçar o campo de parcelas a aparecer "vazio" ou "pré-carregado" usando o Payment Brick padrão sem hackear o CSS/DOM (o que é instável e não recomendado).

## 3. Alternativa: Custom Card Form (Secure Fields)
Para atingir o layout exato da Cakto (onde o campo de parcelas está lá, mesmo que desabilitado ou com valor padrão), precisamos migrar do **Payment Brick** para a implementação via **Core Methods (Secure Fields)**.

### Prós:
*   **Controle Total do Layout:** Podemos desenhar o formulário exatamente como quisermos (Grid, posições, labels).
*   **UX Personalizada:** Podemos mostrar o select de parcelas desde o início (ex: "Preencha o cartão para ver as parcelas" ou simular parcelas padrão).
*   **Estética:** Alinhamento perfeito com o Design System do RiseCheckout.

### Contras:
*   **Complexidade de Implementação:** Aumenta significativamente. Precisamos gerenciar manualmente:
    *   Criação de tokens de cartão.
    *   Validação de campos (Luhn, datas).
    *   Identificação de bandeira (getPaymentMethods).
    *   Busca de parcelas (getInstallments).
    *   Segurança (PCI Compliance via iFrames do Secure Fields).
*   **Tempo de Desenvolvimento:** Estimativa de 2-3 dias para uma implementação robusta e segura, contra "já estar pronto" do Brick.

## 4. Recomendação do Arquiteto (Vibe Coding)
Considerando que estamos na fase de **Refatoração Profunda** e o objetivo é um produto **High-End**:

**NÃO recomendo migrar para Custom Form AGORA apenas por causa desse detalhe.**
O comportamento do Brick (aparecer após o BIN) é um padrão de mercado (usado por Stripe, Shopify, etc) para evitar erros de seleção de parcelas inválidas.

**Solução Proposta (MVP Arquitetural):**
1.  **Manter o Brick:** Ele é seguro, mantido pelo Mercado Pago e converte bem.
2.  **Educar o Usuário (UX):** Adicionar um micro-texto ou tooltip visual: *"As opções de parcelamento aparecerão após inserir o número do cartão"*.
3.  **Futuro (V2):** Se a conversão for afetada, aí sim investimos na construção de um Custom Checkout Form proprietário.

**Se o usuário insistir no layout exato AGORA:**
Teremos que abandonar o Brick e construir o formulário do zero usando `sdk-js` Core Methods. Isso atrasará outras features.

## 5. Decisão
Aguardando confirmação do usuário. Se ele aceitar o comportamento do Brick, encerramos por aqui. Se ele exigir a mudança, iniciaremos a migração para Custom Form.
