
# Plano de Correção Final: Comentários Legados - RISE V3 10.0/10

## Diagnóstico

A implementação do status "Recusado" está **100% funcional**, com 109 testes passando e UI correta. Porém, existem **2 comentários desatualizados** que violam a regra de Zero Dívida Técnica do RISE Protocol V3.

## Análise de Soluções (RISE Protocol V3 Seção 4.4)

### Solução A: Corrigir Todos os Comentários Legados

Atualizar os comentários que ainda mencionam comportamento antigo (`failed` → `pending`).

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | Comentários documentam comportamento real |
| Zero DT | 10/10 | Elimina inconsistência código/comentário |
| Arquitetura | 10/10 | Documentação precisa |
| Escalabilidade | 10/10 | Base sólida para futuro |
| Segurança | 10/10 | Não afeta segurança |

- **NOTA FINAL: 10.0/10**
- Tempo estimado: 10 minutos

### Solução B: Deixar Como Está

Ignorar os comentários desatualizados.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 6/10 | Comentários mentem sobre o código |
| Zero DT | 5/10 | Dívida técnica explícita |
| Arquitetura | 7/10 | Funciona, mas confunde |
| Escalabilidade | 7/10 | Problemas futuros |
| Segurança | 10/10 | Não afeta segurança |

- **NOTA FINAL: 6.8/10**
- Tempo estimado: 0 minutos

### DECISÃO: Solução A (Nota 10.0/10)

Comentários que mentem sobre o comportamento do código são dívida técnica. O RISE Protocol V3 proíbe explicitamente deixar inconsistências "para depois".

---

## Arquivos a Corrigir

### 1. `src/lib/order-status/service.ts` (Linha 8)

**De:**
```typescript
* PADRÃO DE MERCADO: Uma venda pendente NUNCA vira "cancelada".
* Status expired, cancelled, failed do gateway = 'pending' na UI.
```

**Para:**
```typescript
* PADRÃO DE MERCADO: Uma venda pendente NUNCA vira "cancelada".
* Status expired, cancelled do gateway = 'pending' na UI.
* Status failed, rejected, declined do gateway = 'refused' (cartão recusado).
```

### 2. `src/lib/order-status/types.ts` (Linhas 21-29)

**De:**
```typescript
/**
 * Canonical order statuses stored in the database
 * 
 * MODELO DE MERCADO (Hotmart/Kiwify):
 * - pending: Aguardando pagamento (PIX gerado, boleto emitido)
 * - paid: Pagamento confirmado
 * - refunded: Reembolso efetuado
 * - chargeback: Contestação no cartão
 * 
 * NOTA: 'cancelled' e 'failed' foram REMOVIDOS.
 * Vendas expiradas/canceladas pelo gateway continuam como 'pending'.
 * O campo 'technical_status' guarda o status técnico real para relatórios.
 */
```

**Para:**
```typescript
/**
 * Canonical order statuses stored in the database
 * 
 * MODELO DE MERCADO (Hotmart/Kiwify/Cakto):
 * - paid: Pagamento confirmado
 * - pending: Aguardando pagamento (PIX gerado, boleto emitido)
 * - refused: Cartão recusado (CVV inválido, limite, etc)
 * - refunded: Reembolso efetuado
 * - chargeback: Contestação no cartão
 * 
 * NOTA: 'cancelled' foi REMOVIDO (PIX expirado → pending).
 * 'failed/rejected' agora mapeia para 'refused' (cartão recusado).
 * O campo 'technical_status' guarda o status técnico real para relatórios.
 */
```

---

## Validação Pós-Correção

| Verificação | Critério |
|-------------|----------|
| Comentário service.ts | Menciona `failed → refused` |
| Comentário types.ts | Lista 5 status, menciona `refused` |
| Testes passando | 109 testes (sem alteração) |
| Código funcional | Sem alteração (apenas comentários) |

---

## Conformidade RISE V3 Final

| Critério | Antes | Depois |
|----------|-------|--------|
| Código Core | 10/10 | 10/10 |
| Testes Unitários | 10/10 | 10/10 |
| UI Components | 10/10 | 10/10 |
| Backend | 10/10 | 10/10 |
| Documentação | 10/10 | 10/10 |
| Comentários em Código | 9.5/10 | 10/10 |
| **TOTAL** | **9.8/10** | **10.0/10** |

---

## Resumo das Correções

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/lib/order-status/service.ts` | 8 | Adicionar `failed → refused` no comentário |
| `src/lib/order-status/types.ts` | 21-29 | Atualizar lista de status e nota sobre `failed` |

---

## Seção Técnica

### Checkpoint de Qualidade RISE V3

| Pergunta | Resposta Após Correção |
|----------|------------------------|
| Código e comentários estão sincronizados? | Sim |
| Existe algum comentário mentindo sobre o código? | Não |
| Status "refused" está em toda documentação? | Sim |
| RISE V3 Score = 10.0? | Sim |

### Nota sobre CHANGELOG.md

A referência a "4 status" na linha 348 do CHANGELOG é **histórica** (versão 3.2.0 de Janeiro). Não deve ser alterada pois documenta o que foi feito naquela versão. O CHANGELOG 3.6.2 já documenta corretamente a adição do 5º status.
