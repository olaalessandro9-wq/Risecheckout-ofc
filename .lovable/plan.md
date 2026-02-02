

# Plano: Correção de CSS + Diagnóstico do Erro ZeptoMail

---

## Resumo Executivo

**Dois problemas identificados:**

1. **CSS Bugado**: Uso de `text-white` hardcoded violando o RISE Protocol V3 em vários arquivos de autenticação
2. **Erro 401 ZeptoMail**: Token de API inválido ou mal formatado causando falha no envio de email

---

## ✅ Problema 1: CSS Violando RISE Protocol - RESOLVIDO

### Arquivos corrigidos:

| Arquivo | Linhas corrigidas |
|---------|-------------------|
| `ResetPasswordLayout.tsx` | 34, 36, 50, 52, 64 |
| `BuyerRecuperarSenha.tsx` | 101, 103, 119, 136, 146, 164, 190, 193, 200, 225, 236, 241, 259, 261, 273 |

Todas as ocorrências de `text-white` foram substituídas por `text-[hsl(var(--auth-text-primary))]`.

---

## ⏳ Problema 2: Erro 401 do ZeptoMail - AÇÃO DO USUÁRIO NECESSÁRIA

### Diagnóstico (logs confirmados)

Os logs mostram dois problemas:

```text
1. [ERROR] [ZeptoMail] API error {"status":401,"details":[{"message":"Invalid API Token found"}]}

2. [INFO] [ZeptoMail] Sending email {"from":"PLACEHOLDER_VALUE_TO_BE_REPLACED",...}
```

### Causa Raiz

**O secret `ZEPTOMAIL_FROM_NOREPLY` contém um placeholder (`PLACEHOLDER_VALUE_TO_BE_REPLACED`) ao invés de um email real!**

Além disso, o token `ZEPTOMAIL_API_KEY` pode estar em formato incorreto.

### Formato Correto do Token ZeptoMail

O token DEVE estar exatamente neste formato:

```
Zoho-enczapikey wSsVR61q...token_completo...
```

Onde:
- `Zoho-enczapikey` (com `Z` maiúsculo e hífen)
- **Espaço** entre o prefixo e o token
- Token base64 completo copiado do painel ZeptoMail

### Solução

**No Supabase Dashboard → Edge Functions → Manage Secrets:**

1. **Verificar/Atualizar `ZEPTOMAIL_API_KEY`:**
   - Acessar: https://mail.zoho.com → Agentes → mail_agent_1 → SMTP/API → API
   - Copiar o token completo (já vem com o prefixo `Zoho-enczapikey`)
   - Colar no secret `ZEPTOMAIL_API_KEY`

2. **Verificar/Atualizar `ZEPTOMAIL_FROM_NOREPLY`:**
   - Valor: `naoresponda@risecheckout.com` (ou seu email verificado)
   - **NÃO pode ser** `PLACEHOLDER_VALUE_TO_BE_REPLACED`

3. **Verificar outros secrets de remetente:**
   - `ZEPTOMAIL_FROM_SUPPORT`: `suporte@risecheckout.com`
   - `ZEPTOMAIL_FROM_NOTIFICATIONS`: `notificacoes@risecheckout.com`
   - `ZEPTOMAIL_FROM_NAME`: `Rise Checkout`

---

## Checklist de Configuração (Supabase Secrets)

| Secret | Valor Esperado | Status |
|--------|---------------|--------|
| `ZEPTOMAIL_API_KEY` | `Zoho-enczapikey [TOKEN]` | ❌ Verificar formato |
| `ZEPTOMAIL_FROM_NOREPLY` | `naoresponda@risecheckout.com` | ❌ PLACEHOLDER detectado |
| `ZEPTOMAIL_FROM_SUPPORT` | `suporte@risecheckout.com` | ⚠️ Verificar |
| `ZEPTOMAIL_FROM_NOTIFICATIONS` | `notificacoes@risecheckout.com` | ⚠️ Verificar |
| `ZEPTOMAIL_FROM_NAME` | `Rise Checkout` | ⚠️ Verificar |

---

## Próximos Passos

1. ✅ **Correções de CSS implementadas**
2. ⏳ **Você verifica e atualiza os secrets** no Supabase Dashboard
3. ⏳ **Testamos o fluxo** de recuperação de senha em risecheckout.com

---

## Detalhes Técnicos

### Por que o erro diz "Invalid API Token" mesmo com token "correto"?

O código em `zeptomail.ts` envia o header assim:

```typescript
'Authorization': apiKey, // Já inclui "Zoho-enczapikey"
```

Se o secret `ZEPTOMAIL_API_KEY` tiver:
- Espaços extras no início/fim
- Quebras de linha invisíveis
- Formato incorreto (`zoho-enczapikey` minúsculo ou sem espaço)

O ZeptoMail retorna 401 porque o token não corresponde exatamente.

### Sobre o Placeholder no From Email

O log mostra:
```
"from":"PLACEHOLDER_VALUE_TO_BE_REPLACED"
```

Isso significa que algum secret de remetente nunca foi configurado com valor real. Mesmo que não cause o erro 401 (que é do token), causará falha de entrega se o domínio não estiver verificado.
