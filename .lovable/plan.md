
# Plano: Mover Toggle Desktop/Mobile para o Header + Corrigir Erro de Save

## Diagnóstico Completo

### Problema 1: Erro ao Salvar (500)

**Causa Raiz Identificada:**
O banco de dados tem uma constraint que só aceita os seguintes tipos de seção:
```sql
CHECK ((type = ANY (ARRAY['banner', 'modules', 'courses', 'continue_watching', 'text', 'spacer'])))
```

O novo tipo `fixed_header` **não está na constraint**, causando o erro:
```
new row for relation "product_members_sections" violates check constraint "product_members_sections_type_check"
```

**Solução:** Atualizar a constraint para incluir `fixed_header`.

### Problema 2: Toggle Desktop/Mobile no Local Errado

**Situação Atual:**
- O toggle Desktop/Mobile está no `ViewportSyncPanel` dentro da sidebar
- Usuário quer que fique no header (topo), próximo ao Preview e Salvar
- Opções de sincronização devem aparecer apenas quando Mobile está selecionado

---

## Análise de Soluções (RISE V3 - Seção 4.4)

### Solução A: Apenas Mover o Toggle (Manter ViewportSyncPanel)
- Manutenibilidade: 6/10 (código duplicado entre header e sidebar)
- Zero DT: 5/10 (dois lugares controlando o mesmo estado)
- Arquitetura: 5/10 (viola Single Source of Truth visual)
- Escalabilidade: 6/10
- Segurança: 10/10
- **NOTA FINAL: 6.4/10**

### Solução B: Refatorar Completamente - Toggle no Header, Remover ViewportSyncPanel
- Manutenibilidade: 10/10 (código centralizado no header)
- Zero DT: 10/10 (uma única fonte de controle)
- Arquitetura: 10/10 (Clean Architecture - responsabilidades claras)
- Escalabilidade: 10/10 (fácil adicionar mais opções no futuro)
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução B (10.0/10)

Remover completamente o `ViewportSyncPanel` e mover toda a lógica para o `BuilderHeader`.

---

## Arquitetura da Solução

```text
ANTES (Atual)
┌────────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                     │
│  [Voltar] | Personalizar Área | [Desktop] (badge)                          │
│                               [Desktop][Mobile] (View Mode)   [Preview][Save] │
└────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────┐
│  SIDEBAR                        │
│  ┌─────────────────────────────┐│
│  │ Editando Layout             ││  ← REMOVER COMPLETAMENTE
│  │ [Desktop(2)][Mobile(2)]     ││
│  │ "Alterações serão..."       ││
│  └─────────────────────────────┘│
│  [Início][Menu][Global]         │
│  ...                            │
└─────────────────────────────────┘

DEPOIS (Novo)
┌────────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                     │
│  [Voltar] | Personalizar Área                                              │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ [Desktop(2)][Mobile(2)]  (activeViewport toggle)                       ││  ← NOVO
│  │                                                                         ││
│  │ SE MOBILE: [🔗 Sincronizar] [📋 Copiar do Desktop]                    ││  ← CONDICIONAL
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│                               [Desktop][Mobile] (viewMode) [Preview][Save]  │
└────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────┐
│  SIDEBAR (sem ViewportSyncPanel)│
│  [Início][Menu][Global]         │  ← SIMPLIFICADO
│  ...                            │
└─────────────────────────────────┘
```

---

## Implementação Técnica

### 1. Criar Migration para Adicionar `fixed_header` à Constraint

```sql
-- Atualizar constraint para incluir fixed_header
ALTER TABLE product_members_sections 
DROP CONSTRAINT IF EXISTS product_members_sections_type_check;

ALTER TABLE product_members_sections 
ADD CONSTRAINT product_members_sections_type_check 
CHECK (type = ANY (ARRAY[
  'banner', 
  'modules', 
  'courses', 
  'continue_watching', 
  'text', 
  'spacer',
  'fixed_header'  -- NOVO
]));
```

### 2. Refatorar `BuilderHeader.tsx`

Adicionar controles de viewport no centro-esquerda do header:

```typescript
// Nova estrutura do header:
// Left: [Voltar] | Título
// Center-Left: [Desktop(X)][Mobile(X)] + opções de sync (apenas quando Mobile)
// Center-Right: [Desktop][Mobile] (view mode para preview)
// Right: [Preview][Salvar]
```

Props necessárias:
- `desktopSections.length`
- `mobileSections.length`
- `activeViewport`
- `isMobileSynced`
- `actions.setActiveViewport`
- `actions.copyDesktopToMobile`
- `actions.setMobileSynced`

### 3. Remover `ViewportSyncPanel` da Sidebar

Modificar `BuilderSidebar.tsx` para remover completamente o componente `ViewportSyncPanel`.

### 4. Adicionar Toast de Erro para Falhas de Save

O toast de sucesso já existe em `builderMachine.actors.ts`. Verificar se o toast de erro está sendo exibido corretamente quando a máquina entra no estado de erro.

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/` | Nova migration para constraint |
| `BuilderHeader.tsx` | Adicionar toggle de viewport + opções de sync |
| `BuilderSidebar.tsx` | Remover `ViewportSyncPanel` |
| `ViewportSyncPanel.tsx` | Pode ser deletado após refatoração |

---

## Resultado Esperado

### Antes:
- Toggle Desktop/Mobile na sidebar (confuso)
- Erro 500 ao salvar com `fixed_header`
- Sem mensagem de erro visível

### Depois:
- Toggle Desktop/Mobile no header (intuitivo)
- Opções de sync aparecem apenas quando Mobile está ativo
- `fixed_header` salva corretamente
- Mensagens de erro exibidas via toast

---

## Conformidade RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| LEI SUPREMA (4.1) | 10/10 | Refatoração completa, não apenas "mover código" |
| Manutenibilidade Infinita | 10/10 | Header centraliza controles de viewport |
| Zero Dívida Técnica | 10/10 | Constraint atualizada, UI limpa |
| Arquitetura Correta | 10/10 | Single Source of Truth visual |
| Escalabilidade | 10/10 | Fácil adicionar mais opções |
| Segurança | 10/10 | Constraint de banco corrigida |

**NOTA FINAL: 10.0/10**
