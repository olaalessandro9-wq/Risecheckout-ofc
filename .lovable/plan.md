
# Correcao: Persistencia de `isMobileSynced` no Checkout Builder

## Diagnostico: 4 Bugs Interconectados

Apos investigacao profunda do ciclo completo (Frontend Machine -> Save Actor -> Edge Function -> Database -> Load Actor -> Frontend Machine), identifiquei **4 bugs** com a mesma causa raiz: **o campo `isMobileSynced` nao e persistido explicitamente no banco de dados**.

### BUG 1: `isMobileSynced` e INFERIDO, nao persistido (CRITICO)

No load actor (`checkoutEditorMachine.actors.ts`, linhas 112-116):

```typescript
const hasMobileComponents =
  (Array.isArray(mobileTop) && mobileTop.length > 0) ||
  (Array.isArray(mobileBottom) && mobileBottom.length > 0);

const isMobileSynced = !hasMobileComponents;
```

**Cenario do bug reportado:**
1. User desicroniza mobile (`isMobileSynced = false`)
2. User deleta o cronometro do mobile (agora mobile tem 0 top components e 0 bottom components)
3. User salva -> envia `mobileTopComponents: []`, `mobileBottomComponents: []`
4. No reload (F5), `hasMobileComponents = false` (ambos arrays vazios)
5. Portanto `isMobileSynced = true` -- **ERRADO!** O user desicronizou mas o sistema reclassifica como "sincronizado"

**Este e o bug exato reportado:** "apaguei o cronometro e salvei, apos dar um F5 apareceu novamente 'sincronizado'"

### BUG 2: `isDirty` nao verifica `isMobileSynced` (CRITICO)

No guards (`checkoutEditorMachine.guards.ts`, linhas 26-39):

```typescript
export function isDirty({ context }): boolean {
  const desktopChanged = customizationChanged(/*...*/);
  const mobileChanged = customizationChanged(/*...*/);
  return desktopChanged || mobileChanged;
  // NÃO VERIFICA isMobileSynced!
}
```

**Consequencias:**
- Se o user apenas altera o sync (sem mudar componentes), `isDirty = false`
- `canSave` retorna `false` -- o user NAO CONSEGUE salvar
- O handler de foco da janela (`useCheckoutEditorState.ts`, linha 37-43) detecta `!isDirty` e dispara `REFRESH`, recarregando do banco e revertendo o estado

**Este e o segundo bug reportado:** "se eu marco como desicronizado e saio da aba, quando volto ja esta sincronizado de novo"

### BUG 3: `DISCARD_CHANGES` nao restaura `isMobileSynced` (ALTO)

Na machine (`checkoutEditorMachine.ts`, linhas 294-301):

```typescript
DISCARD_CHANGES: {
  actions: assign(({ context }) => ({
    desktopCustomization: JSON.parse(JSON.stringify(context.originalDesktopCustomization)),
    mobileCustomization: JSON.parse(JSON.stringify(context.originalMobileCustomization)),
    selectedComponentId: null,
    // isMobileSynced NÃO É RESTAURADO!
  })),
},
```

### BUG 4: Nao existe `originalIsMobileSynced` para comparacao (ALTO)

O contexto nao tem um campo `originalIsMobileSynced` para rastrear se o sync mudou desde o ultimo load/save. Sem ele, o dirty tracking de sync e impossivel.

---

## Analise de Solucoes

### Solucao A: Usar convencao `null` vs `[]` para inferir sync

Quando synced, salvar `null` nos campos mobile. Quando independente, salvar `[]` (mesmo vazio). Diferenciar no load: `null = synced`, `[] = independente`.

- Manutenibilidade: 5/10 (convencao sutil, facil de quebrar acidentalmente)
- Zero DT: 4/10 (depende de todos os escritores respeitarem a convencao null vs array vazio)
- Arquitetura: 4/10 (semantica implicita em vez de explicita)
- Escalabilidade: 4/10 (quebravel com qualquer novo escritor que nao conheca a convencao)
- Seguranca: 10/10
- **NOTA FINAL: 4.7/10**

### Solucao B: Coluna `is_mobile_synced` no banco + persistencia explicita

Adicionar coluna `is_mobile_synced BOOLEAN DEFAULT true` na tabela `checkouts`. Salvar e carregar explicitamente. Adicionar `originalIsMobileSynced` ao contexto da machine. Atualizar `isDirty` e `DISCARD_CHANGES`.

- Manutenibilidade: 10/10 (campo explicito, impossivel de mal-interpretar)
- Zero DT: 10/10 (resolve todos os 4 bugs de uma vez, sem ambiguidade)
- Arquitetura: 10/10 (estado explicitamente persistido, nao inferido)
- Escalabilidade: 10/10 (coluna independente, nenhuma convencao fragil)
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A introduz uma convencao fragil que qualquer futuro codigo pode quebrar acidentalmente. A Solucao B persiste o estado de forma explicita e inequivoca, eliminando toda possibilidade de inferencia incorreta.

---

## Plano de Execucao

### Fase 1: Schema do Banco de Dados

**SQL Migration**: Adicionar coluna `is_mobile_synced` a tabela `checkouts`

```sql
ALTER TABLE public.checkouts
ADD COLUMN is_mobile_synced BOOLEAN NOT NULL DEFAULT true;
```

### Fase 2: Edge Function `checkout-editor`

**EDITAR** `supabase/functions/checkout-editor/index.ts`:

1. Adicionar `isMobileSynced?: boolean` ao `RequestBody` (linha 42-51)
2. No handler `get-editor-data` (linha 238-264): o checkout ja vem com `is_mobile_synced` via `select(*)`, nao precisa de mudanca no query
3. No handler `update-design` (linha 272-324): salvar `is_mobile_synced` no update quando enviado

### Fase 3: Contexto da State Machine

**EDITAR** `src/pages/checkout-customizer/machines/checkoutEditorMachine.types.ts`:

- Adicionar `originalIsMobileSynced: boolean` ao `CheckoutEditorMachineContext`

### Fase 4: Load Actor

**EDITAR** `src/pages/checkout-customizer/machines/checkoutEditorMachine.actors.ts`:

Substituir inferencia (linhas 111-116):
```typescript
// DE (bug):
const isMobileSynced = !hasMobileComponents;

// PARA (fix):
const isMobileSynced = checkoutAny.is_mobile_synced !== false;
```

A inferencia do `hasMobileComponents` sera removida. O valor vem diretamente do banco.

### Fase 5: Save Actor

**EDITAR** `src/pages/checkout-customizer/machines/checkoutEditorMachine.actors.ts`:

Adicionar `isMobileSynced` ao payload enviado para a edge function (linhas 189-199):
```typescript
{
  action: "update-design",
  checkoutId,
  design: desktopCustomization.design,
  topComponents: desktopCustomization.topComponents,
  bottomComponents: desktopCustomization.bottomComponents,
  mobileTopComponents: isMobileSynced ? [] : mobileCustomization.topComponents,
  mobileBottomComponents: isMobileSynced ? [] : mobileCustomization.bottomComponents,
  isMobileSynced, // NOVO: persistir estado de sync explicitamente
}
```

### Fase 6: State Machine Core

**EDITAR** `src/pages/checkout-customizer/machines/checkoutEditorMachine.ts`:

1. **Initial context** (linha 44): adicionar `originalIsMobileSynced: true`
2. **Load onDone** (linhas 95-109): salvar `originalIsMobileSynced: d.isMobileSynced`
3. **Save onDone** (linhas 319-323): atualizar `originalIsMobileSynced: context.isMobileSynced`
4. **DISCARD_CHANGES** (linhas 294-301): restaurar `isMobileSynced: context.originalIsMobileSynced`

### Fase 7: Guards

**EDITAR** `src/pages/checkout-customizer/machines/checkoutEditorMachine.guards.ts`:

Adicionar verificacao de `isMobileSynced` ao `isDirty`:
```typescript
export function isDirty({ context }): boolean {
  const desktopChanged = customizationChanged(/*...*/);
  const mobileChanged = customizationChanged(/*...*/);
  const syncChanged = context.isMobileSynced !== context.originalIsMobileSynced;
  return desktopChanged || mobileChanged || syncChanged;
}
```

### Fase 8: Edge Function - Salvar o Campo

**EDITAR** `supabase/functions/checkout-editor/index.ts`:

No handler `update-design`, adicionar ao `updates`:
```typescript
if (body.isMobileSynced !== undefined) {
  updates.is_mobile_synced = body.isMobileSynced;
}
```

---

## Arvore de Arquivos

```text
Database:
  checkouts table                    -- ADD COLUMN is_mobile_synced BOOLEAN DEFAULT true

supabase/functions/checkout-editor/
  index.ts                           -- EDITAR (RequestBody + save is_mobile_synced)

src/pages/checkout-customizer/machines/
  checkoutEditorMachine.types.ts     -- EDITAR (add originalIsMobileSynced)
  checkoutEditorMachine.actors.ts    -- EDITAR (load: usar coluna; save: enviar flag)
  checkoutEditorMachine.ts           -- EDITAR (initial ctx, load/save/discard)
  checkoutEditorMachine.guards.ts    -- EDITAR (isDirty inclui syncChanged)
```

## Impacto por Bug

| Bug | Causa | Fix |
|-----|-------|-----|
| Sync reverte apos F5 | `isMobileSynced` inferido de arrays vazios | Coluna `is_mobile_synced` no DB |
| Componente deletado reaparece | Mobile volta a "synced" e copia desktop | Coluna `is_mobile_synced` no DB |
| Sync reverte ao sair/voltar da aba | `isDirty` nao detecta mudanca de sync, REFRESH dispara | `isDirty` inclui `syncChanged` |
| DISCARD nao restaura sync | `isMobileSynced` nao restaurado | `originalIsMobileSynced` + DISCARD fix |

## Checkpoint de Qualidade RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim - persistencia explicita via coluna dedicada |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim |
| Estou escolhendo isso por ser mais rapido? | Nao |
