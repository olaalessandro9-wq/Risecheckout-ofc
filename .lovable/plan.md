

# Plano: Header Totalmente Personalizável com Novos Elementos

## Diagnóstico Atual

O usuário identificou que a **Header da Área de Membros** não reflete todos os elementos visíveis na área do aluno. Atualmente:

### Elementos na Área do Aluno (via HeroBanner fallback):
1. ✅ **Título** (nome do produto)
2. ✅ **Subtítulo** (X módulos · Y aulas)
3. ✅ **Descrição** (product.description)
4. ✅ **Botão CTA** ("Começar a Assistir")

### Elementos Editáveis no Builder (FixedHeaderSettings):
1. ✅ Título
2. ✅ Contador de módulos (badge)
3. ❌ **Subtítulo/Stats com aulas** - NÃO EXISTE
4. ❌ **Descrição** - NÃO EXISTE  
5. ❌ **Botão CTA** - NÃO EXISTE
6. ❌ **Toggle show_title** - NÃO EXISTE

---

## Análise de Soluções (RISE V3 - Seção 4.4)

### Solução A: Adicionar Apenas os Toggles Básicos
- Manutenibilidade: 7/10 (campos limitados)
- Zero DT: 6/10 (futuro pedido para mais opções)
- Arquitetura: 6/10 (incompleto vs. HeroBanner)
- Escalabilidade: 6/10
- Segurança: 10/10
- **NOTA FINAL: 7.0/10**
- Tempo estimado: 30 minutos

### Solução B: Paridade Total com HeroBanner + Customização Completa
- Manutenibilidade: 10/10 (todos os elementos controláveis)
- Zero DT: 10/10 (nenhuma solicitação futura previsível)
- Arquitetura: 10/10 (FixedHeaderSettings = HeroBanner features)
- Escalabilidade: 10/10 (extensível facilmente)
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 2 horas

### DECISÃO: Solução B (10.0/10)

Implementar paridade total com customização completa de todos os elementos da Header.

---

## Nova Estrutura do FixedHeaderSettings

```typescript
interface FixedHeaderSettings {
  type: 'fixed_header';
  bg_image_url: string;
  
  // TÍTULO
  title: string;
  show_title: boolean;           // ← NOVO
  
  // SUBTÍTULO (Stats)
  show_stats: boolean;           // ← NOVO (X módulos · Y aulas)
  show_module_count: boolean;    // Já existe (renomear contexto)
  show_lesson_count: boolean;    // ← NOVO
  
  // DESCRIÇÃO
  show_description: boolean;     // ← NOVO
  description: string;           // ← NOVO (se vazio, usa do produto)
  
  // BOTÃO CTA
  show_cta_button: boolean;      // ← NOVO
  cta_button_text: string;       // ← NOVO (default: "Começar a Assistir")
  
  // CONFIGURAÇÕES VISUAIS (já existem)
  alignment: 'left' | 'center';
  size: 'small' | 'medium' | 'large';
  gradient_overlay?: GradientOverlayConfig;
}
```

---

## Comparativo Visual

```text
┌──────────────────────────────────────────────────────────────┐
│                      HEADER COMPLETA                          │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [Imagem de Fundo]                                        │ │
│  │                                                          │ │
│  │   ┌───────────────────────────────────────────────────┐ │ │
│  │   │ RISE COMMUNITY              ← show_title          │ │ │
│  │   │ 📚 0 módulos · 0 aulas      ← show_stats          │ │ │
│  │   │ Descrição do produto...     ← show_description    │ │ │
│  │   │ [▶ Começar a Assistir]      ← show_cta_button     │ │ │
│  │   └───────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

### 1. `src/modules/members-area-builder/types/settings.types.ts`
Expandir `FixedHeaderSettings` com os novos campos.

### 2. `src/modules/members-area-builder/types/defaults.ts`
Adicionar valores default para os novos campos.

### 3. `src/lib/constants/field-limits.ts`
Adicionar limites para descrição e texto do botão.

### 4. `src/modules/members-area-builder/components/sections/FixedHeader/FixedHeaderEditor.tsx`
Adicionar os novos controles no editor:
- Toggle "Mostrar Título"
- Toggle "Mostrar Stats" (módulos + aulas)
- Toggle "Mostrar Descrição" + Campo de texto
- Toggle "Mostrar Botão" + Campo de texto para customizar

### 5. `src/modules/members-area-builder/components/sections/FixedHeader/FixedHeaderView.tsx`
Renderizar os novos elementos no Builder Canvas.

### 6. `src/modules/members-area/pages/buyer/components/sections/BuyerFixedHeaderSection.tsx`
Renderizar os novos elementos na área do aluno:
- Stats com módulos e aulas
- Descrição (customizada ou do produto)
- Botão CTA funcional

---

## Detalhamento Técnico

### 1. Novos Tipos (settings.types.ts)

```typescript
export interface FixedHeaderSettings {
  type: 'fixed_header';
  bg_image_url: string;
  
  // Title
  title: string;
  show_title: boolean;
  
  // Stats (módulos + aulas)
  show_stats: boolean;
  show_lesson_count: boolean;
  
  // Description
  show_description: boolean;
  description: string;
  
  // CTA Button
  show_cta_button: boolean;
  cta_button_text: string;
  
  // Visual settings (existing)
  alignment: 'left' | 'center';
  size: 'small' | 'medium' | 'large';
  gradient_overlay?: GradientOverlayConfig;
  
  // Deprecated (será removido)
  show_module_count?: boolean; // Migrado para show_stats
}
```

### 2. Novos Defaults (defaults.ts)

```typescript
export const DEFAULT_FIXED_HEADER_SETTINGS: Omit<FixedHeaderSettings, 'type'> = {
  bg_image_url: '',
  title: '',
  show_title: true,
  show_stats: true,
  show_lesson_count: true,
  show_description: true,
  description: '',
  show_cta_button: true,
  cta_button_text: 'Começar a Assistir',
  alignment: 'left',
  size: 'large',
  gradient_overlay: DEFAULT_GRADIENT_OVERLAY,
};
```

### 3. Novos Limites (field-limits.ts)

```typescript
export const FIXED_HEADER_LIMITS = {
  TITLE_MAX: 60,
  TITLE_TRUNCATE_DISPLAY: 45,
  DESCRIPTION_MAX: 300,        // ← NOVO
  CTA_BUTTON_TEXT_MAX: 30,     // ← NOVO
} as const;
```

### 4. Editor UI (FixedHeaderEditor.tsx)

Novos controles organizados em seções:

```text
┌─────────────────────────────────────────┐
│ 📷 Imagem de Fundo                      │
│ [Upload Image]                          │
├─────────────────────────────────────────┤
│ 📝 CONTEÚDO                             │
│                                         │
│ ○ Mostrar Título      [ON/OFF]          │
│ └─ Título: [________________]           │
│                                         │
│ ○ Mostrar Stats       [ON/OFF]          │
│ └─ Exibir aulas       [ON/OFF]          │
│                                         │
│ ○ Mostrar Descrição   [ON/OFF]          │
│ └─ Descrição: [________________]        │
│ └─ Se vazio, usa descrição do produto   │
│                                         │
│ ○ Mostrar Botão       [ON/OFF]          │
│ └─ Texto: [Começar a Assistir______]    │
├─────────────────────────────────────────┤
│ 🎨 VISUAL                               │
│                                         │
│ Alinhamento: [Esquerda ▾]               │
│ Tamanho: [Grande (Hero) ▾]              │
├─────────────────────────────────────────┤
│ ✨ Efeito de Gradiente   [ON/OFF]       │
│ ...                                     │
└─────────────────────────────────────────┘
```

### 5. BuyerFixedHeaderSection.tsx - Props Adicionais

```typescript
interface BuyerFixedHeaderSectionProps {
  settings: FixedHeaderSettings;
  moduleCount: number;
  lessonCount: number;       // ← NOVO
  productName?: string;
  productDescription?: string; // ← NOVO
  onStartCourse?: () => void; // ← NOVO (para o botão CTA)
}
```

---

## Migração de Dados Existentes

Para compatibilidade com headers já salvas:

```typescript
// Em BuyerFixedHeaderSection e FixedHeaderView
const showStats = settings.show_stats ?? settings.show_module_count ?? true;
const showTitle = settings.show_title ?? true;
const showDescription = settings.show_description ?? false;
const showCtaButton = settings.show_cta_button ?? false;
```

---

## Conformidade RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| LEI SUPREMA (4.1) | 10/10 | Paridade total, não apenas toggles parciais |
| Manutenibilidade Infinita | 10/10 | SSOT em settings.types.ts |
| Zero Dívida Técnica | 10/10 | Todos os elementos controláveis |
| Arquitetura Correta | 10/10 | Separação clara Editor/View/Buyer |
| Escalabilidade | 10/10 | Fácil adicionar novos elementos |
| Segurança | 10/10 | Validação de limites |

**NOTA FINAL: 10.0/10**

---

## Resultado Esperado

### Antes:
- Header mostra apenas título e contador de módulos
- Descrição, aulas e botão não aparecem quando configurados no Builder

### Depois:
- Todos os elementos controláveis individualmente
- Paridade visual entre Builder e área do aluno
- Produtor pode escolher exatamente o que exibir na Header

