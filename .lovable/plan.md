
# Plano de Correção: Documentação e Comentários do Status "Recusado"

## Diagnóstico

A implementação do status "Recusado" está **100% funcional** no código:
- Tipos TypeScript corretos
- Service mapeando corretamente
- 109 testes passando
- UI renderizando o badge laranja
- Backend atualizando orders para `status: 'refused'`

**Porém**, a documentação e alguns comentários permanecem desatualizados, violando o RISE V3 Protocol Seção 4.2 (Zero Dívida Técnica).

---

## Arquivos a Corrigir

### 1. `src/modules/dashboard/types/dashboard.types.ts`

**Local:** Linhas 101-106

**De:**
```typescript
/**
 * MODELO HOTMART/KIWIFY (padrão de mercado):
 * - Apenas 4 status possíveis
 * - Vendas pendentes NUNCA viram "canceladas"
 * - Expired/Failed/Cancelled = Pendente na UI
 */
```

**Para:**
```typescript
/**
 * MODELO HOTMART/KIWIFY/CAKTO (padrão de mercado):
 * - 5 status possíveis: Pago, Pendente, Recusado, Reembolso, Chargeback
 * - PIX expirado/cancelado → Pendente (vendas não "cancelam")
 * - Cartão recusado → Recusado (status próprio)
 */
```

---

### 2. `docs/STATUS_ATUAL.md`

**Local:** Linhas 144-155

**De:**
```markdown
### Sistema de Status de Pedidos ✅ HOTMART/KIWIFY

| Componente | Status |
|------------|--------|
| 4 Status Canônicos (paid, pending, refunded, chargeback) | ✅ |
| Technical Status para diagnóstico interno | ✅ |
| Campo `expired_at` para rastreamento | ✅ |
| Mapeamento unificado de gateways | ✅ |
| Documentação completa ([ORDER_STATUS_MODEL.md](./ORDER_STATUS_MODEL.md)) | ✅ |

> **Modelo:** Vendas pendentes NUNCA viram "canceladas" na UI - padrão Hotmart/Kiwify.
```

**Para:**
```markdown
### Sistema de Status de Pedidos ✅ HOTMART/KIWIFY/CAKTO

| Componente | Status |
|------------|--------|
| 5 Status Canônicos (paid, pending, refused, refunded, chargeback) | ✅ |
| Status "Recusado" para cartões recusados | ✅ |
| Technical Status para diagnóstico interno | ✅ |
| Campo `expired_at` para rastreamento | ✅ |
| Mapeamento unificado de gateways | ✅ |
| Documentação completa ([ORDER_STATUS_MODEL.md](./ORDER_STATUS_MODEL.md)) | ✅ |

> **Modelo:** PIX expirado → Pendente. Cartão recusado → Recusado. Padrão Cakto.
```

---

### 3. `docs/ORDER_STATUS_MODEL.md` (Reescrita Completa)

Este documento precisa de atualização significativa:

**Alterações principais:**
- Linha 28: Adicionar `'refused'` ao CHECK constraint
- Linha 45: "Apenas **5 status**" em vez de 4
- Nova seção para status "Recusado" (cor laranja)
- Atualizar tabelas de mapeamento:
  - `rejected` → `refused` (não `pending`)
  - `failed` → `refused` (não `pending`)
  - `declined` → `refused` (não `pending`)
- Atualizar tipo TypeScript para incluir `'refused'`
- Atualizar exemplos de código

---

## Conformidade RISE V3 Após Correção

| Critério | Antes | Depois |
|----------|-------|--------|
| Código Core | 10/10 | 10/10 |
| Testes Unitários | 10/10 | 10/10 |
| UI Components | 10/10 | 10/10 |
| Backend | 10/10 | 10/10 |
| Documentação | 7/10 | 10/10 |
| Comentários | 9/10 | 10/10 |
| **TOTAL** | **9.3/10** | **10.0/10** |

---

## Seção Técnica

### Arquivos a Modificar

| Arquivo | Tipo | Alteração |
|---------|------|-----------|
| `src/modules/dashboard/types/dashboard.types.ts` | Comentário | Atualizar de 4→5 status |
| `docs/STATUS_ATUAL.md` | Documentação | Adicionar status "refused" |
| `docs/ORDER_STATUS_MODEL.md` | Documentação | Reescrita para incluir "refused" |

### Validação Pós-Correção

- Zero referências a "4 status canônicos" no código
- Documentação reflete 5 status: paid, pending, refused, refunded, chargeback
- Mapeamento `rejected` → `refused` documentado
- Cor laranja para "Recusado" documentada

### Checkpoint de Qualidade

| Pergunta | Resposta Esperada |
|----------|-------------------|
| Código e docs estão sincronizados? | Sim |
| Existe algum "4 status" remanescente? | Não |
| Status "refused" está em toda documentação? | Sim |
| RISE V3 Score = 10.0? | Sim |
