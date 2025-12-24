# Análise e Soluções para Webhooks com Múltiplos Produtos

## 1. Problema

O sistema de webhooks atual não suporta a configuração de um único webhook para múltiplos produtos específicos. A interface do usuário permite selecionar vários produtos, mas a estrutura do banco de dados armazena apenas um `product_id` por webhook, causando uma inconsistência entre o frontend e o backend.

### 1.1. Detalhes do Problema

- **Interface do Usuário:** Permite selecionar múltiplos produtos para um webhook.
- **Banco de Dados:** A tabela `outbound_webhooks` possui um campo `product_id` (singular, do tipo `uuid`), que armazena apenas um ID de produto.
- **Comportamento Atual:** Apenas o primeiro produto selecionado é salvo, e o webhook só é disparado se a compra for exatamente daquele produto.

## 2. Soluções Propostas

A seguir, apresento três soluções arquiteturais para resolver este problema, com suas vantagens e desvantagens.

### 2.1. Solução 1: Mudar `product_id` para um Array de UUIDs (Recomendada)

Esta é a solução mais simples e direta, que exige a menor quantidade de mudanças no código.

- **Mudança no Banco:** Alterar o tipo da coluna `product_id` na tabela `outbound_webhooks` de `uuid` para `uuid[]` (um array de UUIDs).
- **Mudança no Backend:**
  - **`trigger-webhooks`:** Modificar a query para usar o operador `@>` (contém) em vez de `=` para verificar se o `product_id` da compra está contido no array de `product_ids` do webhook.
  - **Frontend:** Nenhuma mudança necessária, pois o frontend já envia um array de IDs.

#### Vantagens:
- **Simples e rápida de implementar.**
- **Mínimo impacto no código existente.**
- **Mantém a estrutura de tabelas simples.**

#### Desvantagens:
- **Menos flexível para futuras expansões.**
- **Pode ser um pouco mais lento em queries com muitos webhooks.**

### 2.2. Solução 2: Criar Tabela de Relacionamento (Mais Robusta)

Esta é a solução mais robusta e escalável, seguindo as melhores práticas de modelagem de dados.

- **Mudança no Banco:**
  - Criar uma nova tabela de relacionamento chamada `webhook_products` com as colunas `webhook_id` e `product_id`.
  - Remover a coluna `product_id` da tabela `outbound_webhooks`.
- **Mudança no Backend:**
  - **`trigger-webhooks`:** Modificar a query para fazer um `JOIN` com a tabela `webhook_products` para encontrar os webhooks associados ao produto da compra.
  - **Frontend:** Modificar a lógica de salvar webhooks para inserir os registros na nova tabela `webhook_products`.

#### Vantagens:
- **Altamente escalável e flexível.**
- **Segue as melhores práticas de modelagem de dados.**
- **Permite adicionar mais informações ao relacionamento no futuro.**

#### Desvantagens:
- **Mais complexa de implementar.**
- **Exige mais mudanças no código do frontend e backend.**

### 2.3. Solução 3: Webhooks "Globais" vs. Específicos (Híbrida)

Esta solução é um meio-termo que não exige mudanças na estrutura do banco, mas adiciona complexidade à lógica do backend.

- **Mudança no Banco:** Nenhuma.
- **Mudança no Backend:**
  - **`trigger-webhooks`:** Modificar a lógica para:
    1. Buscar webhooks com `product_id` igual ao produto da compra.
    2. Buscar webhooks com `product_id` igual a `NULL` (webhooks "globais").
    3. Unir os resultados e disparar todos os webhooks encontrados.
- **Frontend:** Nenhuma mudança necessária.

#### Vantagens:
- **Não exige mudanças na estrutura do banco.**
- **Permite ter webhooks globais e específicos.**

#### Desvantagens:
- **Não resolve o problema de 1 webhook para múltiplos produtos.**
- **Adiciona complexidade à lógica do backend.**

## 3. Recomendação

Recomendo a **Solução 1 (Mudar `product_id` para um Array de UUIDs)** por ser a mais simples e rápida de implementar, resolvendo o problema de forma eficaz com o mínimo de impacto no código existente.

Se a escalabilidade e flexibilidade forem uma prioridade maior, a **Solução 2 (Criar Tabela de Relacionamento)** é a melhor escolha a longo prazo.
