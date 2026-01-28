
# Plano: Alinhar Preview do Builder com Área de Membros Real

## RISE Protocol V3 - Análise de Soluções

### Solução A: Substituir grid por carousel horizontal no ModulesView do Builder
- Manutenibilidade: 10/10 (usa mesma estrutura visual do real)
- Zero DT: 10/10 (elimina discrepância visual)
- Arquitetura: 10/10 (preview reflete exatamente o resultado final)
- Escalabilidade: 10/10 (alterações futuras se refletem em ambos)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 45 minutos

### Solução B: Manter grid mas ajustar tamanhos dos cards
- Manutenibilidade: 6/10 (ainda há diferença estrutural)
- Zero DT: 5/10 (preview continua diferente, apenas mais próximo)
- Arquitetura: 5/10 (não resolve a causa raiz)
- Escalabilidade: 5/10 (alterações não sincronizadas)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 6.2/10**
- Tempo estimado: 20 minutos

### DECISÃO: Solução A (10.0/10)

Reescrever `ModulesView.tsx` do builder para usar o mesmo layout de carousel horizontal com cards de tamanho fixo que a área de membros real utiliza.

---

## Diagnóstico Root Cause

### Situação Atual (Incorreta)

| Componente | Arquivo | Layout | Largura Card |
|------------|---------|--------|--------------|
| **Builder Preview** | `ModulesView.tsx` | Grid com `gridTemplateColumns` | 100% da coluna (variável) |
| **Área Real** | `ModuleCarousel.tsx` + `NetflixModuleCard.tsx` | Carousel horizontal com scroll | `w-[180px] md:w-[220px]` (fixo) |

**Problema Identificado:**

O preview do builder mostra cards **muito maiores** porque usa grid com colunas iguais que ocupam toda a largura disponível, enquanto a área real usa cards de **tamanho fixo** (180-220px) com scroll horizontal.

### Comportamento Desejado

O preview do builder deve renderizar os módulos **exatamente** como aparecem na área de membros real:
- Cards com largura fixa de 180-220px
- Scroll horizontal (carousel)
- Mesmo aspect ratio (2:3 poster style)
- Mesmo hover behavior
- Mesma estrutura visual

---

## Alterações Necessárias

### 1. ModulesView.tsx - Refatorar para Carousel Horizontal

**Arquivo:** `src/modules/members-area-builder/components/sections/Modules/ModulesView.tsx`

**Mudanças:**
- Remover grid com `gridTemplateColumns`
- Implementar layout de carousel horizontal com `flex` + `overflow-x-auto`
- Usar cards com largura fixa equivalente à área real
- Adaptar tamanho para mobile (2 colunas menores)
- Manter funcionalidades de edição (hover com ícone de edição)

**Estrutura Nova:**
```text
┌─────────────────────────────────────────────────────────┐
│ [Título da Seção - "Seus Cursos"]                       │
├─────────────────────────────────────────────────────────┤
│ ← [Card 1] [Card 2] [Card 3] [Card 4] [...] →          │
│    w-[120px]  ou w-[160px] dependendo do viewMode       │
│    aspect-[2/3]                                         │
└─────────────────────────────────────────────────────────┘
```

**Cards Size no Preview:**

| ViewMode | Card Width | Rationale |
|----------|------------|-----------|
| Desktop Preview | `w-[160px]` | Proporcionalmente menor que a área real (220px) pois o canvas do builder é menor |
| Mobile Preview | `w-[100px]` | Ajustado para caber 2+ cards no frame mobile (~375px) |

### 2. ModuleCard (interno) - Alinhar com NetflixModuleCard

**Mudanças no card interno:**
- Manter `aspect-[2/3]` (poster style)
- Adicionar container com largura fixa (`flex-shrink-0`)
- Manter overlay de edição apenas no modo editor (não preview)
- Badge de "Inativo" quando módulo está desativado
- Título abaixo do card conforme configuração `show_title`

### 3. Remover Configuração "Cards por Linha"

**Problema:** A opção "Cards por Linha" (3, 4, 5) faz sentido para grid, mas não para carousel horizontal.

**Decisão Arquitetural:**
- **Remover** a opção `cards_per_row` do `ModulesSettings` e do editor
- A área de membros real já ignora essa configuração (usa carousel fixo)
- O preview deve refletir isso

**Arquivos afetados:**
- `src/modules/members-area-builder/types/builder.types.ts` - Remover `cards_per_row` de `ModulesSettings`
- `src/modules/members-area-builder/components/sections/Modules/ModulesEditor.tsx` - Remover select de "Cards por Linha"

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `ModulesView.tsx` | Refatorar de grid para carousel horizontal com cards fixos |
| `ModulesEditor.tsx` | Remover configuração "Cards por Linha" (não aplicável) |
| `builder.types.ts` | Remover `cards_per_row` de `ModulesSettings` |

---

## Fluxo Visual

```text
ANTES (Grid com colunas variáveis)
┌────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │          │  │          │  │          │  ← Cards│
│  │  Card 1  │  │  Card 2  │  │  Card 3  │    ocupam│
│  │  (GRANDE)│  │  (GRANDE)│  │  (GRANDE)│    toda a│
│  │          │  │          │  │          │    largura│
│  └──────────┘  └──────────┘  └──────────┘         │
└────────────────────────────────────────────────────┘

DEPOIS (Carousel com cards fixos - igual à área real)
┌────────────────────────────────────────────────────┐
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ...  ← Scroll │
│  │    │ │    │ │    │ │    │ │    │    Horizontal  │
│  │ C1 │ │ C2 │ │ C3 │ │ C4 │ │ C5 │                │
│  │    │ │    │ │    │ │    │ │    │    ← Cards     │
│  │    │ │    │ │    │ │    │ │    │    tamanho     │
│  └────┘ └────┘ └────┘ └────┘ └────┘    fixo        │
│  Mod 1  Mod 2  Mod 3  Mod 4  Mod 5                 │
└────────────────────────────────────────────────────┘
```

---

## Validação Pós-Implementação

| Verificação | Resultado Esperado |
|-------------|-------------------|
| Preview Desktop | Cards em carousel horizontal, tamanho fixo |
| Preview Mobile | Cards menores, 2+ por tela |
| Área Real Desktop | Idêntica ao preview |
| Área Real Mobile | Idêntica ao preview mobile |
| Hover no Editor | Ícone de edição aparece |
| Hover no Preview Mode | Ícone de play aparece (sem edição) |
| Editor "Cards por Linha" | Removido (não aplicável) |
| Scroll horizontal | Funciona no preview |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Root Cause Only | Corrige discrepância visual na fonte (componente de preview) |
| Zero Dívida Técnica | Preview = Área Real (mesma estrutura) |
| Single Source of Truth | Um estilo de layout para módulos |
| Segurança | Sem impacto |

**NOTA FINAL: 10.0/10** - Correção arquitetural seguindo RISE Protocol V3.
