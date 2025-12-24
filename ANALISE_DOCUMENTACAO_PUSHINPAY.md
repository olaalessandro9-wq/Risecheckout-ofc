# Análise da Documentação Oficial PushinPay

**Data:** 01 de Novembro de 2025  
**Fonte:** https://app.theneo.io/pushinpay/pix/criar-pix

---

## 🔍 Endpoint Correto

### **PROBLEMA CRÍTICO IDENTIFICADO:**

Nossa implementação está usando o endpoint **ERRADO**!

**❌ Endpoint que estamos usando:**
```
POST /pix/create
```

**✅ Endpoint correto da documentação:**
```
POST /pix/cashIn
```

---

## 📋 Especificação Completa da API

### **Base URLs**

- **Produção:** `https://api.pushinpay.com.br/api`
- **Sandbox:** `https://api-sandbox.pushinpay.com.br/api`

### **Endpoint de Criação de PIX**

```
POST /pix/cashIn
```

### **Headers Obrigatórios**

| Header | Valor | Obrigatório |
|--------|-------|-------------|
| `Authorization` | `Bearer {TOKEN}` | ✅ Sim |
| `Accept` | `application/json` | ✅ Sim |
| `Content-Type` | `application/json` | ✅ Sim |

### **Body Parameters**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `value` | `number` | ✅ Sim | Valor em centavos (mínimo 50) |
| `webhook_url` | `string` | ❌ Não | URL para receber notificações |
| `split_rules` | `array` | ❌ Não | Array de splits para outras contas |

### **Formato do split_rules**

```json
{
  "value": 50,
  "account_id": "9C3XXXXX3A043"
}
```

### **Exemplo de Requisição**

```bash
curl --location 'https://api.pushinpay.com.br/api/pix/cashIn' \
--header 'Authorization: Bearer TOKEN' \
--header 'Accept: application/json' \
--header 'Content-Type: application/json' \
--data '{
  "value": 51,
  "webhook_url": "https://seu-site.com",
  "split_rules": []
}'
```

### **Exemplo de Resposta (200 OK)**

```json
{
  "id": "9e6e0...",
  "qr_code": "000201...",
  "status": "created" | "paid" | "canceled",
  "value": 50,
  "webhook_url": "https://seu-site.com",
  "qr_code_base64": "data:image/png;base64,iVBOR...",
  "webhook": {},
  "split_rules": [],
  "end_to_end_id": {},
  "payer_name": {},
  "payer_national_registration": {}
}
```

---

## ⚠️ Pontos de Atenção da Documentação

1. ✅ Conta deve estar CRIADA e Aprovada
2. ✅ Valores sempre em CENTAVOS
3. ✅ Valor mínimo de 50 centavos
4. ✅ Percentual máximo de 50% para SPLIT
5. ✅ Checar limite de valor máximo na conta
6. ⚠️ Se não tiver servidor para webhook, NÃO preencher `webhook_url`

---

## 🚨 Erros Possíveis

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request - Composição do request inválido |
| 401 | Unauthorized - Chave TOKEN inválida |
| 403 | Forbidden - Apenas administradores |
| 404 | Not Found - Pedido não existe |
| 405 | Method Not Allowed - Método não permitido |
| 406 | Not Acceptable - Formato JSON inválido |
| 422 | Validation Error - Campo value deve ser no mínimo 50 |
| 429 | Too Many Requests - Muitas requisições |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## 🔧 Correções Necessárias

### **1. Alterar Endpoint**

**Antes:**
```typescript
const response = await fetch(`${baseURL}/pix/create`, {
```

**Depois:**
```typescript
const response = await fetch(`${baseURL}/pix/cashIn`, {
```

### **2. Validar Formato do split_rules**

Nossa implementação atual:
```typescript
const split_rules = platformValue > 0 && PLATFORM_ACCOUNT
  ? [{ value: platformValue, account_id: PLATFORM_ACCOUNT }]
  : [];
```

✅ **CORRETO** - Formato está de acordo com a documentação!

### **3. Validar Headers**

Nossa implementação atual:
```typescript
headers: {
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
}
```

✅ **CORRETO** - Headers estão de acordo com a documentação!

---

## 📊 Comparação: Nossa Implementação vs Documentação

| Item | Nossa Implementação | Documentação | Status |
|------|---------------------|--------------|--------|
| **Endpoint** | `/pix/create` | `/pix/cashIn` | ❌ **ERRADO** |
| **Header Authorization** | `Bearer ${token}` | `Bearer TOKEN` | ✅ Correto |
| **Header Accept** | `application/json` | `application/json` | ✅ Correto |
| **Header Content-Type** | `application/json` | `application/json` | ✅ Correto |
| **Campo value** | `number` (centavos) | `number` (centavos) | ✅ Correto |
| **Campo webhook_url** | `string` | `string` | ✅ Correto |
| **Campo split_rules** | `array` | `array` | ✅ Correto |
| **Formato split** | `{value, account_id}` | `{value, account_id}` | ✅ Correto |

---

## 🎯 Causa Raiz do Erro

**Erro reportado:**
```
Error: Edge Function returned a non-2xx status code
POST https://...supabase.co/functions/v1/encrypt-token
500 (Internal Server Error)
```

**Causa:**
1. ❌ Endpoint `/pix/create` não existe na API da PushinPay
2. ✅ Endpoint correto é `/pix/cashIn`
3. 🔄 A API retorna erro 404 ou 405 (método não permitido)
4. 🔄 Nossa Edge Function captura o erro e retorna 500

**Solução:**
Alterar `/pix/create` para `/pix/cashIn` em `pushinpay-create-pix/index.ts`

---

## 📝 Outras Observações

### **Webhook de Retorno**

- ✅ Nossa implementação já envia `webhook_url`
- ✅ PushinPay tenta enviar 3x em caso de falha
- ✅ É possível adicionar header customizado (configurar no painel)

### **Validações de Limite**

A documentação lista vários erros de validação:

1. ✅ Valor acima do limite permitido
2. ✅ Valor do split maior que o valor total
3. ✅ Split + taxa maior que o valor total
4. ✅ Conta de split não encontrada
5. ✅ Valor total dos splits excede o valor da transação

**Nossa implementação já trata:**
```typescript
// Validar que split não excede 50%
if (platformValue > value * 0.5) {
  return withCorsError(req, "Split não pode exceder 50% do valor da transação", 422);
}
```

---

## ✅ Checklist de Correção

- [ ] Alterar endpoint de `/pix/create` para `/pix/cashIn`
- [ ] Testar em Sandbox
- [ ] Verificar resposta 200 OK
- [ ] Validar QR Code gerado
- [ ] Testar webhook
- [ ] Fazer commit da correção

---

**Conclusão:**

O erro "Edge Function returned a non-2xx status code" é causado pelo **endpoint incorreto**. Todas as outras partes da implementação (headers, payload, split_rules) estão corretas conforme a documentação oficial.

**Ação imediata:** Alterar `/pix/create` para `/pix/cashIn` em `pushinpay-create-pix/index.ts`.
