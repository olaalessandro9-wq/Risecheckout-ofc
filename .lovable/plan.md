
# Plano: Corrigir Propagação de `show_title` para Área de Membros

## RISE Protocol V3 - Seção 4: LEI SUPREMA

---

## Diagnóstico do Bug

| Componente | Status | Problema |
|------------|--------|----------|
| `ModulesEditor.tsx` | OK | Controle funciona, salva `show_title` corretamente |
| `ModulesView.tsx` (Builder) | OK | Implementa lógica de exibição condicional |
| `CourseHome.tsx` | FALHA | Extrai `cardSize`/`titleSize`, mas **NÃO** extrai `show_title` |
| `ModuleCarousel.tsx` | FALHA | Interface **NÃO** tem prop `showTitle` |
| `NetflixModuleCard.tsx` | FALHA | Título **HARDCODED** - sempre visível (linhas 87-97) |

**Causa Raiz:** A configuração `show_title` não está sendo propagada da seção salva no banco até o componente final de renderização.

---

## Análise de Soluções

### Solucao A: Propagacao Completa com Paridade Visual Builder ↔ Área Real
- Manutenibilidade: 10/10 (configuracao centralizada, comportamento identico)
- Zero DT: 10/10 (resolve na raiz, sem hardcoded)
- Arquitetura: 10/10 (fluxo de dados limpo e consistente)
- Escalabilidade: 10/10 (mesma estrutura para futuras configs)
- Seguranca: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 30 minutos

### Solucao B: Apenas adicionar prop sem logica de hover
- Manutenibilidade: 5/10 (incompleto, hover nao funcionaria)
- Zero DT: 4/10 (implementacao parcial)
- Arquitetura: 4/10 (divergencia visual Builder vs Área Real)
- Escalabilidade: 5/10 (precisaria completar depois)
- Seguranca: 10/10 (sem impacto)
- **NOTA FINAL: 5.6/10**
- Tempo estimado: 10 minutos

### DECISAO: Solucao A (10.0/10)
Solucao B cria divergencia visual entre o que o produtor ve no Builder e o que o aluno ve na área real.

---

## Alteracoes Necessarias

### Parte 1: Atualizar `NetflixModuleCard.tsx`

Adicionar prop `showTitle` e implementar logica condicional (espelhando o Builder):

```typescript
interface NetflixModuleCardProps {
  module: Module;
  index: number;
  onClick?: () => void;
  cardSize?: CardSize;
  showTitle?: 'always' | 'hover' | 'never'; // NOVO
}

export function NetflixModuleCard({ 
  module, 
  index, 
  onClick, 
  cardSize = 'medium',
  showTitle = 'always' // NOVO - default mantem compatibilidade
}: NetflixModuleCardProps) {
  // ... codigo existente ...

  return (
    <motion.div>
      {/* Card Container */}
      <motion.div>
        {/* ... imagem, badge, etc ... */}
      </motion.div>

      {/* Title below card - CONDICIONAL */}
      {showTitle !== 'never' && (
        <div className={cn(
          'mt-3 space-y-1 transition-opacity',
          showTitle === 'hover' && 'opacity-0 group-hover/card:opacity-100'
        )}>
          <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover/card:text-members-primary transition-colors">
            {module.title}
          </h3>
          {module.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {module.description}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
```

### Parte 2: Atualizar `ModuleCarousel.tsx`

Adicionar prop `showTitle` e propagar para os cards:

```typescript
interface ModuleCarouselProps {
  modules: Module[];
  onSelectContent: (content: ContentItem, module: Module) => void;
  title?: string | null;
  cardSize?: CardSize;
  titleSize?: TitleSize;
  showTitle?: 'always' | 'hover' | 'never'; // NOVO
}

export function ModuleCarousel({ 
  modules, 
  onSelectContent, 
  title, 
  cardSize = 'medium', 
  titleSize = 'medium',
  showTitle = 'always' // NOVO
}: ModuleCarouselProps) {
  // ... codigo existente ...

  return (
    <div className="relative py-6">
      {/* ... Section Title ... */}
      
      {/* Scrollable Container */}
      <div ref={scrollRef} /* ... */>
        {modules.map((module, index) => (
          <NetflixModuleCard
            key={module.id}
            module={module}
            index={index}
            onClick={() => handleModuleClick(module)}
            cardSize={cardSize}
            showTitle={showTitle} // NOVO - propaga para card
          />
        ))}
      </div>
    </div>
  );
}
```

### Parte 3: Atualizar `CourseHome.tsx`

Extrair `show_title` do `sectionSettings` e passar para `ModuleCarousel`:

```typescript
if (section.type === 'modules') {
  const sectionSettings = section.settings as unknown as ModulesSettings;
  const visibleModules = getVisibleOrderedModules(modules, sectionSettings);
  
  // RISE V3: Get all display settings from section
  const cardSize: CardSize = sectionSettings.card_size || 'medium';
  const titleSize: TitleSize = sectionSettings.title_size || 'medium';
  const showTitle = sectionSettings.show_title || 'always'; // NOVO
  
  if (visibleModules.length === 0) return null;
  
  return (
    <ModuleCarousel
      key={section.id}
      modules={visibleModules}
      onSelectContent={handleSelectContent}
      title={section.title}
      cardSize={cardSize}
      titleSize={titleSize}
      showTitle={showTitle} // NOVO - propaga config
    />
  );
}
```

---

## Fluxo de Dados Corrigido

```text
┌─────────────────────────────────────────────────────────────┐
│                    BUILDER (Produtor)                        │
│                                                              │
│   Exibir Titulo do Modulo: [Apenas no hover ▾]              │
│                                                              │
│   Preview (ModulesView.tsx):                                │
│   ┌───────────────────────────────────────┐                 │
│   │ ┌───┐ ┌───┐ ┌───┐                     │                 │
│   │ │   │ │   │ │   │                     │                 │
│   │ └───┘ └───┘ └───┘                     │                 │
│   │       (hover → titulo aparece)        │                 │
│   └───────────────────────────────────────┘                 │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │ SAVE (show_title: 'hover')
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        BANCO DE DADOS                        │
│   product_members_sections.settings: {                      │
│     show_title: 'hover',                                    │
│     card_size: 'large',                                     │
│     title_size: 'medium'                                    │
│   }                                                         │
└────────────────────────┬────────────────────────────────────┘
                         │ FETCH
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          ÁREA DE MEMBROS (Aluno) - CORRIGIDO                │
│                                                              │
│   CourseHome.tsx:                                           │
│     const showTitle = sectionSettings.show_title || 'always'│
│                         │                                   │
│   ModuleCarousel.tsx:   │                                   │
│     <ModuleCarousel showTitle={showTitle} ... />            │
│                         │                                   │
│   NetflixModuleCard.tsx:│                                   │
│     {showTitle !== 'never' && (                             │
│       <div className={showTitle === 'hover' ?               │
│         'opacity-0 group-hover:opacity-100' : ''}>          │
│         {module.title}                                      │
│       </div>                                                │
│     )}                                                       │
│                                                              │
│   Resultado Visual:                                         │
│   ┌───────────────────────────────────────┐                 │
│   │ ┌───┐ ┌───┐ ┌───┐                     │                 │
│   │ │   │ │   │ │   │                     │                 │
│   │ └───┘ └───┘ └───┘                     │                 │
│   │       (hover → titulo aparece)        │ ← PARIDADE!    │
│   └───────────────────────────────────────┘                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Resumo de Arquivos a Alterar

| Arquivo | Alteracao |
|---------|-----------|
| `NetflixModuleCard.tsx` | Adicionar prop `showTitle`, implementar logica condicional |
| `ModuleCarousel.tsx` | Adicionar prop `showTitle`, propagar para cards |
| `CourseHome.tsx` | Extrair `show_title` e passar para ModuleCarousel |

---

## Comportamento Esperado Apos Correcao

| Configuracao | Builder Preview | Área de Membros Real |
|--------------|-----------------|---------------------|
| `always` | Titulo sempre visivel | Titulo sempre visivel |
| `hover` | Titulo aparece no hover | Titulo aparece no hover |
| `never` | Titulo nunca visivel | Titulo nunca visivel |

---

## Conformidade RISE V3

| Criterio | Status |
|----------|--------|
| LEI SUPREMA (4.1) | Escolhemos nota 10.0 (propagacao completa) |
| Manutenibilidade Infinita | Fluxo de dados limpo e documentado |
| Zero Divida Tecnica | Comportamento identico em todos os ambientes |
| Arquitetura Correta | Paridade visual Builder ↔ Área Real |
| Escalabilidade | Padrao replicavel para futuras configs |

**NOTA FINAL: 10.0/10** - Correcao de bug seguindo RISE Protocol V3.
