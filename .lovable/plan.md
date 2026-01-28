
# Plano: Implementar Formato Horizontal 16:9 (Padrao de Mercado)

## RISE Protocol V3 - Secao 4: LEI SUPREMA

---

## Analise de Solucoes

### Solucao A: Conversao Completa para 16:9 com Ajuste de Larguras
- Manutenibilidade: 10/10 (SSOT centralizado em cardSizes.ts)
- Zero DT: 10/10 (formato unico consistente)
- Arquitetura: 10/10 (paridade Builder = Area Real)
- Escalabilidade: 10/10 (facil adicionar novos tamanhos)
- Seguranca: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 15 minutos

### DECISAO: Solucao A (10.0/10)

---

## Comparativo de Formatos

| Aspecto | 2:3 (Atual - Paramount+) | 16:9 (Novo - Netflix/Kiwify) |
|---------|-------------------------|------------------------------|
| Orientacao | Vertical (poster) | Horizontal (thumbnail) |
| Proporcao | Altura > Largura | Largura > Altura |
| Uso | Filmes, series | Cursos, videos |
| Bordas | rounded-xl (12px) | rounded-lg (8px) |

---

## Novas Dimensoes para 16:9

Para manter proporcoes corretas no formato horizontal:

| Tamanho | Desktop (Antes 2:3) | Desktop (Depois 16:9) | Mobile (Depois 16:9) |
|---------|--------------------|-----------------------|----------------------|
| Small | w-[140px] h-[210px] | w-[200px] h-[112px] | w-[160px] h-[90px] |
| Medium | w-[180px] h-[270px] | w-[260px] h-[146px] | w-[200px] h-[112px] |
| Large | w-[220px] h-[330px] | w-[320px] h-[180px] | w-[240px] h-[135px] |

---

## Arquivos a Alterar

### 1. cardSizes.ts
Atualizar larguras para formato horizontal mais largo:

```typescript
export const CARD_SIZE_MAP = {
  small: {
    desktop: 'w-[200px]',  // Antes: 140px
    mobile: 'w-[160px]',   // Antes: 100px
  },
  medium: {
    desktop: 'w-[260px]',  // Antes: 180px
    mobile: 'w-[200px]',   // Antes: 130px
  },
  large: {
    desktop: 'w-[320px]',  // Antes: 220px
    mobile: 'w-[240px]',   // Antes: 160px
  },
} as const;
```

### 2. NetflixModuleCard.tsx (Area de Membros Real)
Mudar aspect-ratio e bordas:

| Linha | Antes | Depois |
|-------|-------|--------|
| 60 | `aspect-[2/3] rounded-xl` | `aspect-video rounded-lg` |
| 73 | `h-16 w-16` (icone Film) | `h-12 w-12` |
| 83 | `h-14 w-14` (icone Play) | `h-10 w-10` |
| 87-88 | Badge `top-3 right-3` | Badge `top-2 right-2` |

### 3. ModulesView.tsx (Builder Preview)
Paridade com area real:

| Linha | Antes | Depois |
|-------|-------|--------|
| 175 | `aspect-[2/3] rounded-lg` | `aspect-video rounded-lg` |
| 190 | `h-8 w-8` (icone Film) | `h-6 w-6` |
| 206-209 | `h-8 w-8` (icone Play) | `h-6 w-6` |
| 231 | `h-8 w-8` (icone Play preview) | `h-6 w-6` |

---

## Resultado Visual

### ANTES (2:3 Vertical - Paramount+)
```text
┌─────┐  ┌─────┐  ┌─────┐
│     │  │     │  │     │
│     │  │     │  │     │
│     │  │     │  │     │
│     │  │     │  │     │
└─────┘  └─────┘  └─────┘
  Alto      Alto      Alto
```

### DEPOIS (16:9 Horizontal - Netflix/Kiwify)
```text
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│             │  │             │  │             │
│             │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
     Largo           Largo           Largo
```

---

## Nota Tecnica: aspect-video

Tailwind CSS possui a classe utilitaria `aspect-video` que aplica exatamente `aspect-ratio: 16/9`, o que e equivalente a `aspect-[16/9]` mas mais semantico.

---

## Conformidade RISE V3

| Criterio | Status |
|----------|--------|
| LEI SUPREMA (4.1) | Nota 10.0/10 |
| SSOT | cardSizes.ts continua como fonte unica |
| Paridade Visual | Builder = Area Real |
| Padrao de Mercado | Netflix, Kiwify, Cakto |

**NOTA FINAL: 10.0/10** - Formato horizontal 16:9 padrao de mercado
