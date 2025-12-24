# 🚨 Diagnóstico Crítico: Order Bumps Não Salvos em order_items

**Data:** 27 de novembro de 2025  
**Order ID:** `3be34c6b-9d3b-4674-ab52-8a7af30eade9`  
**Severidade:** 🔴 **CRÍTICA**

---

## 🎯 Problema Confirmado

A Edge Function `create-order` **EXECUTA** o código para inserir Order Bumps, mas os registros **NÃO SÃO SALVOS** na tabela `order_items`.

---

## 📊 Evidências

### **1. Tabela `orders` (Total Correto)** ✅

```json
{
  "id": "3be34c6b-9d3b-4674-ab52-8a7af30eade9",
  "customer_name": "Alessandro rodrigues",
  "amount_cents": 4187,  // R$ 41,87
  "status": "PAID"
}
```

**Cálculo:**
- Produto principal: R$ 29,90
- 3 Order Bumps: 3 × R$ 3,99 = R$ 11,97
- **Total: R$ 41,87** ✅

---

### **2. Tabela `order_items` (Apenas 1 Item)** ❌

```json
[
  {
    "id": "2f2c9134-c3b2-4b4a-82a4-d9b1eddde808",
    "order_id": "3be34c6b-9d3b-4674-ab52-8a7af30eade9",
    "product_id": "2ad650b6-8961-430d-aff6-e087d2028437",
    "product_name": "Rise community (Cópia 3) (Cópia)",
    "amount_cents": 2990,  // R$ 29,90
    "quantity": 1,
    "is_bump": false
  }
]
```

**Problema:** Apenas o produto principal foi salvo. **Nenhum bump** com `is_bump: true`.

---

### **3. Logs da Edge Function `create-order`** ✅

```
[create-order] [INFO] Request recebido {"product_id":"2ad650b6-8961-430d-aff6-e087d2028437","checkout_id":"5884a6c4-42d7-40c7-9790-c4a274745046","bumps_count":3}

[create-order] [INFO] Produto encontrado {"product_id":"2ad650b6-8961-430d-aff6-e087d2028437","price_cents":2990}

[create-order] [INFO] Pedido criado {"order_id":"3be34c6b-9d3b-4674-ab52-8a7af30eade9"}

[create-order] [INFO] Processando order bumps {"count":3}

[create-order] [INFO] Bump adicionado {"bump_id":"9a454ba5-c284-41b7-9a4f-19a1fa41013b","price_cents":399}

[create-order] [INFO] Inserindo bump item {"bump_id":"0dbf6d62-da82-4c44-8470-c7ca84b217ad","bump_price_cents":399,"bump_price_cents_type":"number","bump_product_id":"8746314e-d9be-4a2c-ad11-abe7472deee9","bump_product_name":"6.000 Fluxos - Fluxos prontos para acelerar seus processos."}

[create-order] [INFO] Bump adicionado {"bump_id":"0dbf6d62-da82-4c44-8470-c7ca84b217ad","price_cents":399}

[create-order] [INFO] Bump adicionado {"bump_id":"a6a88fc5-4140-4b54-bc66-39ad06edd513","price_cents":399}

[create-order] [INFO] Pedido criado com sucesso {"order_id":"3be34c6b-9d3b-4674-ab52-8a7af30eade9","total_cents":4187,"total_brl":"41.87"}
```

**Análise:**
- ✅ Edge Function recebeu `bumps_count: 3`
- ✅ Edge Function processou 3 bumps
- ✅ Edge Function logou "Inserindo bump item" (pelo menos 1x)
- ✅ Edge Function logou "Bump adicionado" (3x)
- ✅ Total calculado corretamente: R$ 41,87

**Mas:** Os bumps NÃO aparecem em `order_items`!

---

## 🐛 Causa Raiz

A Edge Function **TENTA** inserir os bumps, mas a operação **FALHA SILENCIOSAMENTE**.

### **Código Problemático (Linha 273-286):**

```typescript
const { error: bumpItemError } = await supabase
  .from('order_items')
  .insert({
    order_id: order.id,
    product_id: bump_product_id,
    product_name: bump_product_name,
    amount_cents: Number(bump_price_cents),
    quantity: 1,
    is_bump: true
  });

if (bumpItemError) {
  logError('Erro ao inserir item do bump', { bump_id, error: bumpItemError });
  continue;  // ⚠️ CONTINUA MESMO COM ERRO
}
```

**Problema:** Se `bumpItemError` existir, a função:
1. Loga o erro (mas não vimos esse log!)
2. Faz `continue` (pula para o próximo bump)
3. **NÃO interrompe a execução**
4. **NÃO retorna erro para o frontend**

---

## 🔍 Hipóteses

### **Hipótese 1: Erro Silencioso no Insert**

O `.insert()` está falhando, mas:
- O log de erro **NÃO aparece** nos logs
- Ou o erro está sendo suprimido em algum lugar

**Como verificar:**
- Procurar logs com `[ERROR] Erro ao inserir item do bump` nos logs da Edge Function
- Se não existir, significa que `bumpItemError` é `null` (não houve erro reportado)

### **Hipótese 2: Constraint/Trigger no Banco**

Existe alguma constraint ou trigger na tabela `order_items` que:
- Permite a inserção do produto principal (`is_bump: false`)
- **Bloqueia** a inserção de bumps (`is_bump: true`)
- Mas não retorna erro para a Edge Function

**Como verificar:**
- Listar constraints da tabela `order_items`
- Listar triggers da tabela `order_items`

### **Hipótese 3: Rollback de Transação**

Os bumps são inseridos, mas depois:
- Algum trigger faz rollback
- Alguma validação falha
- A transação é revertida

**Como verificar:**
- Verificar se há triggers `BEFORE INSERT` ou `AFTER INSERT` em `order_items`

---

## 🔧 Próximos Passos

### **1. Verificar Logs de Erro**

Procurar nos logs da Edge Function por:
```
[ERROR] Erro ao inserir item do bump
```

Se **NÃO existir**, significa que `bumpItemError` é `null`.

### **2. Verificar Constraints**

```sql
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'order_items'::regclass;
```

### **3. Verificar Triggers**

```sql
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'order_items';
```

### **4. Testar Insert Manual**

Tentar inserir um bump manualmente no banco:

```sql
INSERT INTO order_items (
  order_id,
  product_id,
  product_name,
  amount_cents,
  quantity,
  is_bump
) VALUES (
  '3be34c6b-9d3b-4674-ab52-8a7af30eade9',
  '8746314e-d9be-4a2c-ad11-abe7472deee9',
  'Teste Bump Manual',
  399,
  1,
  true
);
```

Se falhar, veremos o erro real.

---

## 📋 Informações Técnicas

### **Order ID:**
```
3be34c6b-9d3b-4674-ab52-8a7af30eade9
```

### **Produto Principal:**
```
ID: 2ad650b6-8961-430d-aff6-e087d2028437
Nome: Rise community (Cópia 3) (Cópia)
Preço: R$ 29,90
```

### **Bumps Processados (Logs):**
```
1. bump_id: 9a454ba5-c284-41b7-9a4f-19a1fa41013b (R$ 3,99)
2. bump_id: 0dbf6d62-da82-4c44-8470-c7ca84b217ad (R$ 3,99)
   product_id: 8746314e-d9be-4a2c-ad11-abe7472deee9
   product_name: "6.000 Fluxos - Fluxos prontos para acelerar seus processos."
3. bump_id: a6a88fc5-4140-4b54-bc66-39ad06edd513 (R$ 3,99)
```

### **Total Calculado:**
```
Produto: R$ 29,90
Bump 1:  R$  3,99
Bump 2:  R$  3,99
Bump 3:  R$  3,99
-----------------
Total:   R$ 41,87 ✅
```

---

## 🎯 Conclusão Preliminar

A Edge Function `create-order` está funcionando **CORRETAMENTE** em termos de lógica:
- ✅ Recebe os bumps
- ✅ Processa os bumps
- ✅ Calcula o total corretamente
- ✅ Atualiza o total do pedido

**MAS:** A inserção dos bumps em `order_items` está **FALHANDO SILENCIOSAMENTE**.

**Próxima Ação:** Investigar constraints, triggers e tentar insert manual para identificar o erro real.

---

**Status:** 🔴 **INVESTIGAÇÃO EM ANDAMENTO**  
**Prioridade:** 🔥 **ALTA**  
**Impacto:** Webhooks de Order Bumps não disparam (tabela vazia)
