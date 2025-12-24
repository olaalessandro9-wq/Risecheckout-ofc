# 🧪 Guia Rápido de Testes - Webhooks Order Bumps v9

**Objetivo:** Validar que os webhooks estão sendo disparados corretamente para produtos principais e Order Bumps.

---

## ✅ Checklist de Testes

### **Teste 1: Pedido com Order Bump (PIX)** ⏳

**Cenário:** Cliente compra produto com Order Bump e paga via PIX.

**Passos:**
1. [ ] Acessar checkout de produto com Order Bump
2. [ ] Preencher dados do cliente
3. [ ] Selecionar pagamento via PIX
4. [ ] **ACEITAR** o Order Bump
5. [ ] Gerar QR Code do PIX
6. [ ] Anotar o `order_id` gerado

**Verificação:**
```sql
-- Substituir 'ORDER_ID_AQUI' pelo ID real
SELECT 
  event_type,
  message,
  data,
  created_at
FROM trigger_debug_logs
WHERE order_id = 'ORDER_ID_AQUI'
ORDER BY created_at ASC;
```

**Resultado Esperado:**
- [ ] Evento `pix_generated_v9` registrado
- [ ] `order_items_fetched` com `count: 2` (produto + bump)
- [ ] 2x `processing_item` (um para cada produto)
- [ ] 2x `webhook_dispatched` (um para cada produto)
- [ ] Nenhum erro registrado

---

### **Teste 2: Pedido com Order Bump (Cartão)** ⏳

**Cenário:** Cliente compra produto com Order Bump e paga via Cartão de Crédito.

**Passos:**
1. [ ] Acessar checkout de produto com Order Bump
2. [ ] Preencher dados do cliente
3. [ ] Selecionar pagamento via Cartão de Crédito
4. [ ] **ACEITAR** o Order Bump
5. [ ] Preencher dados do cartão
6. [ ] Finalizar pagamento
7. [ ] Aguardar aprovação (status → PAID)
8. [ ] Anotar o `order_id` gerado

**Verificação:**
```sql
-- Substituir 'ORDER_ID_AQUI' pelo ID real
SELECT 
  event_type,
  message,
  data,
  created_at
FROM trigger_debug_logs
WHERE order_id = 'ORDER_ID_AQUI'
ORDER BY created_at ASC;
```

**Resultado Esperado:**
- [ ] Evento `purchase_approved_v9` registrado
- [ ] `order_items_fetched` com `count: 2` (produto + bump)
- [ ] 2x `processing_item` (um para cada produto)
- [ ] 2x `webhook_dispatched` (um para cada produto)
- [ ] Nenhum erro registrado

---

### **Teste 3: Pedido SEM Order Bump** ⏳

**Cenário:** Cliente compra produto simples (sem Order Bump).

**Passos:**
1. [ ] Acessar checkout de produto SEM Order Bump
2. [ ] Preencher dados e finalizar pagamento
3. [ ] Aguardar aprovação (status → PAID)
4. [ ] Anotar o `order_id` gerado

**Verificação:**
```sql
-- Substituir 'ORDER_ID_AQUI' pelo ID real
SELECT 
  event_type,
  message,
  data,
  created_at
FROM trigger_debug_logs
WHERE order_id = 'ORDER_ID_AQUI'
ORDER BY created_at ASC;
```

**Resultado Esperado:**
- [ ] Evento `purchase_approved_v9` registrado
- [ ] `order_items_fetched` com `count: 1` (apenas produto principal)
- [ ] 1x `processing_item`
- [ ] 1x `webhook_dispatched`
- [ ] Nenhum erro registrado

---

### **Teste 4: Pedido com Bump RECUSADO** ⏳

**Cenário:** Cliente vê o Order Bump mas NÃO aceita.

**Passos:**
1. [ ] Acessar checkout de produto com Order Bump
2. [ ] Preencher dados do cliente
3. [ ] **NÃO ACEITAR** o Order Bump
4. [ ] Finalizar pagamento
5. [ ] Aguardar aprovação (status → PAID)
6. [ ] Anotar o `order_id` gerado

**Verificação:**
```sql
-- Substituir 'ORDER_ID_AQUI' pelo ID real
SELECT 
  event_type,
  message,
  data,
  created_at
FROM trigger_debug_logs
WHERE order_id = 'ORDER_ID_AQUI'
ORDER BY created_at ASC;
```

**Resultado Esperado:**
- [ ] Evento `purchase_approved_v9` registrado
- [ ] `order_items_fetched` com `count: 1` (apenas produto principal)
- [ ] 1x `processing_item`
- [ ] 1x `webhook_dispatched`
- [ ] Nenhum erro registrado

---

## 🔍 Queries Úteis

### **Ver últimos 10 pedidos processados:**
```sql
SELECT DISTINCT
  order_id,
  MAX(created_at) as last_event
FROM trigger_debug_logs
WHERE event_type LIKE '%_v9'
GROUP BY order_id
ORDER BY last_event DESC
LIMIT 10;
```

### **Contar webhooks disparados por pedido:**
```sql
SELECT 
  order_id,
  COUNT(*) as webhooks_count
FROM trigger_debug_logs
WHERE event_type = 'webhook_dispatched'
GROUP BY order_id
ORDER BY webhooks_count DESC;
```

### **Ver erros recentes:**
```sql
SELECT 
  order_id,
  event_type,
  message,
  data,
  created_at
FROM trigger_debug_logs
WHERE event_type LIKE '%error%'
ORDER BY created_at DESC
LIMIT 20;
```

### **Ver detalhes de um pedido específico:**
```sql
-- Substituir 'ORDER_ID_AQUI' pelo ID real
SELECT 
  id,
  created_at,
  event_type,
  message,
  data
FROM trigger_debug_logs
WHERE order_id = 'ORDER_ID_AQUI'
ORDER BY created_at ASC;
```

---

## 🚨 Sinais de Problema

### **❌ Webhook não disparado:**
- Verificar se `order_items_fetched` retornou `count: 0`
- Verificar se há erro `webhook_error` nos logs
- Verificar se produto tem webhook configurado na tabela `products`

### **❌ Edge Function não chamada:**
- Verificar se evento `pix_edge_function_called` ou `purchase_edge_function_called` existe
- Verificar se há erro `edge_function_error` nos logs
- Verificar se `supabase_url` e `service_role_key` estão configurados em `app_settings`

### **❌ Trigger não disparado:**
- Verificar se evento `trigger_start_v9` existe
- Verificar se status do pedido mudou para `PAID` (case insensitive)
- Verificar se PIX foi gerado (`pix_qr_code` não nulo)

---

## 📊 Relatório de Testes

Após executar todos os testes, preencher:

| Teste | Status | Order ID | Webhooks Esperados | Webhooks Disparados | Observações |
|-------|--------|----------|-------------------|---------------------|-------------|
| Teste 1 (PIX + Bump) | ⏳ | - | 2 | - | - |
| Teste 2 (Cartão + Bump) | ⏳ | - | 2 | - | - |
| Teste 3 (Sem Bump) | ⏳ | - | 1 | - | - |
| Teste 4 (Bump Recusado) | ⏳ | - | 1 | - | - |

**Legenda:**
- ✅ Passou
- ❌ Falhou
- ⏳ Pendente

---

## 🎯 Critério de Sucesso

Para considerar a implementação **100% funcional**, todos os testes devem:
- ✅ Disparar o número correto de webhooks
- ✅ Registrar logs completos sem erros
- ✅ Completar em menos de 5 segundos
- ✅ Não gerar erros no console do Supabase

---

## 📞 Suporte

Se algum teste falhar:
1. Copiar o `order_id` do pedido
2. Executar a query de detalhes do pedido
3. Copiar todos os logs
4. Reportar no canal de desenvolvimento com:
   - Número do teste que falhou
   - Order ID
   - Logs completos
   - Screenshot do erro (se houver)

---

**Versão:** v9 (Deep Item Search)  
**Data:** 27/11/2025  
**Commit:** 5a54902
