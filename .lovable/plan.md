

# Checkbox Obrigatorio de Aceite de Termos no Cadastro

## Contexto

Atualmente, o formulario de cadastro (`ProducerRegistrationForm.tsx`) exibe um texto passivo "Ao se registrar, voce concorda com nossos Termos de Uso e Politica de Privacidade" -- sem exigir acao explicita do usuario. Isso nao constitui aceite juridico valido e nao e registrado no banco de dados.

A tabela `public.users` nao possui nenhuma coluna para registrar o aceite de termos.

## O Que Sera Feito

### 1. Banco de Dados - Adicionar coluna `terms_accepted_at`

Nova coluna na tabela `public.users`:

| Coluna | Tipo | Default | Nullable |
|--------|------|---------|----------|
| `terms_accepted_at` | `timestamptz` | `null` | YES |

O campo e `nullable` porque usuarios criados antes dessa feature nao terao aceite registrado. O valor sera preenchido com `NOW()` no momento do registro via backend.

Usar `timestamptz` (e nao boolean) porque:
- Registra **quando** o aceite foi feito (auditoria juridica)
- Permite rastrear aceites historicos
- Padrao LGPD para registro de consentimento

### 2. Frontend - Checkbox obrigatorio no formulario

No arquivo `src/components/auth/ProducerRegistrationForm.tsx`:

- Adicionar estado local `termsAccepted` (boolean)
- Adicionar checkbox com label contendo links para `/termos-de-uso` e `/politica-de-privacidade`
- O checkbox substitui o texto passivo atual ("Ao se registrar...")
- Posicionar entre o campo de senha e o botao "Criar conta"
- Validacao: se `termsAccepted === false`, bloquear envio e exibir mensagem de erro
- Enviar `termsAccepted: true` no payload para o backend

O checkbox **nao sera persistido no sessionStorage** (seguranca juridica: o aceite deve ser consciente a cada tentativa).

### 3. Backend - Registrar aceite no banco

No arquivo `supabase/functions/unified-auth/handlers/register.ts`:

- Receber campo `termsAccepted` no body da request
- **Validar** que `termsAccepted === true` (rejeitar se falso/ausente)
- No `INSERT` do usuario, incluir `terms_accepted_at: new Date().toISOString()`

---

## Secao Tecnica

### Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| **Migracao SQL** | Adicionar coluna `terms_accepted_at timestamptz` |
| `src/components/auth/ProducerRegistrationForm.tsx` | Adicionar checkbox + estado + validacao |
| `supabase/functions/unified-auth/handlers/register.ts` | Receber e validar `termsAccepted`, gravar timestamp |

### Validacao dupla (frontend + backend)

- **Frontend**: Botao desabilitado ou erro visual se checkbox nao marcado
- **Backend**: Rejeita request com `400 Bad Request` se `termsAccepted !== true`

### Nao sera persistido no sessionStorage

O campo `termsAccepted` e deliberadamente excluido da persistencia. O usuario deve marcar conscientemente o checkbox a cada tentativa de cadastro, garantindo consentimento ativo.

