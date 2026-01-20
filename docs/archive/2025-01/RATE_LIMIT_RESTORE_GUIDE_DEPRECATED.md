# 🔒 Guia de Restauração do Rate Limiting

## 📋 O Que Foi Removido Temporariamente

Para fazer o deploy via MCP do Supabase, o **rate limiting** foi temporariamente desabilitado nas Edge Functions:
- `mercadopago-create-payment`
- `mercadopago-webhook`

Este guia mostra **exatamente** como adicionar de volta.

---

## 🛠️ Como Restaurar

### Opção 1: Deploy via Supabase CLI (Recomendado)

O jeito mais fácil é fazer deploy via CLI, que suporta imports relativos:

```bash
# 1. Instalar Supabase CLI (se não tiver)
npm install -g supabase

# 2. Fazer login
supabase login

# 3. Deploy das functions (com rate limiting)
cd /home/ubuntu/risecheckout-84776
supabase functions deploy mercadopago-create-payment --project-ref wivbtmtgpsxupfjwwovf --no-verify-jwt
supabase functions deploy mercadopago-webhook --project-ref wivbtmtgpsxupfjwwovf --no-verify-jwt
```

**Pronto!** O CLI vai incluir automaticamente o arquivo `_shared/rate-limit.ts`.

---

### Opção 2: Adicionar Manualmente via Dashboard

Se preferir adicionar manualmente:

#### 1. Arquivo `_shared/rate-limit.ts`

Este arquivo já existe em `supabase/functions/_shared/rate-limit.ts` (anexado).

#### 2. Adicionar Import nas Edge Functions

**mercadopago-create-payment/index.ts** - Linha 17:
```typescript
import { rateLimitMiddleware, getIdentifier, recordAttempt } from '../_shared/rate-limit.ts';
```

**mercadopago-webhook/index.ts** - Linha 30:
```typescript
import { rateLimitMiddleware, getIdentifier } from '../_shared/rate-limit.ts';
```

#### 3. Adicionar Middleware nas Edge Functions

**mercadopago-create-payment/index.ts** - Após linha 96 (dentro do `serve`):

```typescript
// ========================================================================
// 0. RATE LIMITING (Proteção contra abuso)
// ========================================================================
const rateLimitResponse = await rateLimitMiddleware(req, {
  maxAttempts: 10,
  windowMs: 60 * 1000, // 1 minuto
  identifier: getIdentifier(req, false), // usar IP
  action: 'create_payment',
});

if (rateLimitResponse) {
  logWarn('Rate limit excedido', { identifier: getIdentifier(req, false) });
  return rateLimitResponse;
}
```

**mercadopago-webhook/index.ts** - Após linha 250 (dentro do `serve`):

```typescript
// ========================================================================
// 1. RATE LIMITING
// ========================================================================
const rateLimitResponse = await rateLimitMiddleware(req, {
  maxAttempts: 100,
  windowMs: 60 * 1000, // 1 minuto
  identifier: getIdentifier(req, false),
  action: 'mercadopago_webhook',
});

if (rateLimitResponse) {
  logWarn('Rate limit excedido');
  return rateLimitResponse;
}
```

---

## 📊 Configurações de Rate Limit

### mercadopago-create-payment
- **Limite:** 10 requisições por minuto por IP
- **Ação:** `create_payment`
- **Identificador:** IP do cliente

### mercadopago-webhook
- **Limite:** 100 requisições por minuto por IP
- **Ação:** `mercadopago_webhook`
- **Identificador:** IP do Mercado Pago

---

## 🗄️ Tabela Necessária

O rate limiting usa a tabela `rate_limit_attempts`. Verifique se existe:

```sql
-- Verificar se a tabela existe
SELECT * FROM rate_limit_attempts LIMIT 1;
```

Se não existir, crie:

```sql
CREATE TABLE IF NOT EXISTS rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  success BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_action 
  ON rate_limit_attempts(identifier, action);

CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at 
  ON rate_limit_attempts(created_at);
```

---

## ✅ Como Testar

Após adicionar o rate limiting:

### 1. Testar Limite de Requisições

```bash
# Fazer 11 requisições rápidas (deve bloquear a 11ª)
for i in {1..11}; do
  curl -X POST https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/mercadopago-create-payment \
    -H "Content-Type: application/json" \
    -d '{"orderId":"test","payerEmail":"test@test.com","paymentMethod":"pix"}'
  echo ""
done
```

**Resposta esperada na 11ª requisição:**
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "retryAfter": 60
}
```

### 2. Verificar Logs

```bash
supabase functions logs mercadopago-create-payment --project-ref wivbtmtgpsxupfjwwovf
```

**Logs esperados:**
```
[WARN] Rate limit excedido { identifier: 'ip:123.456.789.0' }
```

---

## 🎯 Quando Adicionar de Volta?

**Recomendação:**

1. ✅ **Agora:** Teste a correção de sandbox/produção (já deployada)
2. ⏳ **Depois:** Quando validar que está funcionando, adicione rate limiting
3. 🔒 **Produção:** Sempre tenha rate limiting ativo em produção

**Prioridade:** Média (não é crítico para funcionalidade, mas importante para segurança)

---

## 📁 Arquivos Anexados

- `_shared/rate-limit.ts` - Código completo do rate limiting

---

## 🚀 Resumo

**Deploy via CLI (mais fácil):**
```bash
supabase functions deploy mercadopago-create-payment --project-ref wivbtmtgpsxupfjwwovf --no-verify-jwt
supabase functions deploy mercadopago-webhook --project-ref wivbtmtgpsxupfjwwovf --no-verify-jwt
```

**Ou adicione manualmente via Dashboard seguindo os passos acima.**

---

**Desenvolvido com ❤️ seguindo o Rise Architect Protocol**
