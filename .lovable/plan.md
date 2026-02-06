

# Header do Checkout Builder: Adicionar Sync/Copy + Reorganizar Layout

## Problema Atual

O header do `CheckoutCustomizer.tsx` tem os botoes Desktop/Mobile no lado **direito** junto com Preview e Salvar. Faltam as opcoes de "Sincronizar com Desktop" e "Copiar do Desktop" que ja existem no Builder da Area de Membros. A infraestrutura (XState machine + hook) ja suporta essas acoes -- falta apenas a UI.

## Referencia: BuilderHeader da Area de Membros

O `BuilderHeader.tsx` da Area de Membros tem o layout exato que o user deseja:

- **Esquerda**: Botao Voltar + Titulo
- **Centro**: Toggle Desktop/Mobile + Opcoes de Sync (quando mobile ativo)
- **Direita**: Preview + Salvar

As opcoes de sync sao:
1. **Sincronizado/Independente** - Botao toggle com icone Link/Unlink (so aparece quando mobile esta ativo)
2. **Copiar Desktop** - Botao com icone Copy (so aparece quando mobile esta ativo E sync esta desativado)

## O Que Ja Existe (Infra Pronta)

O hook `useCheckoutEditorState` ja expoe:
- `isMobileSynced` - estado de sincronizacao
- `copyDesktopToMobile()` - copia componentes desktop para mobile
- `setMobileSynced(boolean)` - ativa/desativa sincronizacao

A state machine (`checkoutEditorMachine.ts`) ja processa os eventos `COPY_DESKTOP_TO_MOBILE` e `SET_MOBILE_SYNCED`.

**Zero logica nova necessaria.** Apenas UI.

## Plano de Execucao

### Arquivo unico a editar: `src/pages/CheckoutCustomizer.tsx`

**Mudancas no header (linhas 33-68):**

1. **Reorganizar layout em 3 zonas** (espelhando BuilderHeader):
   - **Esquerda**: Botao Voltar + Separador + Titulo + Separador + Toggle Desktop/Mobile
   - **Centro**: Opcoes de Sync/Copy (condicionais ao viewport mobile)
   - **Direita**: Preview + Salvar

2. **Adicionar imports**: `Copy, Link, Unlink, Loader2`, `Separator`, `Tooltip/TooltipContent/TooltipTrigger/TooltipProvider`

3. **Adicionar bloco condicional** (so quando `editor.activeViewport === 'mobile'`):
   - Botao Sincronizado/Independente com icone Link/Unlink
   - Botao "Copiar Desktop" (so quando `isMobileSynced === false`)
   - Ambos com Tooltip explicativo

4. **Contadores de componentes** nos botoes Desktop/Mobile:
   - Desktop mostra `(N)` com numero de top+bottom components
   - Mobile mostra `(N)` com numero de top+bottom components

### Detalhes visuais (identicos ao BuilderHeader)

| Elemento | Quando aparece | Icone | Texto |
|----------|---------------|-------|-------|
| Sincronizado | Mobile ativo + sync ON | Link (cor primary) | "Sincronizado" |
| Independente | Mobile ativo + sync OFF | Unlink (cor muted) | "Independente" |
| Copiar Desktop | Mobile ativo + sync OFF | Copy | "Copiar Desktop" |

### Nenhum outro arquivo precisa de alteracao

- A state machine ja suporta os eventos
- O hook ja expoe as acoes
- Os tipos ja existem
- Nenhuma edge function nova necessaria

## Arvore de Arquivos

```text
src/pages/CheckoutCustomizer.tsx    -- EDITAR (reorganizar header + adicionar sync/copy UI)
```

## Comportamento Esperado

| Cenario | Resultado |
|---------|-----------|
| Viewport = Desktop | Botao Desktop ativo, opcoes sync/copy ocultas |
| Viewport = Mobile + Sync ON | Botao "Sincronizado" visivel com icone Link |
| Viewport = Mobile + Sync OFF | Botao "Independente" + botao "Copiar Desktop" visiveis |
| Clicar "Sincronizado" | Desativa sync, mobile fica independente |
| Clicar "Independente" | Ativa sync, mobile espelha desktop |
| Clicar "Copiar Desktop" | Copia componentes do desktop para mobile (one-time) |

