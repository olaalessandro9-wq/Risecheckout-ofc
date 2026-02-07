

# Unificar Botao "Salvar Alteracoes" com "Salvar Produto"

## Diagnostico

No arquivo `src/components/products/ProductSettingsPanel.tsx`:

- **Linhas 170-180**: Existe um `handleSave` local que chama `executeSave()` -- salvando APENAS as configuracoes de checkout (settings, required_fields, gateways).
- **Linhas 216-219**: O botao "Salvar Alteracoes" usa esse handler local.

No `ProductHeader.tsx`:

- **Linha 34**: O botao "Salvar Produto" chama `saveAll` do `ProductContext`, que salva TUDO (geral, imagem, ofertas, upsell, afiliados, checkout settings, etc.) via o Save Registry Pattern.

O usuario quer que o botao inferior faca exatamente a mesma coisa que o botao superior.

## Plano de Execucao

### EDITAR `src/components/products/ProductSettingsPanel.tsx`

1. **Remover** a funcao `handleSave` local (linhas 170-180) -- codigo morto apos a mudanca
2. **Remover** a funcao `executeSave` local (linhas 135-167) -- ja existe no save registry via `useGlobalValidationHandlers`
3. **Remover** o estado `saving` local (linha 47) -- usar o `saving` do ProductContext
4. **Importar** `saveAll`, `saving`, `hasUnsavedChanges` do `useProductContext()`
5. **Atualizar** o botao para:
   - Texto: "Salvar Produto" (em vez de "Salvar Alteracoes")
   - Handler: `saveAll` (em vez de `handleSave`)
   - Disabled: `saving || !hasUnsavedChanges` (mesmo comportamento do header)
   - Icone de loading: `Loader2` com spin quando `saving`

### Resultado no botao

```tsx
// DE:
<Button onClick={handleSave} disabled={saving}>
  {saving ? "Salvando..." : "Salvar Alterações"}
</Button>

// PARA:
<Button onClick={saveAll} disabled={saving || !hasUnsavedChanges}>
  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
  {saving ? "Salvando..." : "Salvar Produto"}
</Button>
```

### Limpeza de codigo morto

Com a remocao de `executeSave` e `handleSave`, tambem serao removidos os imports que se tornam desnecessarios:

- `getGatewayById` e `isGatewayAvailable` (usados apenas no `executeSave`)
- Estado local `saving` (substituido pelo do context)

## Arvore de Arquivos

```text
src/components/products/
  ProductSettingsPanel.tsx   -- EDITAR (remover handler local, usar saveAll do context)
```

Apenas 1 arquivo precisa de alteracao. Nenhum novo arquivo.

## Resultado

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Texto do botao | "Salvar Alteracoes" | "Salvar Produto" |
| Handler | `handleSave` (salva so settings) | `saveAll` (salva tudo) |
| Disabled | Apenas durante saving | Durante saving OU sem alteracoes |
| Loading icon | Sem icone | Loader2 com spin |
| Codigo morto removido | -- | ~50 linhas de `executeSave` + `handleSave` |

