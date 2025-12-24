# Arquitetura de Testes Automatizados - RiseCheckout

**Fase 2 do Plano de Ação para Produção**

## 1. Objetivo

Criar uma suíte de testes automatizados para o fluxo crítico de pagamento do RiseCheckout, garantindo que futuras alterações no código não quebrem a funcionalidade principal e possam ser deployadas com segurança.

## 2. Ferramentas

- **Deno Test Runner:** Ferramenta de testes nativa do Deno, já inclusa no ambiente das Edge Functions. Não requer instalação de dependências externas.
- **Supabase Test Helpers:** Funções auxiliares para criar um ambiente de teste isolado (se necessário).

## 3. Escopo dos Testes

Vamos focar nos **testes de integração** das Edge Functions que compõem o fluxo de pagamento. Não faremos testes de UI (frontend) ou testes unitários de componentes individuais neste momento.

### Funções a Serem Testadas:

1.  ✅ **`create-order`**
2.  ✅ **`mercadopago-create-payment`**
3.  ✅ **`mercadopago-webhook`**

### Estrutura de Arquivos:

```
supabase/
  functions/
    create-order/
      index.ts
      index.test.ts  <-- NOVO
    mercadopago-create-payment/
      index.ts
      index.test.ts  <-- NOVO
    mercadopago-webhook/
      index.ts
      index.test.ts  <-- NOVO
```

## 4. Cenários de Teste

### 🧪 `create-order.test.ts`

- **Caso de Sucesso:**
  - Deve criar um pedido com sucesso e retornar 200 OK.
  - Deve salvar o pedido corretamente no banco de dados.
- **Casos de Falha:**
  - Deve retornar 400 se o payload for inválido.
  - Deve retornar 404 se o produto não existir.
  - Deve retornar 401 se o usuário não estiver autenticado.

### 🧪 `mercadopago-create-payment.test.ts`

- **Caso de Sucesso:**
  - Deve criar um pagamento no Mercado Pago com sucesso.
  - Deve usar as credenciais do Vault.
- **Casos de Falha:**
  - Deve retornar 400 se o `order_id` for inválido.
  - Deve retornar 401 se as credenciais do MP estiverem incorretas.

### 🧪 `mercadopago-webhook.test.ts`

- **Caso de Sucesso:**
  - Deve validar uma assinatura HMAC-SHA256 válida e retornar 200 OK.
  - Deve atualizar o status do pedido para `PAID`.
- **Casos de Falha:**
  - Deve retornar 401 se a assinatura for inválida.
  - Deve retornar 401 se o webhook estiver expirado.
  - Deve retornar 400 se os headers estiverem ausentes.

## 5. Como Executar os Testes

Os testes serão executados via linha de comando:

```bash
# Executar todos os testes
supabase functions test --all

# Executar teste de uma função específica
supabase functions test create-order
```

## 6. Próximos Passos

1.  Implementar os arquivos `*.test.ts` para cada função.
2.  Criar um ambiente de teste com dados mockados.
3.  Configurar um workflow no GitHub Actions para rodar os testes a cada push na `main`.
