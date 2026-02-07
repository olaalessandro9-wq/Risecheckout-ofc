
# Implementar Verificacao de Email no Cadastro (Unified Auth)

## Diagnostico da Causa Raiz

O toggle "Confirm email" no painel do Supabase so afeta o sistema nativo `auth.signUp()` da tabela `auth.users`. O Rise Checkout usa um sistema de autenticacao **completamente customizado** (Unified Auth V2) que:

1. Cria usuarios diretamente na tabela `public.users`
2. Gerencia suas proprias sessoes, cookies e hashing
3. **Ignora completamente** o `auth.users` do Supabase

Portanto, aquele toggle nao tem nenhum efeito. O `register.ts` cria o usuario com `account_status: "active"` e imediatamente cria uma sessao, pulando toda verificacao.

## O Que Sera Feito

### 1. Banco de Dados - Nova coluna `email_verification_token`

A tabela `public.users` ja possui `email_verified` (boolean, default `false`). Falta a infraestrutura de token para verificacao.

Nova coluna:

| Coluna | Tipo | Default | Nullable | Descricao |
|--------|------|---------|----------|-----------|
| `email_verification_token` | `text` | `null` | YES | Token criptografico para verificacao |
| `email_verification_token_expires_at` | `timestamptz` | `null` | YES | Expiracao do token (24 horas) |

Tambem sera adicionado um novo valor ao enum `account_status_enum`:

| Valor | Descricao |
|-------|-----------|
| `pending_email_verification` | Aguardando confirmacao de email |

### 2. Backend - Alterar `register.ts`

Mudancas no fluxo de registro:

- Gerar token de verificacao criptografico (`crypto.randomUUID()`)
- Criar usuario com `account_status: "pending_email_verification"` em vez de `"active"`
- `email_verified` permanece `false` (default)
- Gravar `email_verification_token` e `email_verification_token_expires_at` (24h)
- **NAO criar sessao** apos registro
- Enviar email de verificacao via ZeptoMail com link contendo o token
- Retornar resposta de sucesso informando que email de verificacao foi enviado (sem cookies de sessao)

### 3. Backend - Novo handler `verify-email.ts`

Novo endpoint `POST /unified-auth/verify-email`:

- Receber `{ token: string }` no body
- Buscar usuario com `email_verification_token` correspondente
- Validar que token nao expirou (`email_verification_token_expires_at > NOW()`)
- Atualizar usuario: `email_verified: true`, `account_status: "active"`, limpar token
- Retornar sucesso (sem criar sessao - usuario fara login manualmente)

### 4. Backend - Novo handler `resend-verification.ts`

Novo endpoint `POST /unified-auth/resend-verification`:

- Receber `{ email: string }` no body
- Buscar usuario com `account_status: "pending_email_verification"`
- Gerar novo token, atualizar no banco, enviar novo email
- Rate limit: nao reenviar se ultimo envio foi ha menos de 60 segundos

### 5. Backend - Alterar `login.ts`

Adicionar verificacao antes de permitir login:

- Se `email_verified === false` e `account_status === "pending_email_verification"`: bloquear login
- Retornar mensagem informando que o email precisa ser confirmado antes de acessar a conta
- Incluir sugestao de reenvio do email de verificacao

### 6. Email Template - `email-templates-verification.ts`

Novo template seguindo o padrao dos existentes (inline `<style>`, Gmail-compatible):

- Header com logo Rise Checkout
- Mensagem de boas-vindas com nome do usuario
- Botao CTA: "Confirmar meu email"
- Link de fallback em texto
- Footer com dominio e suporte
- Texto plano (versao text/plain)

### 7. Frontend - Tela de "Verifique seu Email"

Nova pagina `/verificar-email`:

- Exibida apos registro bem-sucedido (redirect de `ProducerRegistrationForm`)
- Mostra icone de email, mensagem "Enviamos um link de confirmacao para seu email"
- Exibe o email usado (parcialmente mascarado)
- Botao "Reenviar email" com cooldown de 60 segundos
- Link "Voltar ao login"

### 8. Frontend - Pagina `/confirmar-email`

Nova pagina que processa o link do email:

- Recebe token via query param: `/confirmar-email?token=xxx`
- Chama `POST /unified-auth/verify-email` com o token
- Exibe estados: carregando, sucesso (com botao "Ir para login"), ou erro (token expirado/invalido com opcao de reenvio)

### 9. Frontend - Alterar `ProducerRegistrationForm.tsx`

Apos registro bem-sucedido:

- Em vez de navegar para `/auth`, navegar para `/verificar-email?email=xxx`
- Remover criacao de sessao/cookies do fluxo de registro

### 10. Frontend - Alterar tratamento de erro no login

Quando login retornar erro de email nao verificado:

- Exibir mensagem especifica: "Confirme seu email antes de acessar"
- Oferecer link para reenviar verificacao

---

## Secao Tecnica

### Arquivos criados

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/unified-auth/handlers/verify-email.ts` | Handler de verificacao de token |
| `supabase/functions/unified-auth/handlers/resend-verification.ts` | Handler de reenvio de email |
| `supabase/functions/_shared/email-templates-verification.ts` | Template HTML + texto do email |
| `src/pages/VerificarEmail.tsx` | Pagina "verifique seu email" (pos-registro) |
| `src/pages/ConfirmarEmail.tsx` | Pagina que processa o link do email |

### Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| Migracao SQL | Adicionar coluna, valor no enum |
| `supabase/functions/unified-auth/index.ts` | Registrar novos handlers (verify-email, resend-verification) |
| `supabase/functions/unified-auth/handlers/register.ts` | Gerar token, enviar email, NAO criar sessao |
| `supabase/functions/unified-auth/handlers/login.ts` | Bloquear login se email nao verificado |
| `supabase/functions/_shared/auth-constants.ts` | Adicionar `PENDING_EMAIL_VERIFICATION` ao enum |
| `src/components/auth/ProducerRegistrationForm.tsx` | Redirecionar para `/verificar-email` apos registro |
| `src/routes/publicRoutes.tsx` | Adicionar rotas `/verificar-email` e `/confirmar-email` |
| `docs/EDGE_FUNCTIONS_REGISTRY.md` | Documentar novos endpoints |

### Fluxo completo

```text
[Usuario preenche cadastro]
        |
        v
[POST /unified-auth/register]
  - Cria usuario com account_status: "pending_email_verification"
  - Gera token de verificacao (UUID)
  - Salva token + expiracao (24h) no banco
  - Envia email via ZeptoMail com link: /confirmar-email?token=xxx
  - NAO cria sessao
  - Retorna { success: true, requiresEmailVerification: true }
        |
        v
[Frontend redireciona para /verificar-email]
  - Mostra "Verifique seu email"
  - Botao "Reenviar" com cooldown 60s
        |
        v
[Usuario clica no link do email]
        |
        v
[Abre /confirmar-email?token=xxx]
  - Chama POST /unified-auth/verify-email
  - Backend valida token, marca email_verified: true, account_status: "active"
  - Frontend mostra sucesso + botao "Ir para login"
        |
        v
[Usuario faz login normalmente em /auth]
```

### Seguranca

- Token gerado com `crypto.randomUUID()` (criptograficamente seguro)
- Token expira em 24 horas
- Token e de uso unico (limpo apos verificacao)
- Rate limit no reenvio (60 segundos)
- Login bloqueado ate verificacao
- Validacao dupla: frontend (UX) + backend (seguranca)
