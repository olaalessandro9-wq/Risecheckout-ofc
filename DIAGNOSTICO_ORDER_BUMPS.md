# 🔍 Diagnóstico: Order Bumps Não Disparando Webhooks

**Data:** 27 de novembro de 2025  
**Order ID Testado:** `3be34c6b-9d3b-4674-ab52-8a7af30eade9`  
**Status:** ❌ **PROBLEMA IDENTIFICADO**

---

## 🎯 Resumo Executivo

**Problema:** Order Bumps não estão disparando webhooks.

**Causa Raiz:** ❌ **ERRO DE GRAVAÇÃO (create-order)**

**Localização do Bug:** Os Order Bumps **não estão sendo salvos na tabela `order_items`** quando o cliente aceita o bump no checkout via cartão de crédito.

**Edge Function v9:** ✅ **Funcionando corretamente** - ela só pode disparar webhooks para os itens que existem no banco.

---

## 📊 Evidências Coletadas

### **1. Verificação da Tabela `order_items`** ❌

**Query Executada:**
```sql
SELECT * FROM order_items 
WHERE order_id = '3be34c6b-9d3b-4674-ab52-8a7af30eade9' 
ORDER BY created_at ASC;
```

**Resultado:**
```json
[
  {
    "id": "2f2c9134-c3b2-4b4a-82a4-d9b1eddde808",
    "order_id": "3be34c6b-9d3b-4674-ab52-8a7af30eade9",
    "product_id": "2ad650b6-8961-430d-aff6-e087d2028437",
    "product_name": "Rise community (Cópia 3) (Cópia)",
    "amount_cents": 2990,
    "quantity": 1,
    "is_bump": false,
    "created_at": "2025-11-28 00:47:06.927289+00"
  }
]
```

**Análise:**
- ✅ **1 registro encontrado** (produto principal)
- ❌ **0 registros de Order Bumps** (`is_bump: true`)
- ❌ **Bump não foi salvo no banco de dados**

**Conclusão:** O problema está na criação do pedido, não na leitura.

---

### **2. Verificação dos Logs da Edge Function** ✅

**Query Executada:**
```sql
SELECT id, created_at, event_type, message, data 
FROM trigger_debug_logs 
WHERE order_id = '3be34c6b-9d3b-4674-ab52-8a7af30eade9' 
ORDER BY created_at ASC;
```

**Logs Relevantes (Evento `purchase_approved`):**

| ID | Event Type | Message | Data |
|----|-----------|---------|------|
| 4294 | `purchase_approved_v9` | Evento de compra aprovada detectado | `old_status: pending, new_status: PAID` |
| 4295 | `purchase_has_items_check` | Verificação de order_items | `has_items: true` |
| 4296 | `purchase_item_count` | Total de items encontrados | **`count: 1`** ⚠️ |
| 4297 | `purchase_processing_item` | Processando item | `is_bump: false, product_id: 2ad650b6...` |
| 4298 | `purchase_webhook_found` | Webhook encontrado para item | `webhook_name: TESTE N8N` |
| 4299 | `purchase_webhook_sent` | Webhook enviado com sucesso | `is_bump: false` |
| 4300 | `purchase_webhooks_summary` | Resumo de webhooks disparados | **`total_items: 1, total_webhooks: 1`** |

**Análise:**
- ✅ Trigger v9 executado corretamente
- ✅ Edge Function encontrou **1 item** no banco
- ✅ Edge Function processou **1 item** (produto principal)
- ✅ Edge Function disparou **1 webhook** (produto principal)
- ❌ Edge Function **não encontrou Order Bumps** porque eles não existem no banco

**Conclusão:** A Edge Function v9 está funcionando perfeitamente. Ela processou todos os itens que existiam no banco (apenas 1).

---

## 🐛 Causa Raiz Identificada

### **Problema: Order Bumps não são salvos em `order_items`**

Quando o cliente:
1. Acessa o checkout
2. Aceita o Order Bump
3. Preenche dados do cartão
4. Finaliza o pagamento

**O que deveria acontecer:**
- ✅ Criar registro do produto principal em `order_items` (`is_bump: false`)
- ✅ Criar registro do Order Bump em `order_items` (`is_bump: true`)

**O que está acontecendo:**
- ✅ Criar registro do produto principal em `order_items` (`is_bump: false`)
- ❌ **NÃO criar registro do Order Bump** (bug!)

---

## 🔍 Onde Investigar

### **Arquivos Suspeitos:**

1. **`src/components/PublicCheckout.tsx`**
   - Função que cria o pedido via cartão
   - Verificar se está incluindo os bumps aceitos ao criar `order_items`

2. **Edge Function `create-order` (se existir)**
   - Verificar se está salvando todos os itens (produto + bumps)

3. **Lógica de Mercado Pago**
   - Verificar se o estado dos bumps aceitos está sendo passado corretamente para a função de criação do pedido

---

## 🧪 Como Reproduzir o Bug

1. Acessar checkout de produto com Order Bump configurado
2. Preencher dados do cliente
3. Selecionar pagamento via **Cartão de Crédito**
4. **ACEITAR** o Order Bump
5. Preencher dados do cartão e finalizar
6. Aguardar aprovação (status → PAID)
7. Verificar banco de dados:
   ```sql
   SELECT * FROM order_items WHERE order_id = 'ORDER_ID_AQUI';
   ```
8. **Resultado esperado:** 2 registros (produto + bump)
9. **Resultado atual:** 1 registro (apenas produto)

---

## ✅ O Que Está Funcionando

### **Edge Function v9 (trigger-webhooks)** ✅

A Edge Function está funcionando **perfeitamente**:
- ✅ Busca todos os itens do pedido em `order_items`
- ✅ Processa cada item encontrado
- ✅ Dispara webhooks para cada item
- ✅ Registra logs detalhados de cada etapa

**Prova:** Os logs mostram que ela processou corretamente o único item que existia no banco.

### **Trigger SQL v9** ✅

O trigger SQL está funcionando **perfeitamente**:
- ✅ Detecta evento `purchase_approved` (status → PAID)
- ✅ Chama a Edge Function apenas 1 vez
- ✅ Registra logs detalhados

---

## 🚨 O Que NÃO Está Funcionando

### **Criação de Order Items (Cartão de Crédito)** ❌

A lógica que cria os registros em `order_items` quando o pagamento é via **cartão de crédito** está:
- ✅ Salvando o produto principal
- ❌ **NÃO salvando os Order Bumps aceitos**

---

## 🔧 Próximos Passos (Para o Gemini)

### **1. Investigar Código de Criação do Pedido**

Procurar no código onde os `order_items` são criados quando o pagamento é via cartão:

**Possíveis locais:**
- `src/components/PublicCheckout.tsx` (função de finalizar pagamento com cartão)
- Edge Function `create-order` (se existir)
- Qualquer função que chame `supabase.from('order_items').insert(...)`

**O que verificar:**
- Se está iterando pelos bumps aceitos
- Se está criando registros com `is_bump: true`
- Se há alguma condição que impede a criação dos bumps

### **2. Comparar com Criação via PIX**

Se o PIX funciona corretamente (salva os bumps), comparar:
- Como o PIX cria os `order_items`
- Como o Cartão cria os `order_items`
- Identificar a diferença

### **3. Testar com PIX**

Para confirmar que o problema é específico do cartão:
1. Fazer pedido com Order Bump via **PIX**
2. Verificar se os bumps são salvos em `order_items`
3. Se sim, confirma que o bug é específico do fluxo de cartão

---

## 📋 Checklist de Validação

Após corrigir o bug, validar:

- [ ] Pedido via Cartão com Bump aceito
- [ ] Verificar `order_items`: deve ter 2 registros (produto + bump)
- [ ] Verificar logs: deve mostrar `count: 2`
- [ ] Verificar webhooks: deve disparar 2 webhooks
- [ ] Pedido via PIX com Bump aceito (se ainda não testado)
- [ ] Verificar `order_items`: deve ter 2 registros (produto + bump)
- [ ] Verificar logs: deve mostrar `count: 2`
- [ ] Verificar webhooks: deve disparar 2 webhooks

---

## 🎓 Lições Aprendidas

### **1. A Edge Function v9 Está Correta**

A implementação do "Deep Item Search" está funcionando perfeitamente. O problema não está na leitura dos itens, mas na gravação.

### **2. Logs Estruturados Salvam Tempo**

Os logs detalhados da Edge Function permitiram identificar rapidamente que:
- Ela encontrou apenas 1 item (`count: 1`)
- Ela processou apenas 1 item
- Ela disparou apenas 1 webhook

Isso provou que o problema estava "upstream" (na criação dos itens).

### **3. Verificar o Banco de Dados Primeiro**

Antes de assumir que a lógica de processamento está errada, sempre verificar se os dados estão corretos no banco. Neste caso, os dados estavam incompletos.

---

## 📞 Informações Técnicas

### **Order ID Testado:**
```
3be34c6b-9d3b-4674-ab52-8a7af30eade9
```

### **Produto Principal:**
```
ID: 2ad650b6-8961-430d-aff6-e087d2028437
Nome: Rise community (Cópia 3) (Cópia)
Preço: R$ 29,90
```

### **Order Item Criado:**
```
ID: 2f2c9134-c3b2-4b4a-82a4-d9b1eddde808
is_bump: false
created_at: 2025-11-28 00:47:06.927289+00
```

### **Webhook Disparado:**
```
ID: f877a634-e722-4aa0-8bd1-52a56b3643f6
Nome: TESTE N8N
Status: Enviado com sucesso
```

---

## 🎯 Conclusão

**Diagnóstico Confirmado:** O problema **NÃO está na Edge Function v9**. Ela está funcionando perfeitamente.

**Problema Real:** Os Order Bumps **não estão sendo salvos na tabela `order_items`** quando o pagamento é via cartão de crédito.

**Próxima Ação:** Investigar e corrigir a lógica de criação de `order_items` no fluxo de pagamento com cartão.

---

**Assinatura:**  
Diagnóstico realizado em 27/11/2025  
Order ID: `3be34c6b-9d3b-4674-ab52-8a7af30eade9`  
Edge Function v9: ✅ Funcionando  
Create Order (Cartão): ❌ Bug identificado
