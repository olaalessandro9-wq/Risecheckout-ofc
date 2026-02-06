

# Validacao de Limites: Order Bump Title (100) e Description (300)

## Diagnostico

Os campos `customTitle` e `customDescription` no dialog de Order Bump nao possuem NENHUMA validacao de comprimento. O usuario pode digitar texto ilimitado e o backend aceita sem restricoes. Isso precisa ser corrigido com validacao no frontend que:

1. NAO mostra contador de caracteres durante digitacao
2. Mostra erro (borda vermelha + mensagem) SOMENTE ao tentar salvar com texto acima do limite
3. Bloqueia o save ate que o texto esteja dentro do limite

## Analise de Solucoes

### Solucao A: Validacao inline no handleSave (sem SSOT)

Adicionar checks hardcoded (100 e 300) diretamente no `handleSave` dentro de `useOrderBumpForm.ts`.

- Manutenibilidade: 6/10 (limites hardcoded duplicados, nao usam SSOT)
- Zero DT: 6/10 (se mudar limite, precisa atualizar em multiplos locais)
- Arquitetura: 5/10 (ignora o SSOT existente em `field-limits.ts`)
- Escalabilidade: 6/10
- Seguranca: 10/10
- **NOTA FINAL: 6.3/10**

### Solucao B: SSOT em field-limits.ts + Estado de Erro Reativo + Validacao no Save

1. Adicionar constantes `ORDER_BUMP_FIELD_LIMITS` ao SSOT existente (`field-limits.ts`)
2. Adicionar estado de erros de validacao no `useOrderBumpForm`
3. Validar no `handleSave` usando constantes SSOT
4. Propagar erros para `OrderBumpFormFields` que mostra borda vermelha + mensagem
5. Limpar erros quando o usuario corrige o texto

- Manutenibilidade: 10/10 (limites centralizados, padrao consistente)
- Zero DT: 10/10 (SSOT unico, zero duplicacao)
- Arquitetura: 10/10 (segue padrao existente de field-limits, Single Responsibility)
- Escalabilidade: 10/10 (adicionar novos campos e trivial)
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A duplica limites que ja possuem um SSOT definido no projeto. A Solucao B alinha com o padrao arquitetural existente.

---

## Plano de Execucao

### 1. EDITAR `src/lib/constants/field-limits.ts` - Adicionar ORDER_BUMP_FIELD_LIMITS

Adicionar novo bloco de constantes seguindo o padrao existente:

```typescript
export const ORDER_BUMP_FIELD_LIMITS = {
  /** Titulo customizado do order bump: ate 100 caracteres */
  CUSTOM_TITLE: 100,
  /** Descricao customizada do order bump: ate 300 caracteres */
  CUSTOM_DESCRIPTION: 300,
} as const;
```

### 2. EDITAR `src/components/products/order-bump-dialog/hooks/useOrderBumpForm.ts` - Adicionar validacao no handleSave

- Importar `ORDER_BUMP_FIELD_LIMITS` do SSOT
- Adicionar estado `validationErrors` (objeto com campos que falharam)
- Exportar `validationErrors` e `clearFieldError` 
- No `handleSave`, antes de chamar a API, validar comprimento de `customTitle` e `customDescription`
- Se invalido, popular `validationErrors` e retornar sem salvar
- Quando o usuario edita um campo com erro, limpar o erro daquele campo

### 3. EDITAR `src/components/products/order-bump-dialog/OrderBumpFormFields.tsx` - Mostrar estado de erro

- Receber `validationErrors` como prop
- Nos campos Title e Description, aplicar `border-destructive` quando houver erro
- Mostrar mensagem de erro abaixo do campo (ex: "Titulo deve ter no maximo 100 caracteres")
- Manter o helper text original quando nao houver erro

### 4. EDITAR `src/components/products/order-bump-dialog/index.tsx` - Passar validationErrors

- Passar `validationErrors` e `clearFieldError` do hook para o `OrderBumpFormFields`

---

## Arvore de Arquivos

```text
src/
  lib/
    constants/
      field-limits.ts                                      -- EDITAR (adicionar ORDER_BUMP_FIELD_LIMITS)
  components/
    products/
      order-bump-dialog/
        hooks/
          useOrderBumpForm.ts                              -- EDITAR (adicionar validacao + estado de erro)
        OrderBumpFormFields.tsx                             -- EDITAR (mostrar estado de erro visual)
        index.tsx                                          -- EDITAR (passar validationErrors como prop)
```

## Comportamento Esperado

1. Usuario digita texto livremente nos campos Title e Description (sem contador visivel)
2. Ao clicar "Salvar":
   - Se Title > 100 chars: borda vermelha + mensagem "O titulo deve ter no maximo 100 caracteres. Atual: X"
   - Se Description > 300 chars: borda vermelha + mensagem "A descricao deve ter no maximo 300 caracteres. Atual: X"
   - O save e bloqueado ate que ambos estejam dentro do limite
3. Quando o usuario edita o campo e fica dentro do limite, o erro desaparece automaticamente

## Checkpoint de Qualidade RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim - usa SSOT existente, zero duplicacao |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim |
| Estou escolhendo isso por ser mais rapido? | Nao |

