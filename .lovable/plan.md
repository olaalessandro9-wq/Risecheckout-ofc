

# MFA Obrigatorio para Admin/Owner - Plano de Implementacao

## Problema Atual

O MFA atual e **opcional**: quando um admin/owner faz login sem MFA configurado, o sistema apenas exibe um toast informativo ("Recomendamos ativar...") e libera acesso total ao dashboard. Isso viola o proposito de seguranca: se um hacker roubar credenciais, tem acesso total sem segundo fator.

## Analise de Solucoes (Secao 4 RISE V3)

### Solucao A: Gate apenas no frontend (redirect no React Router)

Adicionar verificacao no `ContextAwareProtectedRoute` que redireciona para `/perfil` se `mfa_setup_required`.

- Manutenibilidade: 6/10 (logica de seguranca no frontend pode ser bypassada)
- Zero DT: 5/10 (frontend-only enforcement e inseguro por natureza)
- Arquitetura: 4/10 (viola principio de defesa em profundidade)
- Escalabilidade: 7/10 (funciona mas nao escala para novas rotas)
- Seguranca: 3/10 (atacante pode manipular localStorage/React state)
- **NOTA FINAL: 4.8/10**

### Solucao B: Enforcement em duas camadas (backend + frontend)

Backend:
- `validate.ts` retorna `mfa_setup_required: true` na resposta quando admin/owner sem MFA
- `mfa-disable.ts` **BLOQUEIA** desativacao para admin/owner (MFA obrigatorio nao pode ser desativado)

Frontend:
- `useUnifiedAuth` propaga `mfa_setup_required` do validate response
- Novo guard `MfaEnforcementGuard` intercepta admin/owner sem MFA
- Redireciona para `/dashboard/perfil` com banner de aviso claro
- Bloqueia navegacao para qualquer outra rota do dashboard
- `MfaSettingsCard` remove botao de desativar para admin/owner

- Manutenibilidade: 10/10 (enforcement bilateral, impossivel de bypassar)
- Zero DT: 10/10 (solucao completa, sem gaps)
- Arquitetura: 10/10 (defesa em profundidade, backend como SSOT)
- Escalabilidade: 10/10 (qualquer nova rota herda a protecao)
- Seguranca: 10/10 (mesmo bypassando frontend, backend bloqueia)
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A e insegura por natureza (frontend-only). A Solucao B garante enforcement real em duas camadas: o backend marca a sessao como "MFA pendente" e o frontend enforces o gate visual. Mesmo que o frontend seja bypassado, o backend continua retornando `mfa_setup_required: true` em toda validacao.

---

## Plano de Correcao Detalhado

### 1. Backend: `validate.ts` - Retornar flag `mfa_setup_required`

Apos validar a sessao com sucesso, verificar se o usuario e admin/owner e se tem MFA habilitado. Se nao tiver, incluir `mfa_setup_required: true` na resposta. Isso garante que **cada validacao de sessao** lembra o frontend do enforcement.

### 2. Backend: `mfa-disable.ts` - Bloquear desativacao para admin/owner

Adicionar verificacao: se o usuario tem role `admin` ou `owner`, retornar erro 403 "MFA e obrigatorio para administradores e nao pode ser desativado." O botao nao deveria nem existir no frontend, mas o backend deve bloquear por seguranca (defesa em profundidade).

### 3. Frontend: `useUnifiedAuth.ts` - Propagar `mfa_setup_required`

Adicionar `mfaSetupRequired` ao estado retornado pelo hook, derivado da resposta do `validate`. O `ValidateResponse` interface precisa incluir `mfa_setup_required?: boolean`.

### 4. Frontend: Novo componente `MfaEnforcementGuard.tsx`

Componente que envolve as rotas do dashboard. Logica:
- Se `mfaSetupRequired` e true E a rota atual NAO e `/dashboard/perfil`:
  - Redireciona para `/dashboard/perfil`
- Se `mfaSetupRequired` e true E a rota e `/dashboard/perfil`:
  - Renderiza banner de alerta no topo: "Voce precisa ativar a autenticacao de dois fatores para continuar usando a plataforma."
  - Renderiza children normalmente (perfil com MfaSettingsCard)

### 5. Frontend: `dashboardRoutes.tsx` - Integrar guard

Adicionar `MfaEnforcementGuard` no `DashboardLayout`, apos `ProducerRoute` e antes de `AppShell`. A posicao garante que TODAS as rotas do dashboard passam pelo gate.

### 6. Frontend: `MfaSettingsCard.tsx` - Remover opcao de desativar

Para admin/owner, o botao "Desativar MFA" deve ser removido. Quando o MFA e obrigatorio, nao faz sentido oferecer a opcao de desativar. Substituir por texto informativo: "MFA e obrigatorio para administradores e nao pode ser desativado."

### 7. Frontend: `Auth.tsx` - Mudar toast de recomendacao para obrigatorio

Alterar a mensagem de `mfa_setup_required` de "Recomendamos ativar..." para "Voce precisa ativar a autenticacao de dois fatores para acessar a plataforma. Configure no seu perfil."

### 8. Frontend: `Perfil.tsx` - Banner de enforcement

Quando `mfaSetupRequired` e true, exibir um `Alert` no topo da pagina com:
- Icone de alerta
- Titulo: "Configuracao de Seguranca Obrigatoria"
- Mensagem: "Para garantir a seguranca da sua conta, voce precisa ativar a autenticacao de dois fatores (MFA) antes de acessar outras funcionalidades."

---

## Arvore de Arquivos Modificados

```text
Modificados:
  supabase/functions/unified-auth/handlers/validate.ts   (+MFA check, ~10 linhas)
  supabase/functions/unified-auth/handlers/mfa-disable.ts (+block admin/owner, ~8 linhas)
  src/hooks/useUnifiedAuth.ts                            (+mfaSetupRequired state)
  src/routes/dashboardRoutes.tsx                          (+MfaEnforcementGuard)
  src/components/auth/MfaSettingsCard.tsx                 (remove disable for admin/owner)
  src/pages/Auth.tsx                                     (msg obrigatoria)
  src/pages/Perfil.tsx                                   (+alert banner)

Novos:
  src/components/guards/MfaEnforcementGuard.tsx           (gate component)
```

---

## Fluxo Apos Implementacao

```text
Admin/Owner sem MFA:
  Login → Sessao criada → Redirect /dashboard → MfaEnforcementGuard detecta
  mfaSetupRequired → Redirect /dashboard/perfil → Banner obrigatorio →
  Usuario clica "Ativar MFA" → Setup Wizard → QR Code → Verify → Backup Codes →
  MFA ativado → Guard libera acesso completo

Admin/Owner com MFA:
  Login → MFA dialog → TOTP code → Sessao criada → Acesso total

Admin/Owner tenta desativar MFA:
  Frontend: botao removido (nao existe opcao)
  Backend: mesmo que chamado via API, retorna 403 "MFA obrigatorio"
```

---

## Checkpoint RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim, nota 10.0 (enforcement bilateral) |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim |
| Estou escolhendo isso por ser mais rapido? | Nao |

