
# Correção Definitiva: CSS do Painel do Aluno (RISE V3)

## Diagnóstico Confirmado (Causa Raiz)

### Problema 1: Token de input usado incorretamente
```tsx
// BuyerAuth.tsx linhas 154, 179
bg-[hsl(var(--auth-input-bg))]  // ❌ ERRADO - aplica branco 100%
```

O token `--auth-input-bg` foi documentado como "Para uso com opacity (white/5)" mas está sendo usado SEM opacidade, resultando em fundo branco sólido com texto branco = **campos invisíveis**.

### Problema 2: Tokens CSS ausentes
Tokens usados no código mas não definidos no `index.css`:
- `--auth-accent-hover` (link hover)
- `--auth-error` (mensagens de erro)
- `--auth-success` (ícones de sucesso)

---

## Solução (Nota 10/10)

### Etapa 1: Completar tokens faltantes no CSS
**Arquivo:** `src/index.css` (após linha 287)

Adicionar:
```css
/* Auth Semantic Colors (RISE V3 - SSOT) */
--auth-accent-hover: 217 91% 70%;      /* blue-400 */
--auth-error: 0 84% 60%;               /* red-500 */
--auth-success: 142 76% 36%;           /* green-600 */
```

### Etapa 2: Corrigir uso do token nos inputs Buyer
**Arquivos:**
- `src/modules/members-area/pages/buyer/BuyerAuth.tsx`
- `src/modules/members-area/pages/buyer/BuyerRecuperarSenha.tsx`

Substituir:
```tsx
// ❌ ANTES (branco sólido)
bg-[hsl(var(--auth-input-bg))]

// ✅ DEPOIS (branco com 5% opacidade = efeito glass)
bg-[hsl(var(--auth-input-bg)/0.05)]
```

Também ajustar bordas:
```tsx
// ❌ ANTES
border-[hsl(var(--auth-border))]

// ✅ DEPOIS  
border-[hsl(var(--auth-input-border)/0.1)]
```

### Etapa 3: Criar componentes Auth UI primitives
**Novos arquivos:**

1. `src/components/auth/ui/AuthInput.tsx`
   - Encapsula Input com estilos corretos
   - Garante que opacidade seja aplicada consistentemente
   - Suporta ícone esquerdo/direito

2. `src/components/auth/ui/AuthField.tsx`
   - Combina Label + AuthInput + mensagem de erro
   - Padroniza espaçamento

3. `src/components/auth/ui/index.ts`
   - Exporta todos os primitives

### Etapa 4: Refatorar páginas Buyer para usar primitives
**Arquivos a alterar:**
- `BuyerAuth.tsx` - Substituir todos os `<Input>` por `<AuthInput>`
- `BuyerRecuperarSenha.tsx` - Idem
- Verificar `BuyerCadastro.tsx` se necessário

---

## Arquivos Impactados

### Criar
| Arquivo | Propósito |
|---------|-----------|
| `src/components/auth/ui/AuthInput.tsx` | Input padronizado auth |
| `src/components/auth/ui/AuthField.tsx` | Field completo (label+input+error) |
| `src/components/auth/ui/index.ts` | Barrel export |

### Alterar
| Arquivo | Mudança |
|---------|---------|
| `src/index.css` | Adicionar 3 tokens faltantes |
| `BuyerAuth.tsx` | Usar `AuthInput` + corrigir opacidades |
| `BuyerRecuperarSenha.tsx` | Usar `AuthInput` + corrigir opacidades |

---

## Resultado Visual Esperado

- **Inputs:** Fundo escuro semi-transparente (glass effect), texto branco legível
- **Bordas:** Sutis mas visíveis (white/10)
- **Focus:** Ring azul com opacidade
- **Placeholders:** Cinza médio legível
- **Erros:** Texto vermelho visível
- **Sucesso:** Ícone verde visível

---

## Seção Técnica

### Por que isso resolve definitivamente

1. **Tokens completos no CSS** = Zero variáveis indefinidas no runtime
2. **Primitives encapsulados** = Impossível "esquecer" a opacidade ao usar Input
3. **SSOT de estilos** = Qualquer mudança futura acontece em UM lugar
4. **Padrão Producer ↔ Buyer unificado** = Mesma qualidade visual

### Classes finais do AuthInput

```tsx
className={cn(
  "bg-[hsl(var(--auth-input-bg)/0.05)]",
  "border-[hsl(var(--auth-input-border)/0.1)]", 
  "text-[hsl(var(--auth-text-primary))]",
  "placeholder:text-[hsl(var(--auth-input-placeholder))]",
  "focus:border-[hsl(var(--auth-accent))]",
  "focus:ring-[hsl(var(--auth-accent)/0.2)]",
  "focus-visible:ring-[hsl(var(--auth-accent)/0.2)]",
  // ... props customizados
)}
```

Esta solução segue o RISE Protocol V3: corrige a causa raiz (tokens + opacidade), cria abstração que impede recorrência (primitives), e mantém consistência arquitetural.
