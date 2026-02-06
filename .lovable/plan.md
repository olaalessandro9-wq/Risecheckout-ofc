
# Fix: Mensagens de Erro de Cupom Engolidas pelo Frontend

## Diagnostico: Causa Raiz

O backend (`coupon-handler.ts`) retorna erros 400 com mensagens especificas e claras para o usuario:

```text
"Este cupom nao e valido para este produto"
"Cupom invalido ou nao encontrado"
"Este cupom esta inativo"
"Este cupom ainda nao esta ativo"
"Este cupom expirou"
"Este cupom atingiu o limite de usos"
```

Porem, o frontend **descarta** todas essas mensagens e substitui por uma mensagem generica:

```text
"Erro ao validar cupom. Tente novamente."
```

### Rastreamento do Fluxo

```text
1. Backend retorna HTTP 400: {"error": "Este cupom nao e valido para este produto"}

2. api.publicCall() -> parseHttpError(400, body)
   -> Extrai corretamente: ApiError { code: "VALIDATION_ERROR", message: "Este cupom nao e valido para este produto" }
   -> Retorna: { data: null, error: ApiError }

3. validateCouponApi.ts (linha 65-68):
   if (error) {
     return { success: false, error: 'Erro ao validar cupom. Tente novamente.' };  // <-- BUG: ignora error.message
   }

4. Usuario ve: "Erro ao validar cupom. Tente novamente." (inutil)
   Deveria ver: "Este cupom nao e valido para este produto" (util)
```

### Dois Arquivos com o Mesmo Defeito

| Arquivo | Linha | Modo | Mesmo Bug |
|---------|-------|------|-----------|
| `validateCouponApi.ts` | 67 | Controlled (public checkout) | Sim - hardcoded string |
| `useCouponValidation.ts` | 66 | Uncontrolled (editor/preview) | Sim - hardcoded string |

## Analise de Solucoes

### Solucao A: Usar error.message apenas no validateCouponApi

Corrigir apenas o arquivo usado no public checkout (modo controlado).

- Manutenibilidade: 6/10 (corrige um arquivo, ignora o outro com bug identico)
- Zero DT: 5/10 (editor/preview continua com mensagem generica)
- Arquitetura: 5/10 (inconsistencia entre modos)
- Escalabilidade: 5/10
- Seguranca: 10/10
- **NOTA FINAL: 5.8/10**

### Solucao B: Propagar error.message em AMBOS os arquivos

Corrigir a propagacao de mensagens em ambos os caminhos (controlled + uncontrolled), usando `error.message` do backend quando disponivel, com fallback para mensagem generica apenas em erros de rede/timeout.

- Manutenibilidade: 10/10 (consistente em ambos os modos, mensagens uteis em todos os cenarios)
- Zero DT: 10/10 (zero inconsistencia)
- Arquitetura: 10/10 (o backend define as mensagens de validacao, o frontend so exibe)
- Escalabilidade: 10/10 (novas mensagens de erro no backend aparecem automaticamente)
- Seguranca: 10/10 (mensagens de validacao sao seguras para exibir)
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A deixa divida tecnica no hook uncontrolled. A Solucao B corrige o padrao nos dois caminhos.

---

## Plano de Execucao

### 1. EDITAR `src/hooks/checkout/validateCouponApi.ts` - Propagar error.message

**Linha 65-68** - Trocar mensagem hardcoded por `error.message`:

De:
```typescript
if (error) {
  log.error('Edge function error', error);
  return { success: false, error: 'Erro ao validar cupom. Tente novamente.' };
}
```

Para:
```typescript
if (error) {
  log.error('Edge function error', error);
  return { success: false, error: error.message || 'Erro ao validar cupom. Tente novamente.' };
}
```

O `error.message` ja contem a mensagem especifica do backend (ex: "Este cupom nao e valido para este produto") porque `parseHttpError` extrai corretamente do body da resposta 400. O fallback generico so sera usado se por algum motivo o `message` estiver vazio (cenario improvavel).

### 2. EDITAR `src/hooks/checkout/useCouponValidation.ts` - Mesmo fix no modo uncontrolled

**Linha 64-68** - Mesmo padrao:

De:
```typescript
if (error) {
  log.error('Edge function error', error);
  toast.error('Erro ao validar cupom. Tente novamente.');
  return;
}
```

Para:
```typescript
if (error) {
  log.error('Edge function error', error);
  toast.error(error.message || 'Erro ao validar cupom. Tente novamente.');
  return;
}
```

---

## Arvore de Arquivos

```text
src/
  hooks/
    checkout/
      validateCouponApi.ts        -- EDITAR (propagar error.message, linha 67)
      useCouponValidation.ts      -- EDITAR (propagar error.message, linha 66)
```

## Comportamento Esperado Apos Fix

| Cenario do Backend | Mensagem Atual (BUG) | Mensagem Corrigida |
|-------------------|----------------------|-------------------|
| Cupom nao vinculado ao produto | "Erro ao validar cupom. Tente novamente." | "Este cupom nao e valido para este produto" |
| Cupom inexistente | "Erro ao validar cupom. Tente novamente." | "Cupom invalido ou nao encontrado" |
| Cupom inativo | "Erro ao validar cupom. Tente novamente." | "Este cupom esta inativo" |
| Cupom expirado | "Erro ao validar cupom. Tente novamente." | "Este cupom expirou" |
| Limite de usos atingido | "Erro ao validar cupom. Tente novamente." | "Este cupom atingiu o limite de usos" |
| Erro de rede | "Erro ao validar cupom. Tente novamente." | "Erro de conexao com o servidor" |

## Checkpoint de Qualidade RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim - propaga mensagens especificas em ambos os caminhos |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim |
| Estou escolhendo isso por ser mais rapido? | Nao |
