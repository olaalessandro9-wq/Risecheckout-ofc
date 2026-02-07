
# Substituir o "R" Generico pela Logo Real em Todo o Projeto

## Diagnostico

Identifiquei **12 instancias** do "R" generico em texto, distribuidas em **6 arquivos**. Cada arquivo tem 2 variantes: uma logo menor (mobile, 32x32) e uma logo maior (desktop, 40x40).

### Mapeamento Completo

| Arquivo | Linhas | Contexto |
|---------|--------|----------|
| `src/modules/navigation/components/Sidebar/SidebarBrand.tsx` | 41-42 | Sidebar do painel (40x40, texto "R") |
| `src/pages/Auth.tsx` | 83-84, 159-160 | Tela de login (mobile 32x32 + desktop 40x40) |
| `src/pages/RecuperarSenha.tsx` | 98-99, 257-258 | Recuperar senha (mobile + desktop) |
| `src/pages/cadastro/components/CadastroLayout.tsx` | 42-43, 58-59 | Cadastro (mobile + desktop) |
| `src/components/auth/reset-password/ResetPasswordLayout.tsx` | 33-34, 49-50 | Reset password (mobile + desktop) |
| `src/modules/members-area/components/BuyerAuthLayout.tsx` | 50-51, 66-67 | Auth do comprador (mobile + desktop) |

## Analise de Solucoes

### Solucao A: Substituir diretamente o texto "R" por `<img>` em cada arquivo

- Manutenibilidade: 3/10 (12 substituicoes manuais, qualquer mudanca futura na logo requer editar 6 arquivos)
- Zero DT: 3/10 (duplicacao massiva de logica de renderizacao)
- Arquitetura: 3/10 (viola DRY completamente)
- Escalabilidade: 3/10 (cada nova pagina de auth precisa copiar o padrao)
- Seguranca: 10/10
- **NOTA FINAL: 3.6/10**

### Solucao B: Criar componente SSOT `RiseLogo` + asset local

Copiar a imagem para `src/assets/logo.jpeg`, criar um componente `RiseLogo` que encapsula toda a logica de renderizacao (tamanhos, background gradient, shadow), e importa-lo nos 6 arquivos. Qualquer mudanca futura na logo requer alterar apenas 1 arquivo.

- Manutenibilidade: 10/10 (Single Source of Truth - mudar logo = 1 arquivo)
- Zero DT: 10/10 (elimina 12 duplicacoes de codigo)
- Arquitetura: 10/10 (componente atomico reutilizavel, SOLID)
- Escalabilidade: 10/10 (qualquer nova pagina importa `RiseLogo`)
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A viola DRY e cria 12 pontos de manutencao. A Solucao B centraliza tudo em um componente atomico.

---

## Plano de Execucao

### Fase 1: Copiar Asset

Copiar `user-uploads://3.jpg.jpeg` para `src/assets/logo.jpeg`.

### Fase 2: Criar Componente `RiseLogo`

**CRIAR** `src/components/brand/RiseLogo.tsx`

Componente atomico com props de tamanho:

```typescript
interface RiseLogoProps {
  size?: "sm" | "md";  // sm = 32px (mobile), md = 40px (desktop/sidebar)
  className?: string;
}
```

- Importa `logo.jpeg` de `@/assets/logo.jpeg`
- Renderiza `<img>` com `object-contain` dentro do container com gradient + shadow
- Tamanhos: `sm` = `w-8 h-8`, `md` = `w-10 h-10`
- Mantam o `rounded-lg`/`rounded-xl` e o gradient background como container

### Fase 3: Atualizar os 6 Arquivos

Em cada arquivo, substituir o bloco:

```tsx
<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[...] to-[...] flex items-center justify-center shadow-lg shadow-[...]">
  <span className="font-bold text-[...]">R</span>
</div>
```

Por:

```tsx
<RiseLogo size="sm" />
```

E o bloco desktop (40x40):

```tsx
<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[...] to-[...] flex items-center justify-center shadow-lg shadow-[...]">
  <span className="font-bold text-[...] text-xl">R</span>
</div>
```

Por:

```tsx
<RiseLogo size="md" />
```

### Fase 4: Sidebar (caso especial)

O `SidebarBrand.tsx` usa `bg-primary` em vez do auth gradient. O `RiseLogo` tera uma variante que funciona em ambos os contextos (auth theme e dashboard theme), mantendo o container com gradient no auth e `bg-primary` no dashboard.

O componente aceitara uma prop `variant`:
- `"auth"` - usa o gradient auth-accent (para paginas de auth)
- `"default"` - usa `bg-primary` (para o sidebar do dashboard)

---

## Arvore de Arquivos

```text
src/assets/
  logo.jpeg                                          -- CRIAR (copiar da imagem enviada)

src/components/brand/
  RiseLogo.tsx                                       -- CRIAR (componente SSOT)

src/modules/navigation/components/Sidebar/
  SidebarBrand.tsx                                   -- EDITAR (usar RiseLogo)

src/pages/
  Auth.tsx                                           -- EDITAR (2 instancias -> RiseLogo)
  RecuperarSenha.tsx                                 -- EDITAR (2 instancias -> RiseLogo)

src/pages/cadastro/components/
  CadastroLayout.tsx                                 -- EDITAR (2 instancias -> RiseLogo)

src/components/auth/reset-password/
  ResetPasswordLayout.tsx                            -- EDITAR (2 instancias -> RiseLogo)

src/modules/members-area/components/
  BuyerAuthLayout.tsx                                -- EDITAR (2 instancias -> RiseLogo)
```

## Resultado

| Local | Antes | Depois |
|-------|-------|--------|
| Sidebar | Quadrado azul com texto "R" | Quadrado com logo real |
| Login (mobile) | Quadrado gradient com "R" | Logo real no container gradient |
| Login (desktop) | Quadrado gradient com "R" | Logo real no container gradient |
| Cadastro (mobile + desktop) | Quadrado gradient com "R" | Logo real no container gradient |
| Recuperar Senha (mobile + desktop) | Quadrado gradient com "R" | Logo real no container gradient |
| Reset Password (mobile + desktop) | Quadrado gradient com "R" | Logo real no container gradient |
| Buyer Auth (mobile + desktop) | Quadrado gradient com "R" | Logo real no container gradient |

Todas as 12 instancias do "R" generico serao substituidas pela logo real, com um unico ponto de manutencao (`RiseLogo.tsx`).
