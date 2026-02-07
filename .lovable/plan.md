
# MFA via TOTP (Google Authenticator) para Admin e Owner

## Objetivo

Implementar autenticacao de dois fatores (MFA) obrigatoria para contas com role `admin` e `owner`, usando exclusivamente o protocolo TOTP compativel com Google Authenticator.

---

## Arquitetura do Fluxo

O MFA sera integrado como uma etapa intermediaria no fluxo de login existente. O login com email+senha continua funcionando normalmente, mas para roles `admin` e `owner`, a sessao so e criada APOS a verificacao do codigo TOTP.

```text
┌─────────────────────────────────────────────────────────────┐
│                     FLUXO DE LOGIN                          │
│                                                              │
│  1. Usuario envia email + senha                             │
│  2. Backend valida credenciais (como hoje)                  │
│  3. Backend verifica roles do usuario                       │
│     ├── NAO e admin/owner → Cria sessao normalmente         │
│     └── E admin/owner → Verifica se MFA esta ativado        │
│         ├── MFA NAO ativado → Retorna mfa_setup_required    │
│         └── MFA ativado → Retorna mfa_required              │
│  4. Frontend exibe tela de codigo TOTP (6 digitos)          │
│  5. Usuario digita codigo do Google Authenticator           │
│  6. Backend valida codigo TOTP                              │
│  7. Se valido → Cria sessao (cookies httpOnly)              │
│  8. Se invalido → Erro, tenta novamente                     │
└─────────────────────────────────────────────────────────────┘
```

```text
┌─────────────────────────────────────────────────────────────┐
│                 FLUXO DE SETUP MFA                           │
│                                                              │
│  1. Admin/Owner acessa /perfil ou faz primeiro login         │
│  2. Backend gera TOTP secret + otpauth URI                  │
│  3. Frontend exibe QR Code para escanear                    │
│  4. Usuario escaneia com Google Authenticator                │
│  5. Usuario digita codigo de confirmacao (6 digitos)        │
│  6. Backend valida codigo contra o secret                   │
│  7. Se valido → Salva secret criptografado no banco         │
│  8. Gera backup codes (8 codigos de uso unico)              │
│  9. Exibe backup codes para o usuario salvar                │
│  10. MFA ativado - proximos logins exigirao TOTP            │
└─────────────────────────────────────────────────────────────┘
```

---

## Analise de Solucoes

### Solucao A: TOTP Server-Side com otpauth (Deno) + QR no Frontend

- Backend (Edge Function) gera e valida TOTP usando a biblioteca `otpauth` (compativel com Deno via `jsr:@hectorm/otpauth`)
- Secret TOTP armazenado criptografado na tabela `user_mfa` (AES-256 via secret do Supabase)
- QR Code gerado no frontend usando a biblioteca `qrcode` (ja instalada no projeto)
- Backup codes gerados server-side, armazenados como hashes bcrypt
- Manutenibilidade: 10/10 (modulo isolado, zero acoplamento com auth existente)
- Zero DT: 10/10 (criptografia server-side, backup codes, flow completo)
- Arquitetura: 10/10 (SSOT no backend, frontend so renderiza)
- Escalabilidade: 10/10 (suporta futuras extensoes como FIDO2/WebAuthn)
- Seguranca: 10/10 (secret nunca exposto ao frontend, httpOnly cookies, rate limiting)
- **NOTA FINAL: 10.0/10**

### Solucao B: TOTP inteiramente no Frontend

- Manutenibilidade: 4/10 (secret exposto no client-side)
- Zero DT: 3/10 (seguranca comprometida desde o inicio)
- Arquitetura: 2/10 (viola RISE V3 - dados sensiveis no frontend)
- Escalabilidade: 5/10
- Seguranca: 1/10 (secret TOTP acessivel via DevTools)
- **NOTA FINAL: 2.8/10**

### DECISAO: Solucao A (Nota 10.0)

A Solucao B e descartada por violar principios fundamentais de seguranca. O secret TOTP NUNCA pode ser exposto ao frontend.

---

## Plano de Implementacao Detalhado

### 1. Banco de Dados - Nova tabela `user_mfa`

```text
user_mfa
├── id (uuid, PK)
├── user_id (uuid, FK → users.id, UNIQUE)
├── totp_secret_encrypted (text, NOT NULL) -- AES-256 encrypted
├── totp_secret_iv (text, NOT NULL) -- Initialization vector
├── is_enabled (boolean, DEFAULT false)
├── backup_codes_hash (text[]) -- Array de hashes bcrypt
├── backup_codes_used (text[]) -- Array de hashes ja usados
├── created_at (timestamptz)
├── updated_at (timestamptz)
├── verified_at (timestamptz) -- Quando o setup foi confirmado
└── last_used_at (timestamptz) -- Ultimo uso bem-sucedido
```

- RLS: Acesso apenas via Edge Functions (service_role)
- Indices: user_id (UNIQUE)

### 2. Backend - Edge Function `unified-auth` (novos handlers)

Quatro novos handlers adicionados ao router existente:

| Handler | Endpoint | Descricao |
|---------|----------|-----------|
| `mfa-setup` | POST /mfa-setup | Gera TOTP secret + otpauth URI |
| `mfa-verify-setup` | POST /mfa-verify-setup | Confirma setup com codigo TOTP |
| `mfa-verify` | POST /mfa-verify | Valida codigo durante login |
| `mfa-disable` | POST /mfa-disable | Desativa MFA (requer senha + codigo) |

**Detalhes tecnicos:**

- Biblioteca TOTP: `jsr:@hectorm/otpauth` (funciona nativamente no Deno)
- Criptografia do secret: AES-256-GCM usando `MFA_ENCRYPTION_KEY` (Supabase Secret)
- Backup codes: 8 codigos alfanumericos de 8 caracteres, armazenados como hashes bcrypt
- Rate limiting: Maximo 5 tentativas de codigo por sessao temporaria
- Window de validacao: 1 step (30 segundos antes/depois) para tolerancia de clock drift

**Mudanca no handler `login.ts`:**

Apos validar credenciais e antes de criar a sessao, o login verificara:
1. O usuario tem role `admin` ou `owner`?
2. Se sim, tem MFA ativado (`user_mfa.is_enabled = true`)?
   - Se MFA ativado: retorna `{ mfa_required: true, mfa_session_token: "..." }` (token temporario de 5 min)
   - Se MFA NAO ativado: retorna `{ mfa_setup_required: true, mfa_session_token: "..." }`
3. Se nao e admin/owner: cria sessao normalmente (fluxo atual inalterado)

O `mfa_session_token` e um token temporario (5 min) que identifica o usuario durante o fluxo MFA sem criar uma sessao completa.

### 3. Backend - Shared module `_shared/mfa-helpers.ts`

Modulo utilitario contendo:
- `encryptTotpSecret(secret, key)` -- AES-256-GCM encryption
- `decryptTotpSecret(encrypted, iv, key)` -- AES-256-GCM decryption
- `generateBackupCodes(count)` -- Gera codigos alfanumericos
- `hashBackupCode(code)` -- bcrypt hash de backup code
- `verifyBackupCode(code, hashes)` -- Verifica backup code

### 4. Backend - Shared module `_shared/mfa-session.ts`

Gerencia tokens temporarios de MFA:
- `createMfaSession(userId)` -- Cria token temporario (5 min, armazenado na tabela `mfa_sessions`)
- `validateMfaSession(token)` -- Valida token temporario
- `consumeMfaSession(token)` -- Invalida apos uso

Nova tabela auxiliar `mfa_sessions`:
```text
mfa_sessions
├── id (uuid, PK)
├── user_id (uuid, FK → users.id)
├── token (text, UNIQUE)
├── expires_at (timestamptz)
├── is_used (boolean, DEFAULT false)
└── created_at (timestamptz)
```

### 5. Frontend - Componentes

| Componente | Localizacao | Descricao |
|------------|-------------|-----------|
| `MfaVerifyDialog` | `src/components/auth/MfaVerifyDialog.tsx` | Modal com 6 slots OTP para digitar codigo |
| `MfaSetupWizard` | `src/components/auth/MfaSetupWizard.tsx` | Wizard: QR Code → Confirmar codigo → Backup codes |
| `MfaSettingsCard` | `src/components/auth/MfaSettingsCard.tsx` | Card na pagina /perfil para gerenciar MFA |

**MfaVerifyDialog**: Usa o componente `InputOTP` ja existente no projeto (6 slots). Aparece como modal apos login quando `mfa_required: true`.

**MfaSetupWizard**: Steps:
1. Exibe QR Code (gerado via `qrcode` library -- ja instalada)
2. Input para digitar codigo de confirmacao
3. Exibe backup codes para o usuario salvar/copiar
4. Botao de confirmacao final

**MfaSettingsCard**: Exibido na pagina `/perfil` para roles `admin` e `owner`:
- Se MFA ativado: mostra status "Ativo" + botao "Desativar" (requer senha + codigo)
- Se MFA desativado: mostra botao "Ativar Autenticacao de Dois Fatores"

### 6. Frontend - Modificacoes no fluxo de login

**`src/pages/Auth.tsx`**: Apos `login()` retornar, verificar `mfa_required` ou `mfa_setup_required`:
- `mfa_required` → Abrir `MfaVerifyDialog`
- `mfa_setup_required` → Redirecionar para `/perfil` com toast explicativo

**`src/hooks/useUnifiedAuth.ts`**: Adicionar handler para `mfa_verify` que chama o endpoint e, em caso de sucesso, atualiza o cache do React Query com os dados da sessao.

### 7. Secrets necessarias

| Secret | Descricao |
|--------|-----------|
| `MFA_ENCRYPTION_KEY` | Chave AES-256 para criptografar TOTP secrets (32 bytes, base64) |

### 8. Atualizacao do EDGE_FUNCTIONS_REGISTRY.md

Adicionar os 4 novos endpoints ao registry com categorias e documentacao.

---

## Secao Tecnica - Arvore de Arquivos

```text
Novos arquivos:
├── supabase/functions/_shared/mfa-helpers.ts          (~120 linhas)
├── supabase/functions/_shared/mfa-session.ts          (~80 linhas)
├── supabase/functions/unified-auth/handlers/mfa-setup.ts          (~150 linhas)
├── supabase/functions/unified-auth/handlers/mfa-verify-setup.ts   (~120 linhas)
├── supabase/functions/unified-auth/handlers/mfa-verify.ts         (~130 linhas)
├── supabase/functions/unified-auth/handlers/mfa-disable.ts        (~100 linhas)
├── src/components/auth/MfaVerifyDialog.tsx             (~150 linhas)
├── src/components/auth/MfaSetupWizard.tsx              (~200 linhas)
├── src/components/auth/MfaSettingsCard.tsx             (~120 linhas)

Arquivos modificados:
├── supabase/functions/unified-auth/index.ts            (+ 8 linhas: novos routes)
├── supabase/functions/unified-auth/handlers/login.ts   (+ ~30 linhas: MFA check)
├── src/pages/Auth.tsx                                  (+ ~20 linhas: MFA dialog)
├── src/pages/Perfil.tsx                                (+ ~5 linhas: MFA card)
├── src/hooks/useUnifiedAuth.ts                         (+ ~15 linhas: mfaVerify)
├── docs/EDGE_FUNCTIONS_REGISTRY.md                     (+ registro)

Migracao SQL:
├── Criar tabela user_mfa
├── Criar tabela mfa_sessions
├── RLS policies (deny all client, allow service_role)
```

---

## Verificacao RISE V3

| Checkpoint | Status |
|------------|--------|
| Melhor solucao possivel? | Sim - TOTP server-side, nota 10.0 |
| Existe solucao com nota maior? | Nao |
| Cria divida tecnica? | Zero |
| Precisaremos "melhorar depois"? | Nao - flow completo com backup codes |
| Codigo sobrevive 10 anos? | Sim - TOTP e padrao RFC 6238, estavel |
| Escolhido por ser mais rapido? | Nao - escolhido por ser o mais seguro |
| Frontend acessa banco direto? | Nao - tudo via Edge Functions |
| Secrets expostos? | Nao - MFA_ENCRYPTION_KEY via Supabase Secrets |
