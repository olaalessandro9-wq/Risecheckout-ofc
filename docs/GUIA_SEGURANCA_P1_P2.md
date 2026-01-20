# Guia de Implementação de Segurança P1 e P2

> **NOTA HISTÓRICA (2026-01-20):**  
> Este guia foi originalmente criado em 2024. Desde então:
> - A criptografia foi migrada de `_shared/encryption.ts` para `_shared/kms/index.ts`
> - O CORS foi migrado de `_shared/cors.ts` para `_shared/cors-v2.ts`
> - A autenticação de producers usa `unified-auth.ts` em vez de `supabase.auth.getUser()`
> 
> Os exemplos de código abaixo foram **ATUALIZADOS** para refletir a arquitetura atual.

---

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

### Passo 2: Usar o Módulo KMS Existente

> **ATUALIZADO 2026-01-20:** O módulo de criptografia foi consolidado em `_shared/kms/index.ts`

O sistema já possui um módulo KMS completo. Use-o:

```typescript
import { encrypt, decrypt } from '../_shared/kms/index.ts';

// Criptografar
const encryptedCpf = await encrypt(customerDocument);
const encryptedPhone = await encrypt(customerPhone);

// Decriptografar
const decryptedCpf = await decrypt(encryptedCpf);
const decryptedPhone = await decrypt(encryptedPhone);
```

### Passo 3: Atualizar Edge Function create-order

No arquivo `supabase/functions/create-order/handlers/order-creator.ts`, a criptografia já está implementada:

```typescript
import { encrypt } from '../../_shared/kms/index.ts';

// Dentro da função, antes de inserir a order:
const encryptedPhone = await encrypt(customer_phone);
const encryptedCpf = await encrypt(customer_cpf);
```

### Passo 4: Criar Edge Function para Decriptografia

> **ATUALIZADO 2026-01-20:** Use `handleCorsV2` e `requireAuthenticatedProducer`

Crie `supabase/functions/decrypt-order-data/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decrypt } from '../_shared/kms/index.ts';
import { handleCorsV2 } from '../_shared/cors-v2.ts';
import { requireAuthenticatedProducer, unauthorizedResponse } from '../_shared/unified-auth.ts';
import { jsonResponse, errorResponse } from '../_shared/response-helpers.ts';

Deno.serve(async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar autenticação via producer session
    let producerId: string;
    try {
      const producer = await requireAuthenticatedProducer(supabase, req);
      producerId = producer.id;
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    const { orderId } = await req.json();
    
    // Buscar order (verificar ownership)
    const { data: order, error } = await supabase
      .from('orders')
      .select('customer_document_encrypted, customer_phone_encrypted, vendor_id')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return errorResponse('Order not found', corsHeaders, 404);
    }

    // Verificar ownership
    if (order.vendor_id !== producerId) {
      return errorResponse('Forbidden', corsHeaders, 403);
    }

    // Decriptografar
    const customerDocument = order.customer_document_encrypted 
      ? await decrypt(order.customer_document_encrypted) 
      : null;
    const customerPhone = order.customer_phone_encrypted 
      ? await decrypt(order.customer_phone_encrypted) 
      : null;

    return jsonResponse({
      customerDocument,
      customerPhone,
    }, corsHeaders);

  } catch (error) {
    return errorResponse('Internal error', corsHeaders, 500);
  }
});
```

### Passo 5: Checklist de Validação

- [ ] Secret `ENCRYPTION_KEY` adicionado no Lovable
- [ ] Migration do banco executada (se necessário)
- [ ] Edge function `create-order` usa `kms/index.ts`
- [ ] Edge function `decrypt-order-data` criada (se necessário)
- [ ] Testar criação de nova order (dados criptografados)
- [ ] Testar visualização de order (dados decriptografados)

---

## Ordem de Execução Recomendada

1. ✅ **Hoje (30 min):** Configurar CSP no Cloudflare
2. ✅ **Próxima sessão (2h):** Verificar criptografia existente em `kms/index.ts`
3. 📅 **Se necessário:** Criar Edge Function de decriptografia
4. 📅 **Final (1h):** Cleanup e validação completa

---

## Suporte

Se tiver dúvidas durante a implementação, consulte:
- `docs/EDGE_FUNCTIONS_STYLE_GUIDE.md` - Padrões de Edge Functions
- `docs/AUTH_SYSTEM.md` - Sistema de autenticação
- `supabase/functions/_shared/kms/` - Módulo de criptografia
