# Política de Segurança

## 1. Introdução

Esta política de segurança descreve as diretrizes e melhores práticas para garantir a segurança do projeto `risecheckout-84776`.

## 2. Gerenciamento de Secrets

### 2.1 Armazenamento de Secrets

**NUNCA** faça commit de secrets diretamente no repositório. Todos os secrets devem ser armazenados no **Supabase Vault**.

- **Produção:** Use o Supabase Vault para armazenar chaves de API, tokens e outros secrets.
- **Desenvolvimento:** Use um arquivo `.env.local` (que está no `.gitignore`) para secrets locais.

### 2.2 Acesso a Secrets

- **Edge Functions:** Use `Deno.env.get("SECRET_NAME")` para acessar secrets do Supabase.
- **Frontend:** Use as chaves públicas (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) que são seguras para expor.

### 2.3 Rotação de Secrets

- **Tokens de curta duração:** Use tokens que expiram (ex: OAuth 2.0).
- **Rotação periódica:** Rotacione secrets críticos a cada 90 dias.
- **Em caso de exposição:** Rotacione imediatamente e siga o plano de resposta a incidentes.

## 3. Prevenção de Vazamento de Secrets

### 3.1 Gitleaks CI/CD

O repositório está configurado com um workflow do **Gitleaks** que roda em cada `push` e `pull_request`. Pull requests com secrets serão **automaticamente bloqueados**.

### 3.2 Pre-commit Hooks (Recomendado)

Para prevenir commits locais com secrets, instale o `pre-commit` e o `gitleaks`:

```bash
# Instalar pre-commit
pip install pre-commit

# Instalar gitleaks
brew install gitleaks  # (macOS)
# ou use outro método de instalação

# Configurar pre-commit
pre-commit install
```

O arquivo `.pre-commit-config.yaml` já está configurado no repositório.

## 4. Resposta a Incidentes

Em caso de exposição de secrets, siga estes passos:

1. **Rotacionar o secret imediatamente.**
2. **Identificar o commit** que expôs o secret.
3. **Sanitizar o arquivo** e fazer commit.
4. **Limpar o histórico Git** usando `git-filter-repo`.
5. **Auditar logs** para atividade suspeita.
6. **Documentar o incidente** e as ações tomadas.

## 5. Contato

Para reportar uma vulnerabilidade, entre em contato com `olaalessandro9@gmail.com`.
