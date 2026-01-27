

# Plano: Corrigir Limite de Tempo e Overflow de Texto no Timer

## Diagnóstico dos Problemas

### Problema 1: Minutos e Segundos sem Limitador Hard
O `TimerEditor.tsx` usa `min={0}` e `max={59}` nos inputs, mas esses atributos HTML só funcionam com as setas do browser. O usuário pode digitar manualmente valores como 5.9 (que vira `1.4e+40` quando multiplicado) ou qualquer número acima de 59.

**Evidência do Print**: Timer mostrando `1.4e+40:12` - resultado de valor absurdamente alto.

### Problema 2: Texto Overflow/Sobreposição
O componente `CountdownTimer.tsx` renderiza o texto em um `<span>` sem CSS de contenção:
- Sem `overflow: hidden`
- Sem `text-overflow: ellipsis`
- Sem `max-width`
- Resultado: texto longo ultrapassa os limites do timer e sobrepõe outros elementos

---

## Análise de Soluções (RISE V3)

### Solução A: Validação Hard + CSS Containment (Mesmo padrão do TextEditor)
- **Manutenibilidade:** 10/10 - Lógica clara e centralizada
- **Zero DT:** 10/10 - Resolve ambos os problemas na raiz
- **Arquitetura:** 10/10 - Constantes centralizadas em `field-limits.ts`
- **Escalabilidade:** 10/10 - Aplicável a outros componentes
- **Segurança:** 10/10 - Impede valores inválidos
- **NOTA FINAL: 10.0/10**

### Solução B: Apenas truncate no texto
- **Manutenibilidade:** 5/10 - Não resolve validação de input
- **Zero DT:** 4/10 - Permite valores inválidos no estado
- **Arquitetura:** 5/10 - Fragmentada
- **Escalabilidade:** 4/10 - Problema pode reaparecer
- **Segurança:** 5/10 - Valores inválidos persistem
- **NOTA FINAL: 4.6/10**

## DECISÃO: Solução A (10.0/10)

---

## Implementação Técnica

### 1. Adicionar Constantes de Limites do Timer

**Arquivo:** `src/lib/constants/field-limits.ts`

Adicionar constantes para o componente de timer:

```typescript
export const TIMER_LIMITS = {
  /** Minutos: 0-59 */
  MINUTES_MIN: 0,
  MINUTES_MAX: 59,
  /** Segundos: 0-59 */
  SECONDS_MIN: 0,
  SECONDS_MAX: 59,
  /** Limite de caracteres para textos do timer */
  TEXT_MAX_LENGTH: 50,
} as const;
```

### 2. Corrigir TimerEditor com Validação Hard

**Arquivo:** `src/components/checkout/builder/items/Timer/TimerEditor.tsx`

Mudanças:
1. Importar constantes de limites
2. Clampar o valor de `minutes` entre 0 e 59 no `onChange`
3. Clampar o valor de `seconds` entre 0 e 59 no `onChange`
4. Adicionar `maxLength` nos campos de texto (activeText, finishedText)

Lógica para minutos:

```typescript
import { TIMER_LIMITS } from "@/lib/constants/field-limits";

// No onChange dos minutos:
onChange={(e) => {
  const rawValue = parseInt(e.target.value) || TIMER_LIMITS.MINUTES_MIN;
  const clampedValue = Math.max(
    TIMER_LIMITS.MINUTES_MIN,
    Math.min(TIMER_LIMITS.MINUTES_MAX, rawValue)
  );
  handleChange("minutes", clampedValue);
}}

// No onChange dos segundos:
onChange={(e) => {
  const rawValue = parseInt(e.target.value) || TIMER_LIMITS.SECONDS_MIN;
  const clampedValue = Math.max(
    TIMER_LIMITS.SECONDS_MIN,
    Math.min(TIMER_LIMITS.SECONDS_MAX, rawValue)
  );
  handleChange("seconds", clampedValue);
}}

// Nos inputs de texto:
<Input
  value={content.activeText || "..."}
  onChange={(e) => handleChange("activeText", e.target.value)}
  maxLength={TIMER_LIMITS.TEXT_MAX_LENGTH}
/>
```

### 3. Corrigir CountdownTimer com CSS Containment

**Arquivo:** `src/features/checkout-builder/components/CountdownTimer/CountdownTimer.tsx`

Mudanças no container `<div>`:
1. Adicionar `overflow: 'hidden'` para conter elementos internos

Mudanças no `<span>` do texto:
1. Adicionar `overflow: hidden` 
2. Adicionar `text-overflow: ellipsis`
3. Adicionar `white-space: nowrap`
4. Adicionar `max-width` para limitar largura

Código:

```typescript
// No container <div>:
style={{ 
  backgroundColor, 
  color: textColor,
  minHeight: '72px',
  overflow: 'hidden',  // Contenção
  maxWidth: '100%',
}}

// No <span> do texto:
<span 
  className="text-base lg:text-lg font-medium"
  style={{
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '40%',  // Limita o texto a 40% do container
    display: 'inline-block',
  }}
>
  {isFinished ? finishedText : activeText}
</span>
```

---

## Alterações por Arquivo

| Arquivo | Ação | Mudança |
|---------|------|---------|
| `src/lib/constants/field-limits.ts` | MODIFICAR | Adicionar `TIMER_LIMITS` |
| `src/components/checkout/builder/items/Timer/TimerEditor.tsx` | MODIFICAR | Import + clamp de minutos/segundos + maxLength nos textos |
| `src/features/checkout-builder/components/CountdownTimer/CountdownTimer.tsx` | MODIFICAR | CSS containment no container e truncate no texto |

---

## Comportamento Resultante

| Cenário | Antes | Depois |
|---------|-------|--------|
| Digitar 100 nos minutos | Aceita 100 → `1.4e+40` | Clampa para 59 |
| Digitar 60 nos segundos | Aceita 60 | Clampa para 59 |
| Digitar 0 nos minutos | Aceita 0 | Aceita 0 ✓ |
| Usar setas para aumentar | Para em 59 | Para em 59 |
| Texto muito longo | Sobrepõe checkout | Trunca com "..." |
| Texto normal | Exibe completo | Exibe completo |

---

## Diagrama Visual do Resultado

```text
ANTES (overflow):
┌────────────────────────────────────────────────────────────────────┐
│ 59:59 🔔 TextoMuitoLongoQueUltrapassaOContainerEVaiParaForaaaaa→→→→
└────────────────────────────────────────────────────────────────────┘
                                                                    ↓ (sobrepõe)

DEPOIS (containment + truncate):
┌────────────────────────────────────────────────────────────┐
│ 59:59 🔔 TextoMuitoLongoQueUl...                           │
└────────────────────────────────────────────────────────────┘
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

