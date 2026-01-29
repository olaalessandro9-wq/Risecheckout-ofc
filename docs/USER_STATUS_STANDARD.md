# Padrões de Status de Usuário - RiseCheckout

> **RISE Protocol V3** - Documentação de Campos de Status

## Campos de Status

| Campo | Tipo | Uso | Valores | Verificado no Login |
|-------|------|-----|---------|---------------------|
| `status` | TEXT | Moderação admin | `active`, `suspended`, `banned` | ✅ Sim |
| `account_status` | ENUM | Fluxo de autenticação | `active`, `pending_setup`, `reset_required`, `owner_no_password` | ✅ Sim |
| `is_active` | BOOLEAN | Legado (deprecated) | `true`, `false` | ✅ Sim |

## Hierarquia de Verificação no Login

A ordem de verificação no `handleLogin` é:

```
1. is_active = false      → 403 "Conta desativada"
2. status = "banned"      → 403 "Conta permanentemente banida"
3. status = "suspended"   → 403 "Conta suspensa" (+ motivo se disponível)
4. account_status checks  → Verificações de setup de senha
5. password validation    → Verificação de senha bcrypt
```

## Campos de Moderação (Tabela `users` - SSOT)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `status` | TEXT | Status de moderação (`active`, `suspended`, `banned`) |
| `status_reason` | TEXT | Motivo da suspensão/ban (exibido ao usuário) |
| `status_changed_at` | TIMESTAMP | Data/hora da última alteração de status |
| `status_changed_by` | UUID | ID do admin/owner que alterou o status |

## Fluxos de Moderação

### Suspender Usuário

1. Admin/Owner acessa aba de usuários
2. Clica no usuário e seleciona "Suspender"
3. Preenche motivo (opcional mas recomendado)
4. Sistema atualiza:
   - `status = 'suspended'`
   - `status_reason = '[motivo]'`
   - `status_changed_at = now()`
   - `status_changed_by = [admin_id]`
5. Login do usuário é bloqueado com mensagem informativa

### Banir Usuário

1. Admin/Owner acessa aba de usuários
2. Clica no usuário e seleciona "Banir"
3. Sistema atualiza:
   - `status = 'banned'`
   - `status_changed_at = now()`
   - `status_changed_by = [admin_id]`
4. Login do usuário é permanentemente bloqueado

### Reativar Usuário

1. Admin/Owner acessa aba de usuários
2. Clica no usuário suspenso/banido e seleciona "Ativar"
3. Sistema atualiza:
   - `status = 'active'`
   - `status_reason = NULL`
   - `status_changed_at = now()`
   - `status_changed_by = [admin_id]`
4. Usuário pode fazer login novamente

## Logs de Segurança

Todas as ações de moderação são registradas via `log_security_event`:

| Ação | Evento |
|------|--------|
| Suspensão | `USER_STATUS_CHANGED_TO_SUSPENDED` |
| Banimento | `USER_STATUS_CHANGED_TO_BANNED` |
| Reativação | `USER_STATUS_CHANGED_TO_ACTIVE` |
| Login bloqueado (suspenso) | `LOGIN_BLOCKED` (reason: account_suspended) |
| Login bloqueado (banido) | `LOGIN_BLOCKED` (reason: account_banned) |

## Futuro: Unificação (V4)

Planejado para uma versão futura:

- Migrar todos os estados para um único campo `account_state` com ENUM completo
- Valores: `active`, `pending_setup`, `reset_required`, `suspended`, `banned`
- Eliminar redundância entre `status` e `account_status`

---

**Última atualização:** 2026-01-21
