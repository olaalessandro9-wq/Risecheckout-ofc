
# Plano: Tema da Área de Membros Seguir Configuração do Builder

## RISE Protocol V3 - Análise de Soluções

### Solução A: Aplicar classe `.dark` dinâmica no ThemeProvider + backgrounds condicionais
- Manutenibilidade: 10/10 (centralizado no ThemeProvider)
- Zero DT: 10/10 (usa o sistema de temas existente do Tailwind)
- Arquitetura: 10/10 (respeita o SSOT do builder)
- Escalabilidade: 10/10 (qualquer novo componente herda automaticamente)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 30 minutos

### DECISÃO: Solução A (10.0/10)

---

## Diagnóstico Root Cause

### Situação Atual (Incorreta)

| Componente | Comportamento |
|------------|---------------|
| `MembersAreaThemeProvider` | Só injeta CSS vars para cor primária |
| `CourseHome.tsx` | Usa `bg-background` (tema do sistema) |
| `LessonViewer.tsx` | Usa `bg-background` (tema do sistema) |
| `BuyerSidebar` | ✅ Usa `settings.theme === 'dark'` corretamente |
| `BuyerMobileNav` | ✅ Usa `settings.theme === 'dark'` corretamente |

**Problema:** O fundo principal da área de membros segue o tema do sistema/navegador, não o tema configurado pelo produtor no builder.

### Comportamento Desejado

| Componente | Comportamento Esperado |
|------------|------------------------|
| Container principal | Usa classe `.dark` se `settings.theme === 'dark'` |
| Fundo da página | `bg-background` responde à classe `.dark` do container |
| Cliente | **Não pode** alterar o tema (apenas visualiza) |

---

## Alterações Necessárias

### 1. MembersAreaThemeProvider - Aplicar classe `.dark` dinâmica

**Arquivo:** `src/modules/members-area/pages/buyer/components/MembersAreaThemeProvider.tsx`

**Alterações:**
- Adicionar `settings.theme` às props recebidas
- Aplicar classe `dark` ao container se tema for dark
- Manter a classe `contents` para não afetar layout

**Código atualizado:**
```typescript
export function MembersAreaThemeProvider({ 
  settings, 
  children 
}: MembersAreaThemeProviderProps) {
  const primaryColor = settings.primary_color || '#6366f1';
  const primaryHSL = hexToHSL(primaryColor);
  const foregroundHSL = isLightColor(primaryColor) ? '240 10% 3.9%' : '0 0% 98%';
  const isDarkTheme = settings.theme === 'dark';

  const cssVars = {
    '--members-primary': primaryHSL,
    '--members-primary-hex': primaryColor,
    '--members-primary-foreground': foregroundHSL,
  } as React.CSSProperties;

  return (
    <div 
      style={cssVars} 
      className={cn(
        "members-area-root contents",
        isDarkTheme && "dark"
      )}
    >
      {children}
    </div>
  );
}
```

**Problema com `contents`:** A classe `contents` do Tailwind faz o elemento agir como se não existisse no DOM para layout, mas isso pode interferir com a propagação da classe `.dark`.

### 2. Solução Robusta - Wrapper com background próprio

Para garantir que o tema seja isolado, o `MembersAreaThemeProvider` deve:
1. **Não usar `contents`** - ser um container real
2. Aplicar `min-h-screen` e `bg-background` diretamente
3. A classe `.dark` então afeta todos os descendentes

**Código final:**
```typescript
export function MembersAreaThemeProvider({ 
  settings, 
  children 
}: MembersAreaThemeProviderProps) {
  const primaryColor = settings.primary_color || '#6366f1';
  const primaryHSL = hexToHSL(primaryColor);
  const foregroundHSL = isLightColor(primaryColor) ? '240 10% 3.9%' : '0 0% 98%';
  const isDarkTheme = settings.theme === 'dark';

  const cssVars = {
    '--members-primary': primaryHSL,
    '--members-primary-hex': primaryColor,
    '--members-primary-foreground': foregroundHSL,
  } as React.CSSProperties;

  return (
    <div 
      style={cssVars} 
      className={cn(
        "members-area-root min-h-screen bg-background",
        isDarkTheme && "dark"
      )}
    >
      {children}
    </div>
  );
}
```

### 3. CourseHome.tsx - Ajustar container principal

**Arquivo:** `src/modules/members-area/pages/buyer/CourseHome.tsx`

**Alteração:** Remover `min-h-screen bg-background` do container interno, pois o ThemeProvider já provê isso.

**Antes (linha 154):**
```typescript
<div className="min-h-screen bg-background flex">
```

**Depois:**
```typescript
<div className="flex min-h-screen">
```

### 4. LessonViewer.tsx - Ajustar container principal

**Arquivo:** `src/modules/members-area/pages/buyer/LessonViewer.tsx`

**Problema:** `LessonViewer` não usa `MembersAreaThemeProvider`.

**Solução:** Adicionar o provider e remover duplicação de background.

**Alteração:** Envolver retorno com `MembersAreaThemeProvider` e ajustar classes.

### 5. Páginas de Setup/Auth - Considerar tema

As páginas de setup (`SetupAccess`, `BuyerAuth`, etc.) também usam `bg-background` mas não têm acesso ao `settings.theme` pois o produto ainda não foi carregado.

**Decisão:** Manter comportamento atual (seguir tema do sistema) para páginas de login/setup, pois:
- O cliente ainda não tem acesso ao produto
- O tema do produtor é específico do curso, não da área de login geral

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `MembersAreaThemeProvider.tsx` | Aplicar classe `dark` baseada em `settings.theme` |
| `CourseHome.tsx` | Ajustar container para herdar background do provider |
| `LessonViewer.tsx` | Adicionar `MembersAreaThemeProvider` e ajustar container |

---

## Fluxo de Dados

```text
┌─────────────────────────────────────────────────────────┐
│                   Builder (Produtor)                     │
│                                                          │
│   [Global] → Aparência → Tema: "Escuro (Netflix)" ✓     │
│                                                          │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              products.members_area_settings              │
│                                                          │
│   { theme: "dark", primary_color: "#...", ... }          │
│                                                          │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│           MembersAreaThemeProvider                       │
│                                                          │
│   <div className={cn("...", settings.theme === "dark"   │
│        && "dark")} />                                    │
│                                                          │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Tailwind Dark Mode Classes                  │
│                                                          │
│   bg-background → dark:bg-zinc-950                       │
│   text-foreground → dark:text-white                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Validação Pós-Implementação

| Verificação | Resultado Esperado |
|-------------|-------------------|
| Builder com tema "Escuro" | Área de membros com fundo escuro |
| Builder com tema "Claro" | Área de membros com fundo claro |
| Cliente não pode trocar tema | Sem toggle de tema visível |
| Sidebar e MobileNav | Continuam funcionando corretamente |
| Cores primárias | Aplicadas via CSS variables |
| LessonViewer | Herda tema do builder |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Root Cause Only | Corrige propagação do tema na fonte |
| Zero Dívida Técnica | Usa sistema existente do Tailwind |
| Single Source of Truth | `settings.theme` é respeitado |
| Segurança | Cliente não pode alterar configuração |

**NOTA FINAL: 10.0/10** - Correção arquitetural seguindo RISE Protocol V3.
