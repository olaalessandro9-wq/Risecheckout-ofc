
# Fix: Limite de Descricao do Produto (500 -> 2000 caracteres)

## Diagnostico: Causa Raiz Encontrada

O problema esta no banco de dados. Existe um CHECK constraint na tabela `products`:

```sql
CHECK (((description IS NULL) OR (char_length(description) <= 500)))
```

Este constraint limita a descricao a 500 caracteres, contradizendo o SSOT do frontend (`PRODUCT_FIELD_LIMITS.DESCRIPTION = 2000`). Quando o texto ultrapassa 500 caracteres, o Supabase retorna o erro PostgreSQL `23514` (check_violation) com a mensagem `"new row for relation 'products' violates check constraint 'products_description_length'"`, que a Edge Function propaga como erro 500.

### Evidencias Coletadas

- **Logs da Edge Function**: Confirmam o erro `23514` no `update-general`
- **PostgreSQL constraint**: `products_description_length` com limite de 500
- **Frontend SSOT**: `PRODUCT_FIELD_LIMITS.DESCRIPTION = 2000` (correto)
- **Edge Function handler**: Nao possui validacao de comprimento para description (confia no banco)

## Analise de Solucoes

### Solucao A: Apenas alterar o constraint no banco

Alterar o CHECK constraint de 500 para 2000 via SQL.

- Manutenibilidade: 7/10 (resolve o problema, mas a Edge Function continua sem validacao propria)
- Zero DT: 6/10 (se o banco rejeitar por outro motivo, o erro 500 generico permanece)
- Arquitetura: 6/10 (camada de validacao ausente no backend)
- Escalabilidade: 7/10
- Seguranca: 8/10
- **NOTA FINAL: 6.6/10**

### Solucao B: Alterar constraint no banco + Adicionar validacao na Edge Function

1. Alterar o CHECK constraint de 500 para 2000
2. Adicionar validacao de comprimento no `handleUpdateGeneral` usando o limite de 2000, retornando erro 400 claro antes de tocar no banco

- Manutenibilidade: 10/10 (validacao em ambas as camadas, mensagem de erro clara)
- Zero DT: 10/10 (erro 400 com mensagem especifica em vez de erro 500 generico)
- Arquitetura: 10/10 (defesa em profundidade: Edge Function valida antes, banco garante integridade)
- Escalabilidade: 10/10 (padrao replicavel para qualquer campo)
- Seguranca: 10/10 (dupla protecao)
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A corrige o sintoma mas mantem a falha arquitetural: a Edge Function nao valida comprimento e delega tudo ao banco, resultando em erros 500 genericos. A Solucao B implementa defesa em profundidade.

---

## Plano de Execucao

### 1. ALTERAR constraint no banco de dados (SQL)

```sql
ALTER TABLE products DROP CONSTRAINT products_description_length;
ALTER TABLE products ADD CONSTRAINT products_description_length 
  CHECK (description IS NULL OR char_length(description) <= 2000);
```

Isso altera o limite de 500 para 2000, alinhando o banco com o SSOT do frontend.

### 2. EDITAR `supabase/functions/_shared/product-settings-handlers.ts` - Validacao no backend

Adicionar validacao de comprimento no `handleUpdateGeneral`, entre as linhas 146-148 (apos o trim da description, antes do bloco de price):

```typescript
if (data.description !== undefined) {
  const desc = typeof data.description === "string" ? data.description.trim() : "";
  if (desc.length > 2000) {
    return errorResponse("Descricao deve ter no maximo 2000 caracteres", corsHeaders, 400);
  }
  updates.description = desc;
}
```

Isso garante que a Edge Function retorne um erro 400 claro com mensagem especifica, em vez de um erro 500 generico do banco.

### 3. Nenhuma alteracao no frontend

O frontend ja esta correto: `PRODUCT_FIELD_LIMITS.DESCRIPTION = 2000` e o `maxLength` no Textarea ja impede digitacao alem de 2000 caracteres. A validacao no backend e puramente defensiva (defesa em profundidade).

---

## Arvore de Arquivos

```text
supabase/
  functions/
    _shared/
      product-settings-handlers.ts    -- EDITAR (adicionar validacao de comprimento)
  
  [SQL Migration]                     -- ALTER constraint de 500 para 2000
```

## Comportamento Esperado Apos Fix

1. Descricao com ate 2000 caracteres: salva normalmente
2. Descricao com mais de 2000 caracteres (se burlar o frontend): Edge Function retorna erro 400 com mensagem clara
3. Banco garante integridade como ultima linha de defesa

## Checkpoint de Qualidade RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim - defesa em profundidade (Edge Function + banco) |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero - elimina divida existente |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim |
| Estou escolhendo isso por ser mais rapido? | Nao |
