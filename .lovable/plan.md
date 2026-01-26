
# Correção de Rotas: Trackeamento e Pixels - RISE V3 10.0/10

## Diagnóstico do Problema

### ROOT CAUSE

| Problema | Localização | Consequência |
|----------|-------------|--------------|
| Link para `/dashboard/pixels` | `ProductPixelsSelector.tsx:93, 110` | 404 - Rota não existe |
| URL `/rastreamento` não corresponde ao label "Trackeamento" | `navigationConfig.ts:138`, `App.tsx:285`, `SidebarItem.tsx:45` | Inconsistência UX |

### Fluxo Visual do Problema

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROBLEMA ATUAL                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Sidebar Menu: "Trackeamento"                                                │
│  URL Atual: /dashboard/rastreamento                                          │
│  Conflito: Label ≠ URL                                                       │
│                                                                              │
│  ProductPixelsSelector (quando 0 pixels):                                    │
│  → Link: /dashboard/pixels                                                   │
│  → Resultado: 404 Page Not Found                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Análise de Soluções (RISE V3)

### Solução A: Apenas corrigir o link para /dashboard/rastreamento
- Manter URL como `/rastreamento`
- Corrigir links de `/pixels` para `/rastreamento`
- **Manutenibilidade**: 6/10 - Inconsistência label vs URL permanece
- **Zero DT**: 6/10 - Futura confusão sobre nomenclatura
- **Arquitetura**: 6/10 - Viola princípio de consistência
- **Escalabilidade**: 7/10 - OK
- **Segurança**: 10/10 - Sem impacto
- **NOTA FINAL: 6.4/10**

### Solução B: Unificar URL e Label como "trackeamento"
- Renomear rota de `/rastreamento` para `/trackeamento`
- Corrigir TODOS os links para `/dashboard/trackeamento`
- Atualizar App.tsx, navigationConfig.ts, SidebarItem.tsx
- Corrigir ProductPixelsSelector.tsx
- **Manutenibilidade**: 10/10 - Consistência total (label = URL)
- **Zero DT**: 10/10 - Nenhuma confusão futura
- **Arquitetura**: 10/10 - Princípio de consistência respeitado
- **Escalabilidade**: 10/10 - Nomenclatura única
- **Segurança**: 10/10 - Sem impacto
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução B (Nota 10.0/10)
Unificar toda nomenclatura para "trackeamento" garante consistência total entre sidebar, URL e código.

---

## Especificação Técnica

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Rota `rastreamento` → `trackeamento` |
| `src/modules/navigation/config/navigationConfig.ts` | Path `/dashboard/rastreamento` → `/dashboard/trackeamento` |
| `src/modules/navigation/components/Sidebar/SidebarItem.tsx` | Prefetch key `rastreamento` → `trackeamento` |
| `src/components/products/ProductPixelsSelector.tsx` | Links `/dashboard/pixels` → `/dashboard/trackeamento` |

### 1. App.tsx (linha 285)

```typescript
// ANTES
{ path: "rastreamento", element: <Rastreamento /> },

// DEPOIS
{ path: "trackeamento", element: <Rastreamento /> },
```

### 2. navigationConfig.ts (linha 138)

```typescript
// ANTES
path: "/dashboard/rastreamento",

// DEPOIS
path: "/dashboard/trackeamento",
```

### 3. SidebarItem.tsx (linha 45)

```typescript
// ANTES
'/dashboard/rastreamento': () => import('@/pages/Rastreamento'),

// DEPOIS
'/dashboard/trackeamento': () => import('@/pages/Rastreamento'),
```

### 4. ProductPixelsSelector.tsx (linhas 93 e 110)

```typescript
// ANTES (linha 93)
<Link to="/dashboard/pixels">

// DEPOIS
<Link to="/dashboard/trackeamento">

// ANTES (linha 110)
<Link to="/dashboard/pixels">

// DEPOIS
<Link to="/dashboard/trackeamento">
```

---

## Resultado Esperado

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  APÓS CORREÇÃO                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Sidebar Menu: "Trackeamento"                                                │
│  URL: /dashboard/trackeamento                                                │
│  Consistência: ✅ Label = URL                                               │
│                                                                              │
│  ProductPixelsSelector (quando 0 pixels):                                    │
│  → Link: /dashboard/trackeamento                                             │
│  → Resultado: ✅ Abre página de Trackeamento corretamente                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Verificação RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | Nomenclatura única em todo o sistema |
| Zero DT | 10/10 | Nenhuma inconsistência remanescente |
| Arquitetura | 10/10 | Princípio de consistência respeitado |
| Escalabilidade | 10/10 | URL intuitiva e alinhada ao menu |
| Segurança | 10/10 | Sem impacto |
| **NOTA FINAL** | **10.0/10** |

---

## Tempo Estimado
**5 minutos**
