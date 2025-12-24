# 🧪 Guia de Testes - Refatoração do Sistema de Pagamentos

**Data:** 29 de Novembro de 2024  
**Versão:** 1.0  
**Objetivo:** Validar que a refatoração do sistema de pagamentos (Strategy/Adapter Pattern) funciona perfeitamente

---

## 📋 Checklist Geral

Antes de começar, certifique-se de que:

- [ ] O deploy do Lovable foi concluído com sucesso
- [ ] Você tem acesso ao painel administrativo
- [ ] Você tem produtos configurados para teste
- [ ] Você tem credenciais de teste do Mercado Pago (se aplicável)
- [ ] Você tem credenciais do PushinPay configuradas

---

## 🎯 Testes Obrigatórios

### Teste 1: PIX com Mercado Pago ✅

**Objetivo:** Validar que o adaptador do Mercado Pago processa PIX corretamente

**Pré-requisitos:**
- Produto configurado com gateway "Mercado Pago"
- Método de pagamento "PIX" habilitado

**Passos:**

1. **Acessar Checkout**
   - Abra o checkout público de um produto
   - URL: `https://risecheckout.com/pay/{product_id}`

2. **Preencher Dados**
   - Nome completo: `João da Silva`
   - Email: `joao.teste@example.com`
   - CPF: `12345678900` (ou CPF válido de teste)
   - Telefone: `11999999999`

3. **Selecionar PIX**
   - Escolha a opção "PIX" como método de pagamento
   - Clique em "Finalizar Compra" ou "Gerar PIX"

4. **Validar QR Code**
   - [ ] QR Code é exibido na tela
   - [ ] Código "copia e cola" é exibido
   - [ ] Botão "Copiar" funciona
   - [ ] Timer de expiração aparece (se configurado)
   - [ ] Mensagem de sucesso aparece

5. **Verificar no Banco de Dados**
   - Acesse o Supabase
   - Vá na tabela `orders`
   - Encontre o pedido pelo email
   - **Validar:**
     - [ ] `gateway` = `MERCADOPAGO`
     - [ ] `payment_method` = `PIX`
     - [ ] `pix_qr_code` está preenchido
     - [ ] `pix_id` está preenchido
     - [ ] `gateway_payment_id` está preenchido
     - [ ] `status` = `PENDING` (ou `PAID` se pagou)

6. **Verificar Logs (Opcional)**
   - Abra o console do navegador (F12)
   - Procure por erros (não deve ter nenhum)
   - Verifique requisições à API (deve ter sucesso)

**Resultado Esperado:**
✅ QR Code gerado com sucesso  
✅ Pedido salvo no banco com dados corretos  
✅ Nenhum erro no console  

**Se falhar:**
- Verifique se as credenciais do Mercado Pago estão corretas
- Verifique logs da Edge Function no Supabase
- Verifique se o adaptador está sendo criado corretamente

---

### Teste 2: Cartão de Crédito com Mercado Pago ✅

**Objetivo:** Validar que o adaptador do Mercado Pago processa cartão corretamente

**Pré-requisitos:**
- Produto configurado com gateway "Mercado Pago"
- Método de pagamento "Cartão de Crédito" habilitado

**Passos:**

1. **Acessar Checkout**
   - Abra o checkout público de um produto

2. **Preencher Dados**
   - Nome completo: `Maria Santos`
   - Email: `maria.teste@example.com`
   - CPF: `12345678900`

3. **Selecionar Cartão de Crédito**
   - Escolha "Cartão de Crédito"

4. **Preencher Dados do Cartão**
   - **Cartão de Teste do Mercado Pago:**
     - Número: `5031 4332 1540 6351` (Mastercard)
     - Nome: `APRO` (aprovação automática)
     - Validade: `11/25` (qualquer data futura)
     - CVV: `123`
     - CPF: `12345678900`

5. **Finalizar Compra**
   - Clique em "Finalizar Compra"
   - Aguarde processamento

6. **Validar Resultado**
   - [ ] Mensagem de "Pagamento Aprovado" aparece
   - [ ] Redirecionamento para página de sucesso
   - [ ] Nenhum erro exibido

7. **Verificar no Banco de Dados**
   - Acesse o Supabase
   - Tabela `orders`
   - **Validar:**
     - [ ] `gateway` = `MERCADOPAGO`
     - [ ] `payment_method` = `CREDIT_CARD`
     - [ ] `gateway_payment_id` está preenchido
     - [ ] `status` = `PAID` (se aprovado)

**Resultado Esperado:**
✅ Pagamento aprovado  
✅ Pedido salvo com status `PAID`  
✅ Nenhum erro no console  

**Cartões de Teste Adicionais:**

| Cartão | Nome | Resultado |
|--------|------|-----------|
| `5031 4332 1540 6351` | `APRO` | Aprovado |
| `5031 4332 1540 6351` | `OTHE` | Recusado (outro motivo) |
| `5031 4332 1540 6351` | `FUND` | Recusado (fundos insuficientes) |

---

### Teste 3: PIX com PushinPay ✅

**Objetivo:** Validar que o adaptador do PushinPay funciona (se aplicável)

**Pré-requisitos:**
- Produto configurado com gateway "PushinPay"
- Credenciais do PushinPay configuradas

**Passos:**

1. **Configurar Gateway**
   - Vá em "Financeiro" no painel
   - Configure o PushinPay (se ainda não estiver)
   - Ative o gateway

2. **Configurar Produto**
   - Edite um produto
   - Em "Gateway de Pagamento", selecione "PIX" e "PushinPay"
   - Salve

3. **Acessar Checkout**
   - Abra o checkout do produto

4. **Preencher e Gerar PIX**
   - Preencha os dados
   - Selecione PIX
   - Clique em "Gerar PIX"

5. **Validar**
   - [ ] QR Code é gerado
   - [ ] Código copia e cola funciona
   - [ ] Pedido salvo no banco com `gateway` = `PUSHINPAY`

**Resultado Esperado:**
✅ QR Code gerado com sucesso  
✅ Gateway correto no banco  

**Nota:** Se você não usa PushinPay, pode pular este teste.

---

### Teste 4: Order Bumps (Crítico!) 💰

**Objetivo:** Validar que bumps continuam funcionando corretamente

**Pré-requisitos:**
- Produto com Order Bumps configurados

**Passos:**

1. **Configurar Bump**
   - Edite um produto
   - Adicione um Order Bump de R$ 50,00
   - Salve

2. **Acessar Checkout**
   - Abra o checkout do produto (ex: R$ 100,00)

3. **Selecionar Bump**
   - Marque o checkbox do Order Bump
   - **Validar:** Total deve ser R$ 150,00 (100 + 50)

4. **Finalizar com PIX**
   - Selecione PIX
   - Gere o QR Code

5. **Verificar Valor**
   - [ ] QR Code gerado para R$ 150,00 (não R$ 100,00)
   - [ ] No banco, `order_items` tem 2 itens (produto + bump)
   - [ ] Soma dos `amount_cents` = 15000 (R$ 150,00)

6. **Testar sem Bump**
   - Repita o processo sem marcar o bump
   - [ ] QR Code gerado para R$ 100,00

**Resultado Esperado:**
✅ Valor total calculado corretamente (produto + bumps)  
✅ Gateway processa o valor total  
✅ Itens salvos corretamente no banco  

**CRÍTICO:** Se o bump não for incluído no valor, há um bug sério!

---

### Teste 5: Múltiplos Bumps 💰💰

**Objetivo:** Validar cálculo com múltiplos bumps

**Passos:**

1. **Configurar 3 Bumps**
   - Bump 1: R$ 30,00
   - Bump 2: R$ 20,00
   - Bump 3: R$ 50,00

2. **Selecionar Todos**
   - Produto: R$ 100,00
   - Bump 1: ✅
   - Bump 2: ✅
   - Bump 3: ✅
   - **Total esperado:** R$ 200,00

3. **Gerar PIX**
   - [ ] QR Code para R$ 200,00
   - [ ] 4 itens no `order_items` (1 produto + 3 bumps)

**Resultado Esperado:**
✅ Valor total = R$ 200,00  
✅ Todos os itens salvos  

---

### Teste 6: Ambientes (Sandbox vs Produção) 🔧

**Objetivo:** Validar que o sistema respeita o ambiente configurado

**Passos:**

1. **Modo Teste (Sandbox)**
   - Vá em "Perfil" ou "Configurações"
   - Ative "Modo de Teste"
   - Faça um pagamento PIX
   - **Validar:**
     - [ ] Credenciais de teste são usadas
     - [ ] Pagamento processado no sandbox do gateway

2. **Modo Produção**
   - Desative "Modo de Teste"
   - Faça um pagamento PIX
   - **Validar:**
     - [ ] Credenciais de produção são usadas
     - [ ] Pagamento processado no ambiente real

**Resultado Esperado:**
✅ Sistema respeita o ambiente configurado  
✅ Credenciais corretas são usadas  

---

### Teste 7: Erros e Validações ⚠️

**Objetivo:** Validar que erros são tratados corretamente

**Cenários de Erro:**

#### 7.1: Cartão Recusado

1. Use cartão de teste com nome `OTHE` (recusado)
2. **Validar:**
   - [ ] Mensagem de erro clara é exibida
   - [ ] Pedido não fica como `PAID`
   - [ ] Usuário pode tentar novamente

#### 7.2: Credenciais Inválidas

1. Configure credenciais inválidas no Mercado Pago
2. Tente gerar PIX
3. **Validar:**
   - [ ] Erro é exibido ao usuário
   - [ ] Mensagem indica problema de configuração

#### 7.3: Campos Obrigatórios

1. Tente finalizar sem preencher email
2. **Validar:**
   - [ ] Validação impede envio
   - [ ] Mensagem de erro aparece

**Resultado Esperado:**
✅ Erros são tratados graciosamente  
✅ Mensagens claras para o usuário  
✅ Sistema não quebra  

---

## 🔍 Testes Avançados (Opcional)

### Teste 8: Webhooks 🔔

**Objetivo:** Validar que webhooks continuam funcionando

**Passos:**

1. Configure webhook no Mercado Pago (se ainda não tiver)
2. Faça um pagamento PIX de teste
3. Pague o PIX (use app de teste ou sandbox)
4. **Validar:**
   - [ ] Webhook é recebido
   - [ ] Status do pedido atualiza para `PAID`
   - [ ] Webhooks configurados disparam (se houver)

---

### Teste 9: Logs e Monitoramento 📊

**Objetivo:** Verificar logs da Edge Function

**Passos:**

1. Acesse Supabase Dashboard
2. Vá em "Edge Functions" → "mercadopago-create-payment"
3. Veja os logs
4. **Validar:**
   - [ ] Logs mostram "Gateway Mercado Pago criado com sucesso"
   - [ ] Logs mostram "Processando pagamento"
   - [ ] Logs mostram "Pagamento criado com sucesso"
   - [ ] Nenhum erro crítico

**Logs Esperados:**

```
[mercadopago-create-payment] [INFO] Request recebido
[mercadopago-create-payment] [INFO] Iniciando processamento {"orderId":"abc123","paymentMethod":"pix"}
[PaymentFactory] Criando gateway: mercadopago
[mercadopago-create-payment] [INFO] Gateway Mercado Pago criado com sucesso
[MercadoPagoAdapter] Criando PIX para pedido abc123
[mercadopago-create-payment] [INFO] Pagamento criado com sucesso {"transactionId":"123456","status":"pending"}
```

---

## 📊 Checklist Final de Validação

Marque cada item conforme completar:

### Funcionalidade

- [ ] PIX Mercado Pago funciona
- [ ] Cartão Mercado Pago funciona
- [ ] PIX PushinPay funciona (se aplicável)
- [ ] Order Bumps calculados corretamente
- [ ] Múltiplos bumps funcionam
- [ ] Ambientes (sandbox/produção) respeitados

### Banco de Dados

- [ ] Pedidos salvos com gateway correto
- [ ] `gateway_payment_id` preenchido
- [ ] `order_items` contém todos os itens (produto + bumps)
- [ ] Valores em centavos corretos

### Erros

- [ ] Cartão recusado tratado corretamente
- [ ] Credenciais inválidas geram erro claro
- [ ] Validações de campos funcionam

### Logs

- [ ] Logs mostram criação do gateway
- [ ] Logs mostram processamento
- [ ] Nenhum erro crítico

### Performance

- [ ] Checkout carrega rápido
- [ ] QR Code gerado em < 3 segundos
- [ ] Nenhum travamento

---

## 🚨 O que Fazer se Algo Falhar

### Cenário 1: QR Code não é gerado

**Possíveis causas:**
1. Credenciais do gateway inválidas
2. Erro no adaptador
3. Problema de rede

**Diagnóstico:**
1. Verifique logs da Edge Function
2. Procure por `[MercadoPagoAdapter] Erro na API`
3. Verifique se credenciais estão corretas no banco

**Solução:**
- Se erro de credenciais: Reconfigure no painel
- Se erro no adaptador: Verifique código do `MercadoPagoAdapter.ts`
- Se erro de rede: Tente novamente

---

### Cenário 2: Bumps não são incluídos no valor

**Possíveis causas:**
1. Bug no cálculo do `create-order`
2. Adaptador não está recebendo valor correto

**Diagnóstico:**
1. Verifique tabela `order_items` - todos os itens estão lá?
2. Verifique logs - qual valor está sendo enviado ao gateway?
3. Procure por `calculatedTotalCents` nos logs

**Solução:**
- Se itens não estão no banco: Bug no `create-order`
- Se valor errado no gateway: Bug no adaptador

---

### Cenário 3: Erro "Gateway não é suportado"

**Causa:** PaymentFactory não reconhece o gateway

**Diagnóstico:**
1. Verifique logs: `Gateway 'xxx' não é suportado`
2. Verifique qual nome está sendo passado

**Solução:**
- Certifique-se de que o nome no banco é `MERCADOPAGO` (maiúsculo)
- Ou ajuste o `PaymentFactory` para aceitar variações

---

### Cenário 4: Erro "Access Token é obrigatório"

**Causa:** Credenciais não foram carregadas

**Diagnóstico:**
1. Verifique tabela `vendor_integrations`
2. Verifique se `config.access_token` existe
3. Verifique se `active` = true

**Solução:**
- Reconfigure gateway no painel "Financeiro"

---

## 🎯 Critérios de Sucesso

A refatoração é considerada **100% bem-sucedida** se:

✅ **Todos os testes obrigatórios (1-7) passam**  
✅ **Bumps funcionam perfeitamente**  
✅ **Nenhum erro crítico nos logs**  
✅ **Performance igual ou melhor que antes**  
✅ **Banco de dados com dados corretos**  

---

## 📝 Relatório de Testes

Após completar os testes, preencha:

**Data dos Testes:** _______________  
**Testado por:** _______________  

**Resultados:**

| Teste | Status | Observações |
|-------|--------|-------------|
| 1. PIX Mercado Pago | ⬜ Pass / ⬜ Fail | |
| 2. Cartão Mercado Pago | ⬜ Pass / ⬜ Fail | |
| 3. PIX PushinPay | ⬜ Pass / ⬜ Fail / ⬜ N/A | |
| 4. Order Bumps | ⬜ Pass / ⬜ Fail | |
| 5. Múltiplos Bumps | ⬜ Pass / ⬜ Fail | |
| 6. Ambientes | ⬜ Pass / ⬜ Fail | |
| 7. Erros | ⬜ Pass / ⬜ Fail | |

**Conclusão:**
⬜ Aprovado para produção  
⬜ Requer ajustes  

---

## 🚀 Próximos Passos Após Validação

Se todos os testes passarem:

1. ✅ Marcar refatoração como concluída
2. ✅ Remover `index.old.ts` (backup não é mais necessário)
3. ✅ Documentar no changelog
4. ✅ Celebrar! 🎉

Se houver falhas:

1. ⚠️ Documentar erros encontrados
2. ⚠️ Reportar para o time de desenvolvimento
3. ⚠️ Reverter para `index.old.ts` se necessário
4. ⚠️ Corrigir bugs e testar novamente

---

**Boa sorte com os testes! 🚀**
