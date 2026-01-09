# Guia de Implementação de Segurança P1 e P2

## P1: Configurar Content Security Policy (CSP) no Cloudflare

**Tempo estimado:** 30 minutos  
**Risco:** Baixo  
**Impacto:** Proteção contra XSS e injeção de scripts maliciosos

### Passo 1: Acessar o Cloudflare Dashboard

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com)
2. Selecione o domínio do RiseCheckout
3. Vá em **Security** → **WAF** → **Custom Rules** (ou **Transform Rules** → **Response Headers**)

### Passo 2: Criar a Regra de Response Header

1. Clique em **Create Rule**
2. Nome da regra: `Content-Security-Policy`
3. Em **When incoming requests match...**, selecione: `All incoming requests`
4. Em **Then...**, selecione: `Set static response header`

### Passo 3: Configurar o Header CSP

**Nome do Header:** `Content-Security-Policy`

**Valor do Header (copie exatamente):**
```
default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://js.stripe.com https://*.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mercadopago.com https://api.stripe.com https://*.cloudflareinsights.com; frame-src 'self' https://js.stripe.com https://www.mercadopago.com.br; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self';
```

### Passo 4: Salvar e Testar

1. Clique em **Deploy**
2. Aguarde 1-2 minutos para propagação
3. Acesse seu site e abra o DevTools (F12)
4. Vá na aba **Network**, clique em qualquer request
5. Em **Response Headers**, verifique se `Content-Security-Policy` está presente

### Passo 5: Validação

Teste as seguintes funcionalidades para garantir que nada quebrou:
- [ ] Login/Cadastro funciona
- [ ] Checkout com PIX funciona
- [ ] Checkout com cartão (MercadoPago) funciona
- [ ] Checkout com Stripe funciona
- [ ] Imagens carregam corretamente
- [ ] Fontes carregam corretamente

### Troubleshooting

Se algo quebrar, verifique o console do navegador por erros CSP:
- `Refused to load script...` → Adicione o domínio em `script-src`
- `Refused to load style...` → Adicione o domínio em `style-src`
- `Refused to connect...` → Adicione o domínio em `connect-src`

---

## P2: Criptografia de CPF/Phone na Tabela Orders

**Tempo estimado:** 6-8 horas  
**Risco:** Médio (requer migração de dados)  
**Impacto:** Proteção de dados sensíveis em caso de vazamento do banco

### Arquitetura da Solução

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Edge Function  │────▶│   Supabase DB   │
│                 │     │   (encrypt/decrypt)│    │   (encrypted)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Passo 1: Criar Chave de Criptografia

1. Gere uma chave AES-256 segura:
```bash
openssl rand -base64 32
```

2. Adicione como secret no Lovable:
   - Nome: `ENCRYPTION_KEY`
   - Valor: (a chave gerada)

### Passo 2: Criar Funções de Criptografia (Edge Function Shared)

Crie o arquivo `supabase/functions/_shared/encryption.ts`:

```typescript
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

async function getKey(): Promise<CryptoKey> {
  const keyBase64 = Deno.env.get('ENCRYPTION_KEY');
  if (!keyBase64) throw new Error('ENCRYPTION_KEY not configured');
  
  const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext)
  );
  
  // Format: base64(iv):base64(ciphertext)
  const ivBase64 = btoa(String.fromCharCode(...iv));
  const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  
  return `${ivBase64}:${cipherBase64}`;
}

export async function decrypt(ciphertext: string): Promise<string> {
  const key = await getKey();
  const [ivBase64, cipherBase64] = ciphertext.split(':');
  
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const cipher = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));
  
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    cipher
  );
  
  return new TextDecoder().decode(decrypted);
}

// Hash para busca (não reversível)
export async function hash(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Passo 3: Atualizar Schema do Banco

Execute esta migration:

```sql
-- Adicionar colunas criptografadas
ALTER TABLE orders 
ADD COLUMN customer_document_encrypted TEXT,
ADD COLUMN customer_document_hash TEXT,
ADD COLUMN customer_phone_encrypted TEXT,
ADD COLUMN customer_phone_hash TEXT;

-- Criar índices para busca por hash
CREATE INDEX idx_orders_document_hash ON orders(customer_document_hash);
CREATE INDEX idx_orders_phone_hash ON orders(customer_phone_hash);

-- Comentário de documentação
COMMENT ON COLUMN orders.customer_document_encrypted IS 'CPF criptografado com AES-256-GCM';
COMMENT ON COLUMN orders.customer_document_hash IS 'SHA-256 do CPF para busca';
```

### Passo 4: Atualizar Edge Function create-order

No arquivo `supabase/functions/create-order/index.ts`, adicione:

```typescript
import { encrypt, hash } from '../_shared/encryption.ts';

// Dentro da função, antes de inserir a order:
const documentEncrypted = customerDocument 
  ? await encrypt(customerDocument) 
  : null;
const documentHash = customerDocument 
  ? await hash(customerDocument) 
  : null;
const phoneEncrypted = customerPhone 
  ? await encrypt(customerPhone) 
  : null;
const phoneHash = customerPhone 
  ? await hash(customerPhone) 
  : null;

// Na inserção, use:
const { data: order, error } = await supabase
  .from('orders')
  .insert({
    // ... outros campos
    customer_document: null, // Não salvar mais em texto plano
    customer_document_encrypted: documentEncrypted,
    customer_document_hash: documentHash,
    customer_phone: null, // Não salvar mais em texto plano
    customer_phone_encrypted: phoneEncrypted,
    customer_phone_hash: phoneHash,
  });
```

### Passo 5: Criar Edge Function para Decriptografia

Crie `supabase/functions/decrypt-order-data/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decrypt } from '../_shared/encryption.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Verificar se é vendor autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { orderId } = await req.json();
    
    // Buscar order (RLS garante que só pega orders do vendor)
    const { data: order, error } = await supabase
      .from('orders')
      .select('customer_document_encrypted, customer_phone_encrypted, vendor_id')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar ownership
    if (order.vendor_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decriptografar
    const customerDocument = order.customer_document_encrypted 
      ? await decrypt(order.customer_document_encrypted) 
      : null;
    const customerPhone = order.customer_phone_encrypted 
      ? await decrypt(order.customer_phone_encrypted) 
      : null;

    return new Response(JSON.stringify({
      customerDocument,
      customerPhone,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Decrypt error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### Passo 6: Script de Migração de Dados Existentes

Crie `supabase/functions/migrate-encrypt-orders/index.ts`:

```typescript
// Esta função deve ser executada UMA VEZ para migrar dados existentes
// Depois de executada, pode ser deletada

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encrypt, hash } from '../_shared/encryption.ts';

Deno.serve(async (req) => {
  // Verificar secret de admin
  const adminSecret = req.headers.get('x-admin-secret');
  if (adminSecret !== Deno.env.get('ADMIN_MIGRATION_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Buscar orders com dados não criptografados
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, customer_document, customer_phone')
    .not('customer_document', 'is', null)
    .is('customer_document_encrypted', null)
    .limit(100); // Processar em lotes

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let processed = 0;
  let failed = 0;

  for (const order of orders || []) {
    try {
      const updates: Record<string, string | null> = {};
      
      if (order.customer_document) {
        updates.customer_document_encrypted = await encrypt(order.customer_document);
        updates.customer_document_hash = await hash(order.customer_document);
        updates.customer_document = null; // Limpar texto plano
      }
      
      if (order.customer_phone) {
        updates.customer_phone_encrypted = await encrypt(order.customer_phone);
        updates.customer_phone_hash = await hash(order.customer_phone);
        updates.customer_phone = null; // Limpar texto plano
      }

      await supabase
        .from('orders')
        .update(updates)
        .eq('id', order.id);

      processed++;
    } catch (e) {
      console.error(`Failed to process order ${order.id}:`, e);
      failed++;
    }
  }

  return new Response(JSON.stringify({
    processed,
    failed,
    remaining: (orders?.length || 0) === 100 ? 'More batches needed' : 'Complete'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### Passo 7: Atualizar Frontend para Usar Decriptação

No componente que exibe detalhes do pedido:

```typescript
// hooks/useDecryptedOrderData.ts
import { supabase } from '@/integrations/supabase/client';

export async function getDecryptedOrderData(orderId: string) {
  const { data, error } = await supabase.functions.invoke('decrypt-order-data', {
    body: { orderId }
  });
  
  if (error) throw error;
  return data;
}
```

### Passo 8: Checklist de Validação

- [ ] Secret `ENCRYPTION_KEY` adicionado no Lovable
- [ ] Secret `ADMIN_MIGRATION_SECRET` adicionado (temporário)
- [ ] Migration do banco executada
- [ ] Edge function `create-order` atualizada
- [ ] Edge function `decrypt-order-data` criada
- [ ] Edge function `migrate-encrypt-orders` criada
- [ ] Executar migração de dados existentes
- [ ] Testar criação de nova order (dados criptografados)
- [ ] Testar visualização de order (dados decriptografados)
- [ ] Remover edge function `migrate-encrypt-orders`
- [ ] Remover colunas antigas após confirmação (opcional)

### Rollback

Se algo der errado:

```sql
-- Restaurar dados (se ainda existirem nas colunas originais)
UPDATE orders 
SET customer_document = customer_document_backup,
    customer_phone = customer_phone_backup
WHERE customer_document_backup IS NOT NULL;
```

---

## Ordem de Execução Recomendada

1. ✅ **Hoje (30 min):** Configurar CSP no Cloudflare
2. 📅 **Próxima sessão (2h):** Implementar funções de criptografia
3. 📅 **Próxima sessão (2h):** Atualizar create-order e criar decrypt
4. 📅 **Próxima sessão (2h):** Migrar dados existentes e testar
5. 📅 **Final (1h):** Cleanup e validação completa

---

## Suporte

Se tiver dúvidas durante a implementação, me pergunte com o contexto específico do passo que está executando.
