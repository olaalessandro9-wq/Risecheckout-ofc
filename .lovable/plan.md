
# Plano: Corrigir Limite de Fonte e Overflow de Texto no Checkout Builder

## Diagnóstico dos Problemas

### Problema 1: Limite de Tamanho de Fonte
O input numérico em `TextEditor.tsx` (linha 41-47) usa `min={12}` e `max={48}`, mas estes atributos HTML só funcionam com as setas do browser. O usuário pode digitar manualmente qualquer valor (até 1000+) porque o `onChange` não valida o range.

### Problema 2: Texto Overflow/Sobreposição
O componente `TextBlock.tsx` renderiza o texto sem nenhuma propriedade CSS de contenção:
- Sem `overflow: hidden`
- Sem `word-wrap: break-word`
- Sem `max-width: 100%`
- Resultado: texto longo ultrapassa os limites do container e sobrepõe outros elementos

---

## Análise de Soluções (RISE V3)

### Solução A: Validação Hard + CSS Containment
- **Manutenibilidade:** 10/10 - Lógica clara e centralizada
- **Zero DT:** 10/10 - Resolve ambos os problemas na raiz
- **Arquitetura:** 10/10 - Constantes centralizadas em `field-limits.ts`
- **Escalabilidade:** 10/10 - Aplicável a outros componentes
- **Segurança:** 10/10 - Impede valores inválidos
- **NOTA FINAL: 10.0/10**

### Solução B: Apenas CSS no container pai
- **Manutenibilidade:** 6/10 - Não resolve validação de input
- **Zero DT:** 5/10 - Permite valores inválidos no estado
- **Arquitetura:** 6/10 - Fragmentada
- **Escalabilidade:** 5/10 - Problema pode reaparecer
- **Segurança:** 6/10 - Valores inválidos persistem no banco
- **NOTA FINAL: 5.6/10**

## DECISÃO: Solução A (10.0/10)

---

## Implementação Técnica

### 1. Adicionar Constantes de Limites

**Arquivo:** `src/lib/constants/field-limits.ts`

Adicionar constantes para o componente de texto do builder:

```typescript
export const CHECKOUT_TEXT_LIMITS = {
  /** Tamanho mínimo da fonte em pixels */
  FONT_SIZE_MIN: 12,
  /** Tamanho máximo da fonte em pixels */
  FONT_SIZE_MAX: 48,
} as const;
```

### 2. Corrigir TextEditor com Validação Hard

**Arquivo:** `src/components/checkout/builder/items/Text/TextEditor.tsx`

Mudanças:
1. Importar constantes de limites
2. Clampar o valor do fontSize entre MIN e MAX no `onChange`
3. Garantir que valores digitados manualmente sejam validados

Lógica:

```typescript
import { CHECKOUT_TEXT_LIMITS } from "@/lib/constants/field-limits";

// No onChange do fontSize:
onChange={(e) => {
  const rawValue = parseInt(e.target.value) || CHECKOUT_TEXT_LIMITS.FONT_SIZE_MIN;
  const clampedValue = Math.max(
    CHECKOUT_TEXT_LIMITS.FONT_SIZE_MIN,
    Math.min(CHECKOUT_TEXT_LIMITS.FONT_SIZE_MAX, rawValue)
  );
  handleChange("fontSize", clampedValue);
}}
```

### 3. Corrigir TextBlock com CSS Containment

**Arquivo:** `src/features/checkout-builder/components/TextBlock/TextBlock.tsx`

Mudanças no elemento `<p>`:
1. Adicionar `overflow: hidden` para esconder texto que exceda
2. Adicionar `word-wrap: break-word` para quebrar palavras longas
3. Adicionar `overflow-wrap: break-word` (padrão moderno)
4. Adicionar `max-width: 100%` para garantir contenção
5. Adicionar `white-space: pre-wrap` para manter quebras de linha mas permitir wrap

CSS inline no style do `<p>`:

```typescript
<p
  style={{
    color: textColor,
    fontSize: `${fontSize}px`,
    textAlign,
    // RISE V3: Containment para evitar overflow
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    maxWidth: '100%',
  }}
>
```

E no container `<div>`:

```typescript
<div
  className={`p-4 transition-all ${className}`}
  onClick={onClick}
  style={{
    backgroundColor,
    borderColor,
    borderWidth: `${borderWidth}px`,
    borderStyle: "solid",
    borderRadius: `${borderRadius}px`,
    // RISE V3: Containment do container
    overflow: 'hidden',
    maxWidth: '100%',
  }}
>
```

---

## Alterações por Arquivo

| Arquivo | Ação | Mudança |
|---------|------|---------|
| `src/lib/constants/field-limits.ts` | MODIFICAR | Adicionar `CHECKOUT_TEXT_LIMITS` |
| `src/components/checkout/builder/items/Text/TextEditor.tsx` | MODIFICAR | Import + clamp de fontSize |
| `src/features/checkout-builder/components/TextBlock/TextBlock.tsx` | MODIFICAR | CSS containment no container e no texto |

---

## Comportamento Resultante

| Cenário | Antes | Depois |
|---------|-------|--------|
| Digitar 100 no fontSize | Aceita 100 | Clampa para 48 |
| Digitar 5 no fontSize | Aceita 5 | Clampa para 12 |
| Usar setas para aumentar | Para em 48 | Para em 48 |
| Texto muito longo | Sobrepõe checkout | Quebra dentro do container |
| Palavras longas (ex: "FFFFFF...") | Sai do container | Quebra corretamente |
| Texto com espaços | Pode vazar | Fica contido |

---

## Diagrama Visual do Resultado

```text
ANTES (overflow):
┌─────────────────────────────┐
│ FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF→→→→→→
└─────────────────────────────┘
                              ↓ (sobrepõe checkout)

DEPOIS (containment):
┌─────────────────────────────┐
│ FFFFFFFFFFFFFFFFFFFFFFFFFFF │
│ FFFFFFFFFFFFFFFFFFFFFFFFFFF │
│ FFF                         │
└─────────────────────────────┘
```

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Single Source of Truth | Limites em `field-limits.ts` |
| Zero Dívida Técnica | Validação hard impede valores inválidos |
| Arquitetura Correta | Separação: constantes / editor / view |
| Limite 300 linhas | Todos os arquivos dentro do limite |
| Segurança | Valores clampeados antes de persistir |
