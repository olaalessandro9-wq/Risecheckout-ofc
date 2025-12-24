# Relatório de Diagnóstico e Plano de Ação - Refatoração de Gateways

**Data:** 29 de Novembro de 2025  
**Analista:** Manus AI  
**Projeto:** RiseCheckout - Finalização da Refatoração Modular  
**Status:** 📋 Aguardando Aprovação para Implementação

---

## 📊 1. Contexto Recebido

Recebi o contexto completo da refatoração em andamento, que consiste em migrar todas as integrações externas do RiseCheckout para uma **Arquitetura Modular baseada em Feature Folders** dentro de `src/integrations/`.

### Padrão Arquitetural Estabelecido

```
src/integrations/{categoria}/{servico}/
├── index.ts          # Barrel export (interface pública)
├── types.ts          # Interfaces TypeScript
├── hooks.ts          # React hooks customizados
├── events.ts         # Lógica de eventos/API
├── components/       # Componentes React (opcional)
└── README.md         # Documentação completa
```

### Progresso Atual

| Categoria | Status | Progresso |
|:---|:---:|:---|
| **Tracking** (Facebook, UTMify, Google, TikTok, Kwai) | ✅ Completo | 100% |
| **Gateways - Mercado Pago** | ⚠️ Parcial | 50% |
| **Gateways - PushinPay** | ❌ Pendente | 0% |

---

## 🔍 2. Diagnóstico Detalhado

### 2.1. Tracking Integrations (✅ 100% Completo)

**Status:** Não requer ação. Todas as 5 integrações foram migradas com sucesso.

**Estrutura:**
```
src/integrations/tracking/
├── facebook/      ✅ Completo
├── utmify/        ✅ Completo
├── google-ads/    ✅ Completo
├── tiktok/        ✅ Completo
└── kwai/          ✅ Completo
```

**Uso no Código:**
```typescript
// src/pages/PublicCheckout.tsx
import * as Facebook from "@/integrations/tracking/facebook";
import * as UTMify from "@/integrations/tracking/utmify";
// etc...
```

**Conclusão:** Serve como **template perfeito** para os gateways.

---

### 2.2. Mercado Pago Gateway (⚠️ 50% Completo)

**Status:** Estrutura criada, mas migração incompleta. **Código antigo ainda em uso.**

#### ✅ O que está pronto:

**Estrutura Nova:**
```
src/integrations/gateways/mercadopago/
├── index.ts       ✅ Barrel export
├── types.ts       ✅ Interfaces TypeScript
├── api.ts         ✅ Funções de API
├── hooks.ts       ✅ React hooks
├── Brick.tsx      ✅ Componente (Brick Builder API)
└── README.md      ✅ Documentação completa
```

**Uso Parcial:**
```typescript
// src/pages/PublicCheckout.tsx (linha 41)
import * as MercadoPago from "@/integrations/gateways/mercadopago";
// ✅ PublicCheckout já usa o módulo novo
```

#### ❌ O que está incompleto:

**Arquivos Antigos Ainda em Uso:**

1. **`src/hooks/useMercadoPagoBrick.ts`** (200 linhas)
   - Hook complexo com gambiarras (polling de foco, stale closures)
   - Usado por: `src/components/payment/CustomCardForm.tsx`

2. **`src/components/payment/CustomCardForm.tsx`** (200+ linhas)
   - Formulário de cartão customizado
   - Usado por: `src/components/checkout/PaymentSection.tsx`
   - **Importa o hook antigo:**
     ```typescript
     import { useMercadoPagoBrick } from "@/hooks/useMercadoPagoBrick";
     ```

**Fluxo Atual (Problemático):**
```
PublicCheckout.tsx
    ├─> MercadoPago (NOVO) ✅
    └─> PaymentSection.tsx
            └─> CustomCardForm.tsx
                    └─> useMercadoPagoBrick.ts (ANTIGO) ❌
```

#### 🔍 Análise Comparativa: Brick.tsx vs CustomCardForm.tsx

Realizei uma análise detalhada (documento: `COMPARACAO_BRICK_CUSTOMCARD.md`) e identifiquei **gaps críticos**:

| Funcionalidade | Brick.tsx (Novo) | CustomCardForm.tsx (Antigo) |
|:---|:---:|:---:|
| Renderiza formulário | ✅ | ✅ |
| Validação granular | ⚠️ SDK nativo | ✅ Manual + SDK |
| Campos customizados (Nome, CPF) | ❌ | ✅ |
| Ref para submit externo | ❌ | ✅ **CRÍTICO** |
| Seleção de parcelas | ⚠️ SDK nativo | ✅ Manual |

**Conclusão:** O `Brick.tsx` novo **não pode substituir** diretamente o `CustomCardForm.tsx` porque:
1. Não expõe ref para submit externo (usado pelo `PaymentSection`)
2. Não permite adicionar campos customizados (Nome do titular, CPF)
3. Menos controle sobre parcelas e validação

---

### 2.3. PushinPay Gateway (❌ 0% Completo)

**Status:** Não iniciado. Código antigo ainda em uso.

**Arquivos Atuais:**
```
src/services/pushinpay.ts              # Lógica de API
src/components/pix/PushinPayLegal.tsx  # Componente de termos legais
src/components/pix/QRCanvas.tsx        # Componente de QR Code
```

**Estrutura Proposta:**
```
src/integrations/gateways/pushinpay/
├── index.ts          # Barrel export
├── types.ts          # Interfaces (PIX, QR Code)
├── api.ts            # Funções de API (criar PIX, consultar status)
├── hooks.ts          # usePushinPayConfig, usePushinPayPix
├── components/
│   ├── PixPayment.tsx    # Componente principal
│   ├── QRCode.tsx        # QR Code canvas
│   └── Legal.tsx         # Termos legais
└── README.md         # Documentação
```

---

## 🎯 3. Plano de Ação Proposto

### Fase 1: Finalizar Mercado Pago (Prioridade Alta)

#### Opção Recomendada: Migração Incremental

**Ação:** Mover `CustomCardForm.tsx` e `useMercadoPagoBrick.ts` para dentro do módulo `gateways/mercadopago/`.

**Justificativa:**
- ✅ **Pragmático:** Não quebra funcionalidade existente
- ✅ **Rápido:** 30-45 minutos de trabalho
- ✅ **Organiza:** Alinha com arquitetura modular
- ✅ **Futuro:** Permite refatoração posterior sem pressa

**Passos Detalhados:**

1. **Criar pasta de componentes:**
   ```bash
   mkdir -p src/integrations/gateways/mercadopago/components/
   ```

2. **Mover CustomCardForm.tsx:**
   ```bash
   mv src/components/payment/CustomCardForm.tsx \
      src/integrations/gateways/mercadopago/components/CardForm.tsx
   ```

3. **Integrar useMercadoPagoBrick no hooks.ts:**
   - Copiar conteúdo de `src/hooks/useMercadoPagoBrick.ts`
   - Adicionar ao final de `gateways/mercadopago/hooks.ts`
   - Manter export existente

4. **Atualizar index.ts:**
   ```typescript
   // src/integrations/gateways/mercadopago/index.ts
   
   // Tipos
   export * from "./types";
   
   // API
   export * from "./api";
   
   // Hooks
   export * from "./hooks";
   
   // Componentes
   export { Brick } from "./Brick";
   export { CardForm } from "./components/CardForm";  // ← NOVO
   ```

5. **Atualizar imports em PaymentSection.tsx:**
   ```typescript
   // ANTES:
   import { CustomCardForm, CustomCardFormRef } from "@/components/payment/CustomCardForm";
   
   // DEPOIS:
   import * as MercadoPago from "@/integrations/gateways/mercadopago";
   // Usar: <MercadoPago.CardForm ref={...} />
   ```

6. **Remover arquivos antigos:**
   ```bash
   rm src/hooks/useMercadoPagoBrick.ts
   rm src/components/payment/CustomCardForm.tsx
   ```

7. **Atualizar README.md:**
   - Documentar `CardForm` vs `Brick`
   - Explicar quando usar cada um

**Tempo Estimado:** 30-45 minutos

**Risco:** 🟢 Baixo (apenas movimentação de arquivos, sem reescrita)

---

### Fase 2: Refatorar PushinPay (Prioridade Média)

**Ação:** Criar estrutura modular completa para PushinPay seguindo o padrão estabelecido.

**Passos Detalhados:**

1. **Criar estrutura de pastas:**
   ```bash
   mkdir -p src/integrations/gateways/pushinpay/components/
   ```

2. **Criar types.ts:**
   ```typescript
   // Interfaces para PIX, QR Code, Transações, etc.
   export interface PushinPayConfig { ... }
   export interface PixTransaction { ... }
   export interface QRCodeData { ... }
   ```

3. **Migrar API (api.ts):**
   - Mover lógica de `src/services/pushinpay.ts`
   - Funções: `createPixTransaction()`, `getTransactionStatus()`, etc.

4. **Criar hooks (hooks.ts):**
   ```typescript
   export function usePushinPayConfig(vendorId?: string) { ... }
   export function usePushinPayPix(orderId: string) { ... }
   export function usePushinPayAvailable(integration: any) { ... }
   ```

5. **Migrar componentes:**
   - `PushinPayLegal.tsx` → `components/Legal.tsx`
   - `QRCanvas.tsx` → `components/QRCode.tsx`
   - Criar `components/PixPayment.tsx` (componente principal)

6. **Criar barrel export (index.ts):**
   ```typescript
   export * from "./types";
   export * from "./api";
   export * from "./hooks";
   export { PixPayment } from "./components/PixPayment";
   export { QRCode } from "./components/QRCode";
   export { Legal } from "./components/Legal";
   ```

7. **Criar README.md:**
   - Documentar uso, configuração, fluxo PIX
   - Exemplos de código

8. **Atualizar imports no PublicCheckout.tsx:**
   ```typescript
   import * as PushinPay from "@/integrations/gateways/pushinpay";
   ```

9. **Remover arquivos antigos:**
   ```bash
   rm src/services/pushinpay.ts
   rm src/components/pix/PushinPayLegal.tsx
   # QRCanvas pode ser mantido se usado por outros
   ```

**Tempo Estimado:** 2-3 horas

**Risco:** 🟡 Médio (requer testes do fluxo PIX completo)

---

### Fase 3: Limpeza Geral (Prioridade Baixa)

**Ação:** Remover arquivos obsoletos e backups.

**Arquivos a Remover:**

```bash
# Backups do Mercado Pago
src/components/payment/CustomCardForm.tsx.backup-*
src/hooks/useMercadoPagoBrick.ts.backup-*

# Componentes obsoletos
src/components/financeiro/MercadoPagoConfig.tsx  # (se não usado)
src/components/payment/CreditCardBrick.tsx       # (verificar duplicação)

# Libs antigas de tracking (se não usadas)
src/lib/facebook-pixel-helpers.ts
src/lib/facebook-conversions-api.ts
src/lib/utmify-helper.ts

# Pasta de integrações antiga (se vazia)
src/components/integrations/
```

**Checklist de Validação:**
- [ ] Buscar imports de cada arquivo antes de remover
- [ ] Executar `grep -rn "nome_do_arquivo" src/` para confirmar
- [ ] Remover apenas se nenhum import ativo for encontrado

**Tempo Estimado:** 30 minutos

**Risco:** 🟢 Baixo (apenas remoção de arquivos não usados)

---

## 📋 4. Resumo Executivo

### O que entendi:

1. **Arquitetura Modular:** Migração para Feature Folders em `src/integrations/`
2. **Tracking:** 100% completo, serve como template
3. **Mercado Pago:** Estrutura criada, mas código antigo ainda em uso (migração incompleta)
4. **PushinPay:** Não iniciado, precisa ser criado do zero

### Problemas Identificados:

1. **Mercado Pago:** `CustomCardForm.tsx` usa hook antigo fora do módulo
2. **Brick.tsx:** Não pode substituir `CustomCardForm` diretamente (gaps críticos)
3. **PushinPay:** Código legado espalhado em múltiplos arquivos

### Solução Proposta:

1. **Mercado Pago:** Migração incremental (mover arquivos para o módulo)
2. **PushinPay:** Criar estrutura completa seguindo o padrão
3. **Limpeza:** Remover arquivos obsoletos e backups

### Tempo Total Estimado:

- Mercado Pago: 30-45 min
- PushinPay: 2-3 horas
- Limpeza: 30 min
- **Total: 3-4 horas**

### Riscos:

| Fase | Risco | Mitigação |
|:---|:---:|:---|
| Mercado Pago | 🟢 Baixo | Apenas movimentação, sem reescrita |
| PushinPay | 🟡 Médio | Testes completos do fluxo PIX |
| Limpeza | 🟢 Baixo | Validar imports antes de remover |

---

## ✅ 5. Checklist de Validação

Antes de começar a implementação, validar:

- [ ] O plano está alinhado com a visão da outra IA?
- [ ] A abordagem incremental para Mercado Pago é aceitável?
- [ ] A estrutura proposta para PushinPay está correta?
- [ ] Há algum arquivo crítico que não deve ser removido?
- [ ] Há alguma funcionalidade adicional que precisa ser considerada?

---

## 🚀 6. Próximos Passos

Após aprovação deste relatório:

1. ✅ Validar plano com Gemini
2. ⏳ Executar Fase 1 (Mercado Pago)
3. ⏳ Testar fluxo de pagamento com cartão
4. ⏳ Executar Fase 2 (PushinPay)
5. ⏳ Testar fluxo de pagamento PIX
6. ⏳ Executar Fase 3 (Limpeza)
7. ⏳ Gerar relatório final de conclusão

---

## 📝 7. Observações Importantes

### Sobre o Brick.tsx

O componente `Brick.tsx` foi criado usando a **Brick Builder API** do Mercado Pago, que é uma API de alto nível (mais simples, mas menos flexível).

O `CustomCardForm.tsx` usa a **Card Form API**, que é de baixo nível (mais complexa, mas com controle total).

**Decisão:** Manter ambos no módulo:
- `Brick.tsx`: Para casos simples no futuro
- `CardForm.tsx`: Para o checkout atual (controle total)

### Sobre Configurações de Gateway

As chaves de API (secrets) estão armazenadas em:
- **Tabela:** `vendor_integrations` (Supabase)
- **Campo:** `config` (JSONB)
- **Tipo:** `integration_type = 'MERCADOPAGO_GATEWAY'` ou `'PUSHINPAY_GATEWAY'`

Os hooks (`useMercadoPagoConfig`, `usePushinPayConfig`) buscam essas configurações baseadas no `vendor_id`.

### Sobre Testes

Após cada fase, é essencial testar:
- **Mercado Pago:** Fluxo completo de pagamento com cartão
- **PushinPay:** Fluxo completo de pagamento PIX
- **Ambos:** Validar que o pedido é criado corretamente no banco

---

## 📞 8. Perguntas para o Gemini

1. O plano de migração incremental para Mercado Pago está correto?
2. A estrutura proposta para PushinPay está alinhada com o padrão?
3. Há algum arquivo ou funcionalidade que não foi considerado?
4. Alguma recomendação adicional antes de começar a implementação?

---

**Status:** 📋 Aguardando aprovação para iniciar implementação.
