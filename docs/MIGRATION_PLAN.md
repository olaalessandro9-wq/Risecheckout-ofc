# 🚀 Plano de Migração para Produção

## 📋 Visão Geral

Este documento descreve o plano completo para migrar a nova arquitetura multi-gateway para produção e remover o código antigo de forma segura.

---

## 🎯 Objetivos

1. Ativar a nova arquitetura multi-gateway em produção
2. Validar funcionamento com usuários reais
3. Remover código antigo após período de estabilização
4. Adicionar novos gateways (Stripe, PagSeguro, etc.)

---

## 📊 Estado Atual

### Feature Flags Implementados

| Flag | Descrição | Dev | Prod |
|------|-----------|-----|------|
| `USE_NEW_PAYMENT_ARCHITECTURE` | Nova arquitetura de pagamento | ✅ ON | ❌ OFF |
| `USE_NEW_GATEWAY_CONFIG_UI` | Nova UI de configuração | ✅ ON | ❌ OFF |
| `ENABLE_STRIPE_GATEWAY` | Habilitar Stripe | ❌ OFF | ❌ OFF |
| `ENABLE_PAGSEGURO_GATEWAY` | Habilitar PagSeguro | ❌ OFF | ❌ OFF |

### Arquivos Novos Criados

```
src/config/
├── feature-flags.ts           # Sistema de feature flags
├── payment-gateways.ts        # Registry centralizado
└── index.ts                   # Barrel export

src/components/products/
├── GatewaySelector.tsx        # Seletor dinâmico de gateway
└── ProductSettingsPanelV2.tsx # Painel de configurações refatorado

src/components/checkout/payment/
├── GatewayCardForm.tsx        # Formulário multi-gateway
├── CreditCardForm.tsx         # Wrapper universal
├── fields/shared/             # Campos compartilhados (80%)
├── fields/gateways/           # Campos específicos (20%)
└── hooks/                     # Hooks gateway-agnostic
```

### Arquivos Modificados

```
src/modules/products/tabs/ConfiguracoesTab.tsx
  → Adicionado feature flag para usar V2

src/components/checkout/shared/SharedPaymentMethodSelector.tsx
  → Adicionado feature flag para usar GatewayCardForm
```

---

## 🗓️ Cronograma de Migração

### Semana 1: Testes Internos

**Objetivo:** Validar nova arquitetura em ambiente de desenvolvimento

**Tarefas:**
- [ ] Testar fluxo completo de checkout com Mercado Pago
- [ ] Testar configuração de gateways no painel do produto
- [ ] Testar com cartões de teste
- [ ] Verificar tracking (Facebook, Google Ads, etc.)
- [ ] Testar em diferentes navegadores (Chrome, Firefox, Safari)
- [ ] Testar em dispositivos móveis

**Cartões de Teste Mercado Pago:**
```
Mastercard: 5031 4332 1540 6351
Visa: 4235 6477 2802 5682
CVV: 123
Validade: 11/25
```

### Semana 2: Beta Testing

**Objetivo:** Validar com grupo seleto de usuários

**Tarefas:**
- [ ] Selecionar 5-10 vendedores para beta
- [ ] Ativar feature flags apenas para esses usuários
- [ ] Monitorar logs e erros
- [ ] Coletar feedback
- [ ] Corrigir bugs encontrados

**Como Ativar para Usuários Específicos:**
```typescript
// Em feature-flags.ts, adicionar lógica condicional:
const BETA_USERS = ['user-id-1', 'user-id-2'];

export const FEATURE_FLAGS = {
  USE_NEW_PAYMENT_ARCHITECTURE: 
    isDevelopment || BETA_USERS.includes(getCurrentUserId()),
  // ...
};
```

### Semana 3: Rollout Gradual

**Objetivo:** Ativar para todos os usuários de forma gradual

**Dia 1-2: 10% dos usuários**
```typescript
USE_NEW_PAYMENT_ARCHITECTURE: Math.random() < 0.1,
```

**Dia 3-4: 50% dos usuários**
```typescript
USE_NEW_PAYMENT_ARCHITECTURE: Math.random() < 0.5,
```

**Dia 5-7: 100% dos usuários**
```typescript
USE_NEW_PAYMENT_ARCHITECTURE: true,
```

**Monitoramento:**
- Taxa de conversão
- Erros no checkout
- Tempo de carregamento
- Feedback de usuários

### Semana 4: Estabilização

**Objetivo:** Garantir estabilidade antes de remover código antigo

**Tarefas:**
- [ ] Monitorar métricas por 7 dias
- [ ] Resolver bugs restantes
- [ ] Documentar lições aprendidas
- [ ] Preparar remoção de código antigo

### Semana 5: Limpeza

**Objetivo:** Remover código antigo

**Tarefas:**
- [ ] Remover feature flags (hardcode para true)
- [ ] Remover componentes antigos
- [ ] Remover imports não utilizados
- [ ] Atualizar documentação

---

## 🗑️ Plano de Remoção do Código Antigo

### Fase 1: Remover Feature Flags

**Arquivo:** `src/config/feature-flags.ts`

```typescript
// ANTES
USE_NEW_PAYMENT_ARCHITECTURE: isDevelopment ? true : false,
USE_NEW_GATEWAY_CONFIG_UI: isDevelopment ? true : false,

// DEPOIS
USE_NEW_PAYMENT_ARCHITECTURE: true, // Sempre ativo
USE_NEW_GATEWAY_CONFIG_UI: true,    // Sempre ativo
```

### Fase 2: Simplificar ConfiguracoesTab

**Arquivo:** `src/modules/products/tabs/ConfiguracoesTab.tsx`

```typescript
// ANTES
import ProductSettingsPanel from "@/components/products/ProductSettingsPanel";
import ProductSettingsPanelV2 from "@/components/products/ProductSettingsPanelV2";

export function ConfiguracoesTab() {
  if (FEATURE_FLAGS.USE_NEW_GATEWAY_CONFIG_UI) {
    return <ProductSettingsPanelV2 ... />;
  }
  return <ProductSettingsPanel ... />;
}

// DEPOIS
import ProductSettingsPanel from "@/components/products/ProductSettingsPanelV2";

export function ConfiguracoesTab() {
  return <ProductSettingsPanel ... />;
}
```

### Fase 3: Simplificar SharedPaymentMethodSelector

**Arquivo:** `src/components/checkout/shared/SharedPaymentMethodSelector.tsx`

```typescript
// ANTES
import { MercadoPagoCardForm } from '@/lib/payment-gateways';
import { GatewayCardForm } from '@/components/checkout/payment/GatewayCardForm';

{useNewArchitecture ? (
  <GatewayCardForm ... />
) : (
  <MercadoPagoCardForm ... />
)}

// DEPOIS
import { GatewayCardForm } from '@/components/checkout/payment/GatewayCardForm';

<GatewayCardForm ... />
```

### Fase 4: Remover Arquivos Antigos

**Arquivos a Remover:**

```bash
# Painel de configurações antigo
rm src/components/products/ProductSettingsPanel.tsx

# Componentes antigos do Mercado Pago (se não mais usados)
# Verificar se MercadoPagoCardForm ainda é usado pelo GatewayCardForm
# Se sim, manter. Se não, remover.
```

### Fase 5: Renomear Arquivos V2

```bash
# Renomear V2 para versão principal
mv src/components/products/ProductSettingsPanelV2.tsx \
   src/components/products/ProductSettingsPanel.tsx
```

### Fase 6: Atualizar Imports

Buscar e substituir em todo o projeto:

```bash
# Buscar imports antigos
grep -r "ProductSettingsPanel" src/ --include="*.tsx"

# Atualizar imports
```

### Fase 7: Limpar Feature Flags

Após estabilização completa, simplificar `feature-flags.ts`:

```typescript
// Remover flags que não são mais necessários
export const FEATURE_FLAGS = {
  ENABLE_STRIPE_GATEWAY: false,      // Manter para controle de novos gateways
  ENABLE_PAGSEGURO_GATEWAY: false,   // Manter para controle de novos gateways
  DEBUG_MODE: isDevelopment,          // Manter para debug
};
```

---

## ✅ Checklist de Validação

### Antes de Ativar em Produção

- [ ] Todos os testes passando
- [ ] Fluxo de checkout completo funciona
- [ ] Configuração de gateways funciona
- [ ] Tracking funciona (Facebook, Google Ads, etc.)
- [ ] Nenhum erro no console
- [ ] Performance aceitável
- [ ] Mobile funciona corretamente

### Antes de Remover Código Antigo

- [ ] Nova arquitetura estável por 2+ semanas
- [ ] Nenhum bug crítico reportado
- [ ] Taxa de conversão estável ou melhor
- [ ] Feedback positivo dos usuários
- [ ] Backup do código antigo (branch)

### Após Remover Código Antigo

- [ ] Build passa sem erros
- [ ] Testes passam
- [ ] Deploy bem-sucedido
- [ ] Monitoramento por 24-48h
- [ ] Documentação atualizada

---

## 🔄 Rollback

### Se Algo Der Errado em Produção

**Opção 1: Desativar Feature Flag**
```typescript
// Em feature-flags.ts
USE_NEW_PAYMENT_ARCHITECTURE: false,
USE_NEW_GATEWAY_CONFIG_UI: false,
```

**Opção 2: Reverter Commit**
```bash
git revert HEAD
git push
```

**Opção 3: Deploy de Versão Anterior**
```bash
git checkout <commit-anterior>
git push --force
```

### Após Remover Código Antigo

Se precisar de rollback após remover código antigo:

```bash
# Criar branch de backup antes de remover
git checkout -b backup/old-payment-architecture
git push origin backup/old-payment-architecture

# Para restaurar
git checkout backup/old-payment-architecture
git checkout -b hotfix/restore-old-architecture
git push origin hotfix/restore-old-architecture
```

---

## 📊 Métricas de Sucesso

### KPIs a Monitorar

| Métrica | Baseline | Meta | Alerta |
|---------|----------|------|--------|
| Taxa de Conversão | X% | ≥ X% | < X-2% |
| Erros no Checkout | Y/dia | ≤ Y/dia | > Y*2/dia |
| Tempo de Carregamento | Zs | ≤ Zs | > Z*1.5s |
| Abandono de Carrinho | W% | ≤ W% | > W+5% |

### Ferramentas de Monitoramento

- **Logs:** Supabase Logs, Browser Console
- **Erros:** Sentry (se configurado)
- **Analytics:** Google Analytics, Facebook Pixel
- **Uptime:** UptimeRobot (se configurado)

---

## 📞 Suporte

### Contatos de Emergência

- **Desenvolvedor Principal:** [Nome]
- **DevOps:** [Nome]
- **Suporte:** [Email]

### Procedimento de Emergência

1. Identificar o problema
2. Avaliar impacto
3. Decidir: rollback ou hotfix
4. Comunicar equipe
5. Executar ação
6. Monitorar
7. Post-mortem

---

## 📝 Changelog

### v1.0.0 (2024-12-17)
- Criação do plano de migração
- Definição de cronograma
- Checklist de validação
- Plano de rollback

---

**Desenvolvido com ❤️ seguindo o Rise Architect Protocol**
