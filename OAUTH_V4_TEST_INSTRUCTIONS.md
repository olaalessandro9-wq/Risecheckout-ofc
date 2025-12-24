# Instruções de Teste - OAuth v4

## Data: 20/11/2025
## Versão: mercadopago-oauth-callback v4

---

## 🎯 O Que Foi Corrigido

### Problema Identificado
O erro `invalid_client_id or client_secret` estava ocorrendo porque:
- **Enviávamos:** `Content-Type: application/x-www-form-urlencoded`
- **Mercado Pago esperava:** `Content-Type: application/json`

### Solução Implementada
- ✅ Mudou `Content-Type` para `application/json`
- ✅ Mudou body de `URLSearchParams` para `JSON.stringify()`
- ✅ Adicionou logs detalhados para debug
- ✅ Adicionou indicador de versão nas páginas

---

## 📋 Como Testar

### Passo 1: Gerar URL de Autorização

Use esta URL para iniciar o fluxo OAuth (substitua `VENDOR_ID` pelo ID do vendedor):

```
https://auth.mercadopago.com/authorization?client_id=2354396684039370&response_type=code&platform_id=mp&state=VENDOR_ID&redirect_uri=https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/mercadopago-oauth-callback
```

**Exemplo com vendor_id = 123:**
```
https://auth.mercadopago.com/authorization?client_id=2354396684039370&response_type=code&platform_id=mp&state=123&redirect_uri=https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/mercadopago-oauth-callback
```

### Passo 2: Autorizar no Mercado Pago

1. Abra a URL no navegador
2. Faça login na conta do Mercado Pago
3. Autorize a aplicação "risecheckout2"
4. Aguarde o redirecionamento

### Passo 3: Verificar Resultado

#### ✅ Sucesso Esperado:
- Página mostra: **"✅ Conta Conectada!"**
- Mostra email, ID e ambiente (Produção/Teste)
- Rodapé mostra: **"OAuth v4 - JSON Format"**
- Página fecha automaticamente após 5 segundos

#### ❌ Se Ainda Houver Erro:
- Página mostra: **"❌ Erro na Conexão"**
- Mostra detalhes do erro
- Rodapé mostra: **"OAuth v4 - JSON Format"**

### Passo 4: Verificar Logs

Acesse os logs da Edge Function:
```
https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/logs/edge-functions?fn=mercadopago-oauth-callback
```

**Logs esperados na v4:**
```
[MercadoPago OAuth v4] Callback recebido: { code: true, codeLength: 43, state: "123", ... }
[MercadoPago OAuth v4] Trocando código por access token...
[MercadoPago OAuth v4] Dados da requisição: { client_id: "...", grant_type: "authorization_code", ... }
[MercadoPago OAuth v4] Status da resposta: { status: 200, statusText: "OK", ... }
[MercadoPago OAuth v4] Access token obtido com sucesso: { token_type: "bearer", ... }
[MercadoPago OAuth v4] Buscando informações do usuário...
[MercadoPago OAuth v4] Dados do usuário obtidos: { email: "...", id: ..., site_id: "MLB" }
[MercadoPago OAuth v4] ✅ Integração salva com sucesso!
```

---

## 🔍 Possíveis Cenários

### Cenário 1: Sucesso Total ✅
**Resultado:** Página de sucesso, integração salva no banco
**Ação:** OAuth está funcionando! Pode prosseguir para implementar split de pagamento

### Cenário 2: Ainda Erro `invalid_client` ❌
**Possíveis causas:**
1. **PKCE está habilitado** - Verificar no dashboard se PKCE está ativo
2. **Redirect URI diferente** - Verificar se a URL está exatamente igual no dashboard
3. **Credenciais erradas** - Verificar se Client ID e Secret estão corretos

**Ação:** Verificar logs detalhados e investigar causa específica

### Cenário 3: Erro `invalid_grant` ❌
**Causa:** Código de autorização expirou (validade de 10 minutos)
**Ação:** Tentar novamente mais rápido

### Cenário 4: Erro ao buscar usuário ❌
**Causa:** Access Token obtido mas inválido
**Ação:** Verificar se token está correto nos logs

---

## 🛠️ Troubleshooting

### Se PKCE Estiver Habilitado

Verificar no dashboard: **Detalhes da aplicação → Editar → PKCE**

Se estiver habilitado, precisamos implementar:

1. **Gerar code_verifier:**
```typescript
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}
```

2. **Gerar code_challenge:**
```typescript
async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(hash));
}
```

3. **Adicionar na URL de autorização:**
```
&code_challenge=CHALLENGE&code_challenge_method=S256
```

4. **Enviar code_verifier no callback:**
```json
{
  "client_id": "...",
  "client_secret": "...",
  "grant_type": "authorization_code",
  "code": "...",
  "redirect_uri": "...",
  "code_verifier": "..."
}
```

### Se Redirect URI Estiver Diferente

1. Acessar dashboard do Mercado Pago
2. Ir em "Suas aplicações" → "risecheckout2"
3. Verificar campo "URLs de redirecionamento"
4. Copiar EXATAMENTE como está
5. Atualizar constante `REDIRECT_URI` no código

---

## 📊 Checklist de Teste

- [ ] Gerar URL de autorização com vendor_id válido
- [ ] Abrir URL no navegador
- [ ] Fazer login no Mercado Pago
- [ ] Autorizar aplicação
- [ ] Verificar se página de sucesso aparece
- [ ] Verificar se mostra "OAuth v4 - JSON Format"
- [ ] Verificar logs da Edge Function
- [ ] Verificar se integração foi salva na tabela `vendor_integrations`
- [ ] Testar com conta diferente (se possível)

---

## 📝 Próximos Passos Após Sucesso

1. ✅ Implementar credenciais padrão do dono da plataforma
2. ✅ Implementar split de pagamento (Marketplace)
3. ✅ Configurar webhook URL no dashboard do Mercado Pago
4. ✅ Testar fluxo completo de pagamento
5. ✅ Testar PIX e outros métodos de pagamento

---

## 🆘 Se Precisar de Ajuda

**Informações para fornecer:**
- Logs completos da Edge Function
- Screenshot da página de erro (se houver)
- Configuração do dashboard do Mercado Pago
- Vendor ID usado no teste
- Timestamp da tentativa

**Contato:**
- Verificar logs em: https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/logs
- Verificar função em: https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/functions
