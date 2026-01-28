
# Plano: Melhorias no Fixed Header - Auto-Preenchimento e Limite de Caracteres

## Resumo Executivo

Implementar as seguintes melhorias na seção Fixed Header:

1. **Auto-preenchimento**: Novas áreas de membros vêm com título preenchido (nome do produto) e imagem do produto
2. **Limite de caracteres**: Título limitado a 60 caracteres com contador visual (15/60)
3. **Truncamento responsivo**: Títulos longos exibem "..." (ellipsis) na visualização

---

## Análise de Soluções (RISE V3 - Seção 4.4)

### Solução A: Truncamento apenas no CSS (sem limite real)
- Manutenibilidade: 4/10 (CSS pode ser ignorado, dados inconsistentes)
- Zero DT: 3/10 (não previne entrada de dados inválidos)
- Arquitetura: 3/10 (não segue padrão SSOT de field-limits)
- Escalabilidade: 5/10 (funciona visualmente mas dados podem crescer indefinidamente)
- Segurança: 10/10
- **NOTA FINAL: 5.0/10**

### Solução B: Limite no input + truncamento visual + SSOT em field-limits.ts
- Manutenibilidade: 10/10 (centralizado, segue padrão existente)
- Zero DT: 10/10 (limite enforced na entrada, não precisa correção futura)
- Arquitetura: 10/10 (segue SSOT de PRODUCT_FIELD_LIMITS existente)
- Escalabilidade: 10/10 (fácil ajustar limites centralmente)
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução B (10.0/10)

Implementar limite real no input com contador visual, seguindo o padrão já existente em `StepOne.tsx` e `ProductInfoSection.tsx`. Adicionar constantes em `field-limits.ts` como SSOT.

---

## Arquitetura da Solução

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                           FIELD-LIMITS.TS (SSOT)                              │
│                                                                               │
│  FIXED_HEADER_LIMITS = {                                                      │
│    TITLE_MAX: 60,           // Limite balanceado para responsividade          │
│    TITLE_TRUNCATE: 45,      // Truncar visualmente se maior que X             │
│  }                                                                            │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
┌────────────────────────────────────┐ ┌────────────────────────────────────┐
│      FixedHeaderEditor.tsx         │ │   FixedHeaderView.tsx /            │
│                                    │ │   BuyerFixedHeaderSection.tsx      │
│  [Título do Curso____________]     │ │                                    │
│  └──────────────────┘ 15/60        │ │   Título: "RatoFlix - Tenha a..."  │
│                                    │ │   (CSS truncate se muito longo)    │
└────────────────────────────────────┘ └────────────────────────────────────┘
```

---

## Implementação Técnica

### 1. Atualizar `field-limits.ts` (SSOT)

Adicionar novos limites para Fixed Header:

```typescript
export const FIXED_HEADER_LIMITS = {
  /** Título da header: até 60 caracteres (balanceado para responsividade) */
  TITLE_MAX: 60,
  /** Ponto de truncamento visual na área do aluno */
  TITLE_TRUNCATE_DISPLAY: 45,
} as const;
```

**Justificativa do limite 60:**
- O exemplo da Cakto "RatoFlix - Tenha acesso a tudo.." tem ~35 caracteres
- 60 caracteres permite títulos expressivos sem poluir a tela
- Responsivo em mobile (quebra natural de linha)
- Não é muito curto (limitaria criatividade) nem muito longo (overflow visual)

### 2. Atualizar `builderMachine.actors.ts` - Auto-Preenchimento

Modificar `generateDefaultSections` para incluir o nome do produto:

```typescript
// Antes
const fixedHeaderSettings: FixedHeaderSettings = {
  type: 'fixed_header',
  bg_image_url: productImageUrl || '',
  title: '', // Vazio
  // ...
};

// Depois
const fixedHeaderSettings: FixedHeaderSettings = {
  type: 'fixed_header',
  bg_image_url: productImageUrl || '',
  title: productName || '', // NOVO: Auto-preenchido com nome do produto
  // ...
};
```

Isso requer passar `productName` para a função, que será obtido na chamada da API.

### 3. Atualizar `FixedHeaderEditor.tsx` - Limite e Contador

```typescript
import { FIXED_HEADER_LIMITS } from '@/lib/constants/field-limits';

// No campo de título:
<div className="space-y-2">
  <Label htmlFor="header-title">Título</Label>
  <Input
    id="header-title"
    value={settings.title || ''}
    onChange={(e) => onUpdate({ title: e.target.value })}
    placeholder="Ex: RatoFlix - Tenha acesso a tudo"
    maxLength={FIXED_HEADER_LIMITS.TITLE_MAX}
  />
  <div className="flex justify-between items-center">
    <p className="text-xs text-muted-foreground">
      Se vazio, usa o nome do produto
    </p>
    <p className="text-xs text-muted-foreground">
      {(settings.title || '').length}/{FIXED_HEADER_LIMITS.TITLE_MAX}
    </p>
  </div>
</div>
```

### 4. Atualizar `FixedHeaderView.tsx` e `BuyerFixedHeaderSection.tsx` - Truncamento Visual

Adicionar função utilitária para truncamento com ellipsis:

```typescript
import { FIXED_HEADER_LIMITS } from '@/lib/constants/field-limits';

// Função de truncamento
function truncateTitle(title: string, maxLength: number): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
}

// Uso no componente
const displayTitle = truncateTitle(
  settings.title || productName || 'Título do Curso',
  FIXED_HEADER_LIMITS.TITLE_TRUNCATE_DISPLAY
);
```

Também adicionar CSS `truncate` como fallback de segurança:

```typescript
<h1 
  className={cn(
    'font-bold text-white drop-shadow-lg truncate', // NOVO: truncate como fallback
    'leading-tight max-w-3xl',
    // ...
  )}
>
  {displayTitle}
</h1>
```

### 5. Obter Nome do Produto na Inicialização

Atualizar o actor de carregamento para buscar o nome do produto:

```typescript
// Em loadBuilderActor
const { data } = await api.call<{ 
  sections?: unknown[]; 
  settings?: unknown;
  productImageUrl?: string | null;
  productName?: string | null; // NOVO
}>(...);

// Passar para generateDefaultSections
desktopSections = generateDefaultSections(
  productId, 
  productImageUrl, 
  productName, // NOVO
  modules, 
  'desktop'
);
```

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `field-limits.ts` | Adicionar `FIXED_HEADER_LIMITS` |
| `builderMachine.actors.ts` | Auto-preencher título com nome do produto |
| `builderMachine.types.ts` | Adicionar `productName` ao `LoadBuilderOutput` |
| `FixedHeaderEditor.tsx` | Adicionar `maxLength` e contador visual |
| `FixedHeaderView.tsx` | Adicionar truncamento visual |
| `BuyerFixedHeaderSection.tsx` | Adicionar truncamento visual (mesmo padrão) |

---

## Fluxo Resultante

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NOVA ÁREA DE MEMBROS CRIADA                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  generateDefaultSections() recebe:                                           │
│  - productImageUrl: "https://storage.../produto.jpg"                         │
│  - productName: "Curso Completo de Marketing Digital 2026"                  │
│  - modules: [{ id: "1", ... }, { id: "2", ... }]                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Fixed Header gerada com:                                                    │
│  - bg_image_url: "https://storage.../produto.jpg"                           │
│  - title: "Curso Completo de Marketing Digital 2026"                        │
│  - show_module_count: true                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  BUILDER CANVAS (Visualização)                                               │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  [Imagem do Produto]                                                  │  │
│  │                                                                       │  │
│  │    Curso Completo de Marketing D...                                   │  │
│  │    ┌─────────┐                                                        │  │
│  │    │2 módulos│                                                        │  │
│  │    └─────────┘                                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  EDITOR LATERAL (Edição)                                                     │
│                                                                              │
│  Título                                                                      │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Curso Completo de Marketing Digital 2026                           │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│  Se vazio, usa o nome do produto                               44/60       │
│                                                                              │
│  O usuário pode editar livremente com limite de 60 caracteres               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Conformidade RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| LEI SUPREMA (4.1) | 10/10 | SSOT em field-limits.ts, padrão existente seguido |
| Manutenibilidade Infinita | 10/10 | Limite centralizado, fácil ajustar |
| Zero Dívida Técnica | 10/10 | Enforced na entrada, truncamento visual |
| Arquitetura Correta | 10/10 | Segue padrão de PRODUCT_FIELD_LIMITS |
| Escalabilidade | 10/10 | Constantes centralizadas |
| Segurança | 10/10 | Sem vulnerabilidades |

**NOTA FINAL: 10.0/10**
