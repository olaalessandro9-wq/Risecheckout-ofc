# Memory: Email Tracking Policy

**Updated:** 2026-02-05
**Status:** STABLE - RISE V3 Compliant (10.0/10)

---

## Política de Tracking

O tracking de emails (clicks e opens) está **DESATIVADO por padrão**.

### Motivos Técnicos

1. **Compatibilidade com Gmail**: O tracking do ZeptoMail injeta código extra
   no HTML (pixels de rastreamento e reescrita de links), aumentando o tamanho
   do email e causando truncamento ("3 pontinhos" / "View entire message")

2. **Emails transacionais**: O RiseCheckout envia apenas emails transacionais:
   - Confirmação de compra
   - Reset de senha
   - Convites de acesso à área de membros
   - Notificações LGPD

3. **Privacidade**: Tracking não é necessário nem esperado em emails transacionais

4. **Padrão da indústria**: Emails transacionais tipicamente não têm tracking

---

## Configuração

**Arquivo:** `supabase/functions/_shared/zeptomail.ts`

```typescript
// Linhas 115-116 - DEFAULT: FALSE
track_clicks: params.trackClicks ?? false,
track_opens: params.trackOpens ?? false,
```

---

## Como Ativar (se necessário)

Para ativar tracking em um email específico (ex: newsletter futura):

```typescript
await sendEmail({
  to: { email: 'user@example.com' },
  subject: 'Newsletter',
  htmlBody: '<p>...</p>',
  trackClicks: true,  // Explicitamente ativado
  trackOpens: true,
});
```

---

## RISE V3 Compliance

| Critério | Status |
|----------|--------|
| Default seguro (tracking off) | ✅ TRUE |
| Opt-in explícito | ✅ TRUE |
| Zero modificação de HTML por padrão | ✅ TRUE |
| Compatibilidade Gmail | ✅ TRUE |
| Single Source of Truth | ✅ TRUE (centralizado em zeptomail.ts) |
| Zero dívida técnica | ✅ TRUE |

**Score: 10.0/10**

---

## Histórico

| Data | Alteração |
|------|-----------|
| 2026-02-05 | Default alterado de `true` para `false` |
| 2026-02-05 | Testes unitários atualizados |
| 2026-02-05 | Documentação Memory criada |