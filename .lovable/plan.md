
# Plano: Redirecionar "/" para "/auth" (Landing Pages Arquivadas)

## Objetivo

Tornar as landing pages (WordPress e React nativas) inacessíveis ao público, redirecionando o acesso à raiz (`/`) diretamente para `/auth`.

## Estado Atual

```text
┌─────────────────────────────────────────────────────────────┐
│                    ARQUIVOS DE LANDING PAGE                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. WordPress (public/landing/)                             │
│     └── index.html + wp-content/ + wp-includes/             │
│     Status: MANTIDO (arquivado)                             │
│                                                              │
│  2. React Nativo (src/components/landing/)                  │
│     └── HeroSection, FeaturesSection, etc.                  │
│     Status: MANTIDO (arquivado)                             │
│                                                              │
│  3. Página Wrapper (src/pages/LandingPage.tsx)              │
│     └── Carrega WordPress via iframe                        │
│     Status: SERÁ MODIFICADO                                 │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    ROTEAMENTO ATUAL                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  React Router (publicRoutes.tsx):                           │
│  "/" → LandingPage.tsx (iframe WordPress)                   │
│                                                              │
│  Vercel (vercel.json):                                      │
│  "/" → /landing/index.html (rewrite direto)                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Novo Comportamento Desejado

```text
┌─────────────────────────────────────────────────────────────┐
│               APÓS IMPLEMENTAÇÃO                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Acesso a risecheckout.com/ (ou preview/)                   │
│                    │                                         │
│                    ▼                                         │
│  ┌────────────────────────────────────────┐                 │
│  │   REDIRECT IMEDIATO → /auth            │                 │
│  └────────────────────────────────────────┘                 │
│                                                              │
│  Landing Pages:                                              │
│  ┌────────────────────────────────────────┐                 │
│  │  public/landing/ → ARQUIVADO           │                 │
│  │  src/components/landing/ → ARQUIVADO   │                 │
│  │  (código preservado, mas inacessível)  │                 │
│  └────────────────────────────────────────┘                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementação

### Arquivo 1: `src/routes/publicRoutes.tsx`

**Mudança:** Substituir a rota `/` de `LandingPage` para um redirect para `/auth`

```tsx
// ANTES (linhas 46-51):
{ 
  path: "/", 
  element: <Suspense fallback={<PageLoader />}><LandingPage /></Suspense> 
},

// DEPOIS:
{ 
  path: "/", 
  element: <Navigate to="/auth" replace /> 
},
```

**Adicionar import:**
```tsx
import { Navigate } from "react-router-dom";
```

**Remover import não utilizado:**
```tsx
// REMOVER:
const LandingPage = lazyWithRetry(() => import("@/pages/LandingPage"));
```

---

### Arquivo 2: `vercel.json`

**Mudança:** Alterar o rewrite da raiz para redirecionar para `/auth`

```json
// ANTES (linhas 4-7):
{
  "source": "/",
  "destination": "/landing/index.html"
}

// DEPOIS:
{
  "source": "/",
  "destination": "/index.html"
}
```

Isso faz com que a Vercel sirva o React SPA, que então executa o redirect para `/auth`.

---

### Arquivo 3: `src/pages/LandingPage.tsx`

**Opção:** Manter como está (código morto mas arquivado) OU adicionar comentário de arquivamento.

Recomendo adicionar um comentário no topo para documentar que está arquivado:

```tsx
/**
 * LandingPage Component - ARQUIVADO
 * 
 * STATUS: INACESSÍVEL - Código preservado para uso futuro
 * DATA: 04 de Fevereiro de 2026
 * 
 * Este componente não está mais roteado. A rota "/" agora
 * redireciona diretamente para "/auth".
 * 
 * Para reativar: restaurar a rota em publicRoutes.tsx
 */
```

---

## Arquivos Afetados

| Arquivo | Alteração | Linhas |
|---------|-----------|--------|
| `src/routes/publicRoutes.tsx` | Trocar rota `/` para `Navigate` | ~5 linhas |
| `vercel.json` | Remover rewrite para landing | ~2 linhas |
| `src/pages/LandingPage.tsx` | Adicionar comentário ARQUIVADO | ~5 linhas |

---

## Arquivos Preservados (Não Deletados)

| Diretório/Arquivo | Conteúdo | Status |
|-------------------|----------|--------|
| `public/landing/` | WordPress HTML + assets | Arquivado |
| `src/components/landing/` | Componentes React nativos | Arquivado |
| `src/pages/LandingPage.tsx` | Wrapper do iframe | Arquivado |

---

## Fluxo Final

```text
┌───────────────────────────────────────────────────────────────┐
│              ACESSO: risecheckout.com/                        │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│  Vercel serve /index.html (React SPA)                         │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│  React Router: "/" → Navigate to="/auth" replace              │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│  Usuário é redirecionado para /auth                           │
│  (Página de login/cadastro)                                   │
└───────────────────────────────────────────────────────────────┘
```

---

## Critérios de Aceite

1. Acessar `risecheckout.com/` redireciona para `/auth`
2. Acessar preview do Lovable `/` redireciona para `/auth`
3. Arquivos de landing page permanecem no repositório (não deletados)
4. Nenhum link interno quebrado
5. Todas as outras rotas funcionam normalmente

---

## RISE V3 Score: 10.0/10

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | Código preservado, fácil reativar no futuro |
| Zero DT | 10/10 | Nenhuma gambiarra, redirect limpo via Navigate |
| Arquitetura | 10/10 | Segue padrão React Router, sem hacks |
| Escalabilidade | 10/10 | Não adiciona complexidade |
| Segurança | 10/10 | Sem exposição de conteúdo não desejado |

---

## Próximos Passos Após Aprovação

1. Implementar as 3 alterações
2. Testar no preview do Lovable
3. Sincronizar com GitHub para deploy na Vercel
4. Verificar `risecheckout.com` após deploy
