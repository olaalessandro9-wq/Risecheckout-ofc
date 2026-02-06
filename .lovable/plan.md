

# Fix Arquitetural: Order Bump - Campos Vazios Sobrescritos pelo Produto

## Diagnostico: A Causa Raiz

O bug tem uma causa raiz precisa: **o operador `||` do JavaScript trata `null` e `""` (string vazia) como equivalentes**, mas eles possuem semanticas diferentes no nosso dominio.

### Fluxo do Bug (Ciclo Completo)

```text
1. Usuario abre dialog de edicao
   -> useEffect (linha 122-134) carrega:
      customTitle = editOrderBump.custom_title || product.name
      (se custom_title = null, usa product.name)

2. Usuario APAGA o titulo (campo fica "")
   -> formData.customTitle = ""

3. Usuario clica "Salvar"
   -> handleSave (linha 243):
      custom_title: formData.customTitle?.trim() || null
      "".trim() = "" -> "" || null = null  (BUG: converte vazio intencional para null)

4. Backend armazena null

5. Usuario abre dialog de edicao novamente
   -> useEffect (linha 129):
      customTitle = null || product.name = product.name  (BUG: repopula com nome do produto)
```

### Dois Pontos de Falha

| Local | Linha | Codigo com Bug | Semantica Errada |
|-------|-------|---------------|------------------|
| **Save** | 243-244 | `formData.customTitle?.trim() \|\| null` | Converte `""` (vazio intencional) em `null` |
| **Load** | 129-130 | `editOrderBump.custom_title \|\| product.name` | Trata `null` e `""` como iguais, ambos caem no fallback |

### A Semantica Correta

| Valor no Banco | Significado | Comportamento no Load |
|----------------|-------------|----------------------|
| `null` | Nunca personalizado | Usar nome/descricao do produto como default |
| `""` (string vazia) | Intencionalmente limpo pelo usuario | Manter vazio |
| `"Texto custom"` | Personalizado pelo usuario | Mostrar o texto |

---

## Analise de Solucoes

### Solucao A: Converter `||` para `??` no Load (Half-Fix)

Mudar apenas o load para usar `??` em vez de `||`. O `??` so faz fallback para `null`/`undefined`, nao para `""`.

- Manutenibilidade: 6/10 (corrige o load mas o save ainda converte "" em null)
- Zero DT: 3/10 (save continua com bug - "" nunca chega ao banco)
- Arquitetura: 4/10 (inconsistencia entre save e load)
- Escalabilidade: 5/10
- Seguranca: 10/10
- **NOTA FINAL: 5.2/10**

### Solucao B: Fix Completo - Save envia `""` + Load usa `??`

Corrigir AMBOS os pontos de falha:
1. **Save**: Mudar `|| null` para logica que preserva string vazia
2. **Load**: Mudar `||` para `??` (nullish coalescing)

- Manutenibilidade: 10/10 (semantica correta em ambas direcoes do fluxo)
- Zero DT: 10/10 (zero inconsistencia entre save e load)
- Arquitetura: 10/10 (respeita a diferenca entre null e "" no dominio)
- Escalabilidade: 10/10 (qualquer novo campo segue o mesmo padrao)
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A corrige apenas metade do fluxo - o save continua convertendo "" em null, impedindo que o fix do load funcione. A Solucao B corrige o ciclo completo.

---

## Plano de Execucao

### Arquivo Unico: `src/components/products/order-bump-dialog/hooks/useOrderBumpForm.ts`

**Alteracao 1 - Load (linhas 129-130):** Substituir `||` por `??`

De:
```typescript
customTitle: editOrderBump.custom_title || product.name,
customDescription: editOrderBump.custom_description || product.description || "",
```

Para:
```typescript
customTitle: editOrderBump.custom_title ?? product.name,
customDescription: editOrderBump.custom_description ?? product.description ?? "",
```

Isso garante que:
- `null` (nunca personalizado) -> usa nome do produto (fallback correto)
- `""` (intencionalmente limpo) -> mantém vazio (respeita a intencao do usuario)
- `"Texto custom"` -> mostra o texto

**Alteracao 2 - Save (linhas 243-244):** Preservar string vazia

De:
```typescript
custom_title: formData.customTitle?.trim() || null,
custom_description: formData.customDescription?.trim() || null,
```

Para:
```typescript
custom_title: formData.customTitle !== undefined ? formData.customTitle.trim() : null,
custom_description: formData.customDescription !== undefined ? formData.customDescription.trim() : null,
```

Isso garante que:
- `""` (usuario limpou o campo) -> salva como `""` no banco (nao converte para null)
- `undefined` (campo inexistente) -> salva como `null`
- `"Texto custom"` -> salva trimado normalmente

---

## Arvore de Arquivos

```text
src/
  components/
    products/
      order-bump-dialog/
        hooks/
          useOrderBumpForm.ts     -- EDITAR (2 alteracoes: load + save)
```

## Comportamento Esperado Apos Fix

1. Usuario abre dialog de edicao -> Titulo e Descricao mostram valores do produto (normal)
2. Usuario apaga titulo e descricao -> campos ficam vazios
3. Usuario clica "Salvar" -> salva com campos vazios (envia `""` ao backend)
4. Usuario abre dialog de edicao novamente -> campos permanecem VAZIOS (respeita `""`)

## Checkpoint de Qualidade RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim - corrige ambos os pontos de falha no ciclo |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim |
| Estou escolhendo isso por ser mais rapido? | Nao - e a unica que corrige o ciclo completo |

