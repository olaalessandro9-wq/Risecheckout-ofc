
# Plano Completo: Correção Arquitetural do Builder

## RISE Protocol V3 - Seção 4: LEI SUPREMA

---

## Análise de Soluções

### Solução A: Correção Completa (Filtro Viewport + Card Size + Cleanup)
- Manutenibilidade: 10/10 (SSOT para viewport e tamanho)
- Zero DT: 10/10 (resolve duplicação E tamanho na raiz)
- Arquitetura: 10/10 (Edge Function filtrada, frontend simples)
- Escalabilidade: 10/10 (suporta layouts independentes)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 2-3 horas

### Solução B: Apenas Filtro no Frontend
- Manutenibilidade: 5/10 (filtro duplicado entre Builder e Área)
- Zero DT: 4/10 (dados duplicados permanecem)
- Arquitetura: 4/10 (frontend compensa erro do backend)
- Escalabilidade: 5/10 (aumenta payload desnecessário)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 5.6/10**
- Tempo estimado: 30 minutos

### DECISÃO: Solução A (10.0/10)

---

## Diagnóstico Root Cause Confirmado

### Problema 1: Duplicação de TODAS as Seções

**Dados atuais no banco:**

| viewport | type | position | Quantidade |
|----------|------|----------|------------|
| desktop | banner | 0 | 1 |
| desktop | modules | 1-2 | 2 |
| **mobile** | banner | 0 | **2 DUPLICADOS** |
| **mobile** | modules | 1 | **2 DUPLICADOS** |

**Total:** 7 registros no banco → 7 seções renderizadas na Área de Membros

**Causa Raiz Tripla:**
1. Edge Function `content.ts` não filtra por `viewport`
2. Frontend `CourseHome.tsx` renderiza tudo sem filtrar
3. `builderMachine.actors.ts` cria duplicatas no auto-init

### Problema 2: Tamanhos Diferentes

| Componente | Desktop | Mobile |
|------------|---------|--------|
| Builder (ModulesView) | 140px | 100px |
| Área Real (NetflixModuleCard) | 220px | 180px |

**Causa Raiz:** Não existe `card_size` em `ModulesSettings` - valores hardcoded diferentes.

---

## Alterações Necessárias

### Parte 1: Limpar Dados Duplicados

Executar SQL para remover duplicatas existentes:

```sql
-- Remove duplicatas mantendo a mais recente
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY product_id, type, viewport, position 
      ORDER BY created_at DESC
    ) as rn
  FROM product_members_sections
)
DELETE FROM product_members_sections
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
```

### Parte 2: Adicionar `card_size` em ModulesSettings

**Arquivo:** `src/modules/members-area-builder/types/builder.types.ts`

```typescript
export interface ModulesSettings {
  type: 'modules';
  course_id: string | null;
  show_title: 'always' | 'hover' | 'never';
  show_progress: boolean;
  module_order?: string[];
  hidden_module_ids?: string[];
  // NOVO: Tamanho configurável pelo produtor
  card_size: 'small' | 'medium' | 'large';
}

export const DEFAULT_MODULES_SETTINGS: Omit<ModulesSettings, 'type'> = {
  course_id: null,
  show_title: 'always',
  show_progress: true,
  module_order: [],
  hidden_module_ids: [],
  card_size: 'medium', // Default
};
```

**Mapeamento de Tamanhos (SSOT compartilhado):**

| card_size | Desktop | Mobile |
|-----------|---------|--------|
| small | 140px | 100px |
| medium | 180px | 130px |
| large | 220px | 160px |

### Parte 3: Adicionar UI no Editor

**Arquivo:** `src/modules/members-area-builder/components/sections/Modules/ModulesEditor.tsx`

Adicionar Select para "Tamanho dos Cards":

```typescript
<div className="space-y-2">
  <Label>Tamanho dos Cards</Label>
  <Select
    value={settings.card_size || 'medium'}
    onValueChange={(value: 'small' | 'medium' | 'large') => 
      onUpdate({ card_size: value })
    }
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="small">Pequeno (mais cards visíveis)</SelectItem>
      <SelectItem value="medium">Médio</SelectItem>
      <SelectItem value="large">Grande (menos cards visíveis)</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Parte 4: Usar `card_size` no Builder Preview

**Arquivo:** `src/modules/members-area-builder/components/sections/Modules/ModulesView.tsx`

```typescript
// SSOT para tamanhos
const CARD_SIZE_MAP = {
  small: { desktop: 'w-[140px]', mobile: 'w-[100px]' },
  medium: { desktop: 'w-[180px]', mobile: 'w-[130px]' },
  large: { desktop: 'w-[220px]', mobile: 'w-[160px]' },
} as const;

// No componente
const cardSize = settings.card_size || 'medium';
const cardWidth = CARD_SIZE_MAP[cardSize][viewMode === 'mobile' ? 'mobile' : 'desktop'];
```

### Parte 5: Usar `card_size` na Área Real

**Arquivo:** `src/modules/members-area/pages/buyer/components/netflix/NetflixModuleCard.tsx`

Adicionar prop `cardSize` e aplicar mesma lógica:

```typescript
interface NetflixModuleCardProps {
  module: Module;
  index: number;
  onClick?: () => void;
  cardSize?: 'small' | 'medium' | 'large';
}

const CARD_SIZE_MAP = {
  small: 'w-[100px] md:w-[140px]',
  medium: 'w-[130px] md:w-[180px]',
  large: 'w-[160px] md:w-[220px]',
} as const;

// No className
className={cn(
  "relative group/card cursor-pointer flex-shrink-0",
  CARD_SIZE_MAP[cardSize || 'medium']
)}
```

**Arquivo:** `src/modules/members-area/pages/buyer/components/netflix/ModuleCarousel.tsx`

Passar `cardSize` para os cards baseado nas settings da seção.

### Parte 6: Filtrar por Viewport na Edge Function

**Arquivo:** `supabase/functions/buyer-orders/handlers/content.ts`

```typescript
export async function handleContent(
  supabase: SupabaseClient,
  buyer: BuyerData,
  productId: string,
  viewport: 'desktop' | 'mobile', // NOVO PARÂMETRO
  corsHeaders: Record<string, string>
): Promise<Response> {
  // ...

  // CORRIGIDO: Filtrar por viewport
  const { data: sections } = await supabase
    .from("product_members_sections")
    .select("*")
    .eq("product_id", productId)
    .eq("viewport", viewport) // ← FILTRO ADICIONADO
    .eq("is_active", true)
    .order("position", { ascending: true });

  // ...
}
```

**Arquivo:** `supabase/functions/buyer-orders/index.ts`

Extrair viewport do request (header ou query param).

### Parte 7: Enviar Viewport do Frontend

**Arquivo:** `src/modules/members-area/pages/buyer/CourseHome.tsx`

```typescript
import { useIsMobile } from "@/hooks/use-mobile";

// No componente
const isMobile = useIsMobile();
const viewport = isMobile ? 'mobile' : 'desktop';

// Passar para o hook
useBuyerProductContent(productId, viewport);
```

**Arquivo:** `src/hooks/useBuyerOrders.ts`

Adicionar parâmetro `viewport` na chamada à Edge Function.

### Parte 8: Corrigir Auto-Init para Não Duplicar

**Arquivo:** `src/modules/members-area-builder/machines/builderMachine.actors.ts`

```typescript
// ANTES (cria duplicatas)
if (mobileSections.length === 0 && desktopSections.length > 0) {
  mobileSections = desktopSections.map(...);
}

// DEPOIS (verifica banco primeiro)
const dbHasMobileSections = allSections.some(s => s.viewport === 'mobile');
if (!dbHasMobileSections && desktopSections.length > 0) {
  mobileSections = desktopSections.map(...);
  isMobileSynced = true;
}
```

---

## Resumo de Arquivos a Alterar

| Arquivo | Alteração |
|---------|-----------|
| `builder.types.ts` | Adicionar `card_size: 'small' \| 'medium' \| 'large'` |
| `ModulesEditor.tsx` | Adicionar Select "Tamanho dos Cards" |
| `ModulesView.tsx` (Builder) | Usar `card_size` para largura dinâmica |
| `NetflixModuleCard.tsx` (Área Real) | Aceitar prop `cardSize` |
| `ModuleCarousel.tsx` (Área Real) | Passar `cardSize` para os cards |
| `content.ts` (Edge Function) | Adicionar `.eq("viewport", viewport)` |
| `index.ts` (Edge Function router) | Extrair `viewport` do request |
| `useBuyerOrders.ts` | Adicionar param `viewport` |
| `CourseHome.tsx` | Detectar viewport e passar para hook |
| `builderMachine.actors.ts` | Corrigir lógica de auto-init |
| **SQL** | Limpar duplicatas existentes |

---

## Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────────────┐
│                    BUILDER (Produtor)                        │
│                                                              │
│   [Desktop]                      [Mobile]                    │
│   ┌────────────────────┐        ┌────────────────────┐      │
│   │ Banner             │        │ Banner             │      │
│   │ Modules            │        │ Modules            │      │
│   │   card_size: large │        │   card_size: small │      │
│   │   (220px)          │        │   (100px)          │      │
│   └────────────────────┘        └────────────────────┘      │
│                                                              │
│   SAVE → Seções separadas por viewport                       │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              BANCO DE DADOS (LIMPO)                          │
│                                                              │
│   SEM DUPLICATAS:                                            │
│   - desktop/banner/0 → 1 registro                            │
│   - desktop/modules/1 → 1 registro                           │
│   - mobile/banner/0 → 1 registro                             │
│   - mobile/modules/1 → 1 registro                            │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              EDGE FUNCTION (FILTRADA)                        │
│                                                              │
│   GET /content?productId=X&viewport=desktop                  │
│                                                              │
│   SELECT * FROM product_members_sections                     │
│   WHERE viewport = 'desktop' ← FILTRO ATIVO                  │
│                                                              │
│   Retorna: 1 banner + 1 modules (NÃO 3 + 4)                 │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              ÁREA DE MEMBROS (ALUNO)                         │
│                                                              │
│   Desktop: 1 banner + 1 carrossel (card_size: large)        │
│   Mobile: 1 banner + 1 carrossel (card_size: small)         │
│                                                              │
│   Tamanho do preview = Tamanho da área real                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Validação Pós-Implementação

| Verificação | Resultado Esperado |
|-------------|-------------------|
| Editor tem "Tamanho dos Cards" | Sim - Small/Medium/Large |
| Preview Desktop card_size=large | Cards 220px |
| Área Real Desktop card_size=large | Cards 220px (IGUAL preview) |
| Preview Mobile card_size=small | Cards 100px |
| Área Real Mobile card_size=small | Cards 100px (IGUAL preview) |
| Banners na Área Real | 1 por viewport (NÃO 3) |
| Seções de Módulos na Área Real | Conforme configurado (NÃO duplicadas) |
| Auto-init não duplica | Verificação de existência |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| LEI SUPREMA (4.1) | Escolhemos nota 10.0, não 5.6 |
| Manutenibilidade Infinita | SSOT para card_size e viewport |
| Zero Dívida Técnica | Limpa banco + corrige lógica |
| Arquitetura Correta | Filtro na Edge Function (não frontend) |
| Escalabilidade | Layouts independentes desktop/mobile |

**NOTA FINAL: 10.0/10** - Refatoração arquitetural completa seguindo RISE Protocol V3.
