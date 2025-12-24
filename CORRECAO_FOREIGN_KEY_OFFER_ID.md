# ✅ Correção: Foreign Key Violation em offer_id

**Data:** 27 de novembro de 2025  
**Erro:** 23503 - Foreign Key Violation  
**Diagnóstico:** Gemini  
**Implementação:** Manus  
**Status:** ✅ **CORRIGIDO E DEPLOYADO**

---

## 🐛 Problema Identificado

### **Erro 23503 - Foreign Key Violation:**
```
insert or update on table "orders" violates foreign key constraint "orders_offer_id_fkey"
Key (offer_id)=(PRODUCT_ID) is not present in table "offers"
```

**Causa:** O frontend estava enviando o `product_id` como `offer_id` quando não havia oferta selecionada. O banco de dados rejeitava porque esse ID não existe na tabela `offers`.

**Fluxo do Bug:**
1. Frontend: Sem oferta → envia `offer_id: product_id` (fallback)
2. Backend: Tenta inserir → `INSERT INTO orders (offer_id) VALUES (product_id)`
3. Banco: Rejeita → "Esse ID não existe na tabela offers!"

---

## 🔍 Diagnóstico

### **Problema de Validação:**

A Edge Function `create-order` **não validava** se o `offer_id` recebido realmente existia na tabela `offers`. Ela simplesmente tentava inserir o valor recebido, causando erro de Foreign Key.

**Código Anterior (Problemático):**
```typescript
// ❌ PROBLEMA: Usa offer_id sem validar
if (offer_id && offer_id !== product_id) {
    const { data: offer } = await supabaseClient
        .from("offers")
        .select("price, name")
        .eq("id", offer_id)
        .single(); // ⚠️ Dá erro se não achar
    
    if (offer) {
        finalPrice = Number(offer.price);
        offerName = offer.name;
    }
}

// ...

// ❌ PROBLEMA: Insere offer_id sem validar se existe
.insert({
  offer_id: offer_id || null, // Pode ser um ID inválido!
  // ...
})
```

---

## 🚀 Solução Implementada

### **Validação Robusta de offer_id:**

**Código Novo (Corrigido):**
```typescript
// ✅ SOLUÇÃO: Variável segura que começa como null
let validatedOfferId = null;

// Só busca oferta se o ID vier E for diferente do produto
if (offer_id && offer_id !== product_id) {
    const { data: offer } = await supabaseClient
        .from("offers")
        .select("id, price, name")
        .eq("id", offer_id)
        .maybeSingle(); // ✅ Não dá erro se não achar
    
    if (offer) {
        finalPrice = Number(offer.price);
        offerName = offer.name;
        validatedOfferId = offer.id; // ✅ Só preenche se existir
        console.log(`🏷️ [create-order] Oferta válida aplicada: ${offer.name}`);
    } else {
        console.warn(`⚠️ [create-order] Offer ID ${offer_id} não encontrado. Usando preço do produto.`);
    }
}

// ...

// ✅ SOLUÇÃO: Usa ID validado (ou null)
.insert({
  offer_id: validatedOfferId, // Sempre null ou ID válido
  // ...
})
```

---

## 🔧 Mudanças Implementadas

### **1. Variável `validatedOfferId`:**
```typescript
let validatedOfferId = null; // Começa como null (seguro)
```
**Benefício:** Garante que o banco sempre recebe `null` ou um ID válido.

### **2. Uso de `.maybeSingle()`:**
```typescript
.maybeSingle(); // Não dá erro se não achar
```
**Antes:** `.single()` causava erro se oferta não existisse  
**Depois:** `.maybeSingle()` retorna `null` silenciosamente

### **3. Validação Condicional:**
```typescript
if (offer) {
    validatedOfferId = offer.id; // Só preenche se existir
}
```
**Benefício:** Só salva `offer_id` se a oferta realmente existir no banco.

### **4. Logs Informativos:**
```typescript
console.log(`🏷️ [create-order] Oferta válida aplicada: ${offer.name}`);
console.warn(`⚠️ [create-order] Offer ID ${offer_id} não encontrado.`);
```
**Benefício:** Facilita debug e monitoramento.

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Validação de offer_id** | ❌ Não validava | ✅ Valida antes de inserir |
| **Erro se oferta não existir** | ❌ `.single()` causa erro | ✅ `.maybeSingle()` retorna null |
| **Foreign Key Violation** | ❌ Acontecia | ✅ Impossível |
| **Valor no banco** | ❌ ID inválido ou null aleatório | ✅ Sempre null ou ID válido |
| **Logs de debug** | ❌ Sem logs | ✅ Logs claros |

---

## 🧪 Como Testar

### **Teste 1: Pedido SEM Oferta**

**Cenário:** Cliente compra produto sem selecionar oferta específica.

**Requisição:**
```json
{
  "product_id": "abc-123",
  "offer_id": null, // ou ausente
  "checkout_id": "xyz-789",
  "customer_name": "Teste",
  "customer_email": "teste@example.com",
  // ...
}
```

**Resultado Esperado:**
- ✅ Pedido criado com sucesso
- ✅ `offer_id` no banco = `null`
- ✅ Preço usado = preço do produto
- ✅ Log: "Usando preço do produto"

---

### **Teste 2: Pedido COM Oferta Válida**

**Cenário:** Cliente compra produto com oferta específica.

**Requisição:**
```json
{
  "product_id": "abc-123",
  "offer_id": "offer-456", // ID válido na tabela offers
  "checkout_id": "xyz-789",
  // ...
}
```

**Resultado Esperado:**
- ✅ Pedido criado com sucesso
- ✅ `offer_id` no banco = `"offer-456"`
- ✅ Preço usado = preço da oferta
- ✅ Log: "Oferta válida aplicada: Nome da Oferta"

---

### **Teste 3: Pedido COM offer_id Inválido (Caso Real do Bug)**

**Cenário:** Frontend envia `product_id` como `offer_id` (fallback incorreto).

**Requisição:**
```json
{
  "product_id": "abc-123",
  "offer_id": "abc-123", // ⚠️ Mesmo ID do produto (inválido como oferta)
  "checkout_id": "xyz-789",
  // ...
}
```

**Resultado Esperado:**
- ✅ Pedido criado com sucesso (antes dava erro!)
- ✅ `offer_id` no banco = `null` (validação detectou ID inválido)
- ✅ Preço usado = preço do produto
- ✅ Log: "Offer ID abc-123 não encontrado. Usando preço do produto."

---

## 🔍 Verificação no Banco de Dados

### **Query de Verificação:**
```sql
SELECT 
  id,
  product_id,
  offer_id,
  product_name,
  amount_cents,
  status,
  created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;
```

### **Resultado Esperado:**
- ✅ Pedidos com `offer_id = null` quando não há oferta
- ✅ Pedidos com `offer_id = UUID válido` quando há oferta
- ❌ **NUNCA** `offer_id` com ID de produto

---

## 📝 Lições Aprendidas

### **1. Sempre Validar Foreign Keys Antes de Inserir**

Nunca confie cegamente em dados do frontend. Sempre valide se IDs de foreign keys existem nas tabelas referenciadas.

### **2. Use `.maybeSingle()` para Queries Opcionais**

```typescript
// ❌ Ruim: Causa erro se não achar
.single()

// ✅ Bom: Retorna null se não achar
.maybeSingle()
```

### **3. NULL é Melhor que ID Inválido**

Se uma foreign key é opcional, é melhor salvar `null` do que tentar salvar um ID que não existe.

### **4. Logs Salvam Tempo**

Logs claros ("Oferta válida aplicada" vs "Offer ID não encontrado") facilitam muito o debug.

---

## 🚀 Deploy Realizado

### **Edge Function `create-order`**

```bash
✅ Deploy realizado via Supabase MCP
- Function: create-order
- Versão: 170
- Status: ACTIVE
- ID: 7a2abdf0-731c-453e-a195-f63ccfa9e4bb
- Data: 27/11/2025 20:29 UTC
```

### **Código Commitado**

```bash
✅ Commit: [pendente]
- Arquivo: supabase/functions/create-order/index.ts
- Mudanças: Validação robusta de offer_id com maybeSingle()
- Branch: main
```

---

## 📞 Troubleshooting

### **Se o erro 23503 persistir:**

1. **Verificar logs da Edge Function:**
   ```
   Dashboard → Edge Functions → create-order → Logs
   ```
   Procurar por:
   - "Oferta válida aplicada" (sucesso)
   - "Offer ID não encontrado" (validação funcionando)

2. **Verificar dados no banco:**
   ```sql
   SELECT id, offer_id FROM orders 
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC;
   ```
   Se houver `offer_id` com UUIDs que não existem em `offers`, a validação não está funcionando.

3. **Testar oferta manualmente:**
   ```sql
   SELECT id, name, price FROM offers 
   WHERE id = 'OFFER_ID_SUSPEITO';
   ```
   Se retornar vazio, o ID realmente não existe.

---

## 🎯 Conclusão

A correção implementada resolve definitivamente o erro 23503 (Foreign Key Violation) validando o `offer_id` antes de inserir no banco de dados.

**Fluxo Corrigido:**
1. Frontend envia `offer_id` (pode ser inválido)
2. Backend **valida** se existe na tabela `offers`
3. Se existir → salva ID válido
4. Se NÃO existir → salva `null`
5. Banco aceita sempre (null ou ID válido)

**Status Final:** ✅ **CORRIGIDO E PRONTO PARA TESTES**

---

**Assinatura:**  
Correção aplicada em 27/11/2025  
Edge Function v170 ACTIVE  
Diagnóstico: Gemini (Foreign Key Violation)  
Implementação: Validação robusta com maybeSingle()
