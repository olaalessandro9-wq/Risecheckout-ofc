# Comparação: Implementação Atual vs Documentação OAuth

## Data: 20/11/2025

---

## 1. Implementação Atual (mercadopago-oauth-callback/index.ts)

### 1.1 Credenciais (via Environment Variables)
```typescript
const MERCADOPAGO_CLIENT_ID = Deno.env.get('MERCADOPAGO_CLIENT_ID');
const MERCADOPAGO_CLIENT_SECRET = Deno.env.get('MERCADOPAGO_CLIENT_SECRET');
const REDIRECT_URI = Deno.env.get('MERCADOPAGO_REDIRECT_URI');
```

### 1.2 Requisição de Token
```typescript
const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    client_id: MERCADOPAGO_CLIENT_ID,
    client_secret: MERCADOPAGO_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: REDIRECT_URI
  })
});
```

---

## 2. Documentação do Mercado Pago

### 2.1 Requisição Esperada
```bash
curl -X POST \
  'https://api.mercadopago.com/oauth/token' \
  -H 'Content-Type: application/json' \
  -d '{
    "client_secret": "<SEU_CLIENT_SECRET>",
    "client_id": "<SEU_CLIENT_ID>",
    "grant_type": "authorization_code",
    "code": "TG-XXXXXXXX-241983636",
    "redirect_uri": "<SEU_REDIRECT_URI>"
  }'
```

---

## 3. Erros Comuns

### 3.1 Error: `invalid_client`
**Possíveis causas:**
1. Credenciais incorretas
2. Credenciais de ambiente errado (sandbox vs production)
3. Credenciais revogadas ou expiradas
4. Aplicação não publicada/ativa

### 3.2 Error: `invalid_grant`
**Possíveis causas:**
- Código de autorização expirado (validade: 10 minutos)
- Código já utilizado
- Redirect URI não corresponde ao configurado

### 3.3 Error: `invalid_scope`
**Valores permitidos:**
- `offline_access`
- `write`
- `read`

---

## 4. PKCE (Proof Key for Code Exchange)

### 4.1 O que é?
Protocolo de segurança **opcional mas recomendado** que adiciona camada extra de proteção.

### 4.2 Como funciona?
1. Gera um `code_verifier` (43-128 caracteres aleatórios)
2. Cria `code_challenge` a partir do `code_verifier` (SHA256 + Base64URL)
3. Envia `code_challenge` na URL de autorização
4. Envia `code_verifier` ao trocar o code por token

---

## 5. Configuração Recomendada

### Credenciais (via Supabase Secrets)

Configure as seguintes variáveis no Supabase Dashboard:

```
MERCADOPAGO_CLIENT_ID = <SEU_CLIENT_ID>
MERCADOPAGO_CLIENT_SECRET = <SEU_CLIENT_SECRET>
MERCADOPAGO_REDIRECT_URI = https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/mercadopago-oauth-callback
```

**Link:** https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/settings/secrets

---

## 6. Checklist de Implementação

### Imediatas
- [x] Content-Type correto (`application/json`)
- [x] Body format correto (`JSON.stringify()`)
- [x] Credenciais via environment variables
- [ ] Verificar se PKCE está habilitado no dashboard

### Se PKCE Estiver Habilitado
- [ ] Implementar geração de `code_verifier`
- [ ] Implementar geração de `code_challenge`
- [ ] Adicionar campos na URL de autorização
- [ ] Salvar `code_verifier` no banco (tabela temporária)

### Testes
- [ ] Testar fluxo completo
- [ ] Verificar logs de erro
- [ ] Testar com conta de teste
- [ ] Testar com conta de produção

---

## 7. Resumo

| Item | Status | Prioridade |
|------|--------|------------|
| Content-Type JSON | ✅ Implementado | - |
| Body JSON.stringify | ✅ Implementado | - |
| Credenciais via ENV | ✅ Implementado | - |
| PKCE | ⚠️ Verificar | Alta |
| Redirect URI | ✅ Configurável | - |
