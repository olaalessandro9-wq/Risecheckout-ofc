
# Diagnóstico: Bug de "Piscadas" nas Páginas de Autenticação (/auth → /cadastro)

## 1. Problema Identificado

O usuário reporta duas situações de "piscadas" visuais indesejadas:

1. **Piscada 1:** Ao navegar de `/auth` para `/cadastro` (clique em "Cadastre-se"), a parte esquerda carrega e depois "pisca"
2. **Piscada 2:** Ao clicar em qualquer opção do quiz (produtor/afiliado/comprador), a página toda recarrega com 2 piscadas

---

## 2. Causas Raiz Identificadas

### CAUSA 1: Flash entre `PageLoader` e `authLoading` (CRÍTICA)

O fluxo atual cria **DOIS estágios de loading** consecutivos:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                      FLUXO ATUAL (PROBLEMÁTICO)                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Navegação /auth → /cadastro                                             │
│                                                                          │
│  [1] Suspense mostra PageLoader (spinner genérico, fundo CLARO)          │
│              ↓                                                           │
│  [2] Chunk carrega, componente Cadastro monta                            │
│              ↓                                                           │
│  [3] useUnifiedAuth() com authLoading=true                               │
│      → AuthThemeProvider + Loader2 (spinner azul, fundo ESCURO)          │
│              ↓                                                           │
│  [4] authLoading=false → UI real renderiza                               │
│                                                                          │
│  RESULTADO: 2 TELAS DIFERENTES em sequência rápida = PISCADA             │
│  - PageLoader: fundo claro, spinner genérico                             │
│  - AuthThemeProvider + Loader2: fundo escuro, spinner azul               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Evidência no código:**

```typescript
// publicRoutes.tsx - PageLoader (fundo CLARO)
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

// Cadastro.tsx - authLoading state (fundo ESCURO)
if (authLoading) {
  return (
    <AuthThemeProvider>  // fundo escuro: bg-[hsl(var(--auth-bg))]
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[hsl(var(--auth-accent))] animate-spin" />
      </div>
    </AuthThemeProvider>
  );
}
```

---

### CAUSA 2: `refetchOnMount: 'always'` no `useUnifiedAuth` (CRÍTICA)

O hook de autenticação está configurado para **SEMPRE revalidar** a cada mount:

```typescript
// useUnifiedAuth.ts (linhas 198-206)
staleTime: 0,                    // Dados sempre "stale"
refetchOnMount: 'always',        // Dispara fetch MESMO com cache
```

Isso causa:
- Toda navegação entre páginas que usam `useUnifiedAuth` dispara nova request
- Durante o fetch, `isLoading` (ou `authLoading`) retorna `true`
- O componente mostra o spinner de loading mesmo tendo dados em cache
- **O problema:** Para páginas públicas como `/cadastro`, NÃO precisamos validar sessão a cada mount

---

### CAUSA 3: AnimatePresence + Re-renders do Quiz (MÉDIA)

Quando o usuário clica em uma opção do quiz:

```typescript
// Cadastro.tsx (linha 318)
<AnimatePresence mode="wait">
  {view === "choose-profile" && <ChooseProfileView key="choose" />}
  {view === "already-has-account" && <AlreadyHasAccountView key="already" />}
  {view === "producer-form" && <ProducerRegistrationForm key="form" ... />}
</AnimatePresence>
```

O `AnimatePresence mode="wait"` espera a animação de saída completar antes de montar o novo componente. Se durante esse tempo o `useUnifiedAuth` dispara um refetch (por window focus ou outro trigger), causa um re-render do `PageLayout` que contém o `AnimatePresence`, gerando a "piscada dupla".

---

## 3. Análise de Soluções

### Solução A: AuthPageLoader Unificado + Otimização de Cache

- Manutenibilidade: 10/10 - Centraliza loading em um único componente
- Zero DT: 10/10 - Não cria dívida técnica
- Arquitetura: 10/10 - SSOT para loading de páginas de auth
- Escalabilidade: 10/10 - Funciona para todas as páginas de auth
- Segurança: 10/10 - Não afeta segurança
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 2 horas

### Solução B: Skeleton Estrutural nas Páginas Auth

- Manutenibilidade: 9/10 - Requer skeleton específico para cada página
- Zero DT: 9/10 - Pode precisar atualização se layout mudar
- Arquitetura: 9/10 - Mais código por página
- Escalabilidade: 8/10 - Cada nova página precisa de skeleton
- Segurança: 10/10 - Não afeta segurança
- **NOTA FINAL: 9.0/10**
- Tempo estimado: 4 horas

### Solução C: Preloading de Chunks + Prefetch

- Manutenibilidade: 8/10 - Complexidade adicional de prefetch
- Zero DT: 9/10 - Bom, mas requer Link customizado
- Arquitetura: 9/10 - Padrão moderno mas mais complexo
- Escalabilidade: 9/10 - Funciona bem
- Segurança: 10/10 - Não afeta segurança
- **NOTA FINAL: 9.0/10**
- Tempo estimado: 3 horas

### DECISÃO: Solução A (Nota 10.0)

As soluções B e C são inferiores porque:
- B requer duplicação de código (skeleton para cada página)
- C adiciona complexidade de prefetch que pode não eliminar totalmente o flash

---

## 4. Implementação Proposta

### 4.1 Criar `AuthPageLoader` com tema escuro

Criar um loader específico para páginas de auth que já usa o tema escuro:

```typescript
// src/components/auth/AuthPageLoader.tsx
export function AuthPageLoader() {
  return (
    <div 
      className="dark min-h-screen w-full flex items-center justify-center 
                 bg-[hsl(var(--auth-bg))] text-[hsl(var(--auth-text-secondary))]"
      data-theme="auth"
    >
      <Loader2 className="w-8 h-8 text-[hsl(var(--auth-accent))] animate-spin" />
    </div>
  );
}
```

### 4.2 Atualizar `publicRoutes.tsx` para usar `AuthPageLoader`

```typescript
// Rotas de auth usam AuthPageLoader (tema escuro)
{ 
  path: "/auth", 
  element: <Suspense fallback={<AuthPageLoader />}><Auth /></Suspense> 
},
{ 
  path: "/cadastro", 
  element: <Suspense fallback={<AuthPageLoader />}><Cadastro /></Suspense> 
},
{ 
  path: "/recuperar-senha", 
  element: <Suspense fallback={<AuthPageLoader />}><RecuperarSenha /></Suspense> 
},
{ 
  path: "/redefinir-senha", 
  element: <Suspense fallback={<AuthPageLoader />}><RedefinirSenha /></Suspense> 
},
```

### 4.3 Criar hook `useUnifiedAuthForPublicPages`

Um wrapper que NÃO força revalidação em páginas públicas:

```typescript
// src/hooks/useUnifiedAuthForPublicPages.ts
export function useUnifiedAuthForPublicPages() {
  const queryClient = useQueryClient();
  
  // Apenas lê do cache, sem forçar refetch
  const cachedData = queryClient.getQueryData(UNIFIED_AUTH_QUERY_KEY);
  
  // Se não há dados em cache, considera como não autenticado
  // Isso evita o loading spinner em páginas públicas
  return {
    isAuthenticated: cachedData?.valid ?? false,
    isLoading: false, // NUNCA mostra loading em páginas públicas
    user: cachedData?.user ?? null,
    activeRole: cachedData?.activeRole ?? null,
  };
}
```

### 4.4 Atualizar `Cadastro.tsx` e `Auth.tsx`

Remover o estado de loading intermediário:

```typescript
// Antes (problemático)
if (authLoading) {
  return <AuthThemeProvider><Loader2 /></AuthThemeProvider>;
}

// Depois (sem flash)
// Removido - o AuthPageLoader do Suspense já cuida disso
// O componente renderiza imediatamente, e o useEffect faz redirect se autenticado
```

---

## 5. Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/auth/AuthPageLoader.tsx` | CRIAR - Loader com tema escuro |
| `src/routes/publicRoutes.tsx` | EDITAR - Usar AuthPageLoader para rotas de auth |
| `src/pages/Cadastro.tsx` | EDITAR - Remover if(authLoading) return spinner |
| `src/pages/Auth.tsx` | EDITAR - Remover if(authLoading) return spinner |
| `src/hooks/useUnifiedAuthForPublicPages.ts` | CRIAR - Hook otimizado para páginas públicas |

---

## 6. Resultado Esperado

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                      FLUXO CORRIGIDO                                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Navegação /auth → /cadastro                                             │
│                                                                          │
│  [1] Suspense mostra AuthPageLoader (spinner azul, fundo ESCURO)         │
│              ↓                                                           │
│  [2] Chunk carrega, componente Cadastro monta                            │
│              ↓                                                           │
│  [3] UI real renderiza IMEDIATAMENTE (sem loading intermediário)         │
│              ↓                                                           │
│  [4] useEffect verifica auth em background e redireciona se necessário   │
│                                                                          │
│  RESULTADO: Transição SUAVE de AuthPageLoader → UI real                  │
│  - Mesmo fundo escuro em ambos                                           │
│  - Sem flash de cores diferentes                                         │
│  - Sem múltiplos spinners                                                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Conformidade RISE V3

| Critério | Peso | Nota | Justificativa |
|----------|------|------|---------------|
| Manutenibilidade Infinita | 30% | 10/10 | Componente único, fácil de manter |
| Zero Dívida Técnica | 25% | 10/10 | Solução definitiva, não "por ora" |
| Arquitetura Correta | 20% | 10/10 | SSOT para loading de auth pages |
| Escalabilidade | 15% | 10/10 | Funciona para qualquer nova página de auth |
| Segurança | 10% | 10/10 | Mantém verificação de auth via useEffect |
| **NOTA FINAL** | 100% | **10.0/10** | |
