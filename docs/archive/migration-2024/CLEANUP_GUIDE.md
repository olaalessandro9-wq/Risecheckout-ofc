# 🧹 Guia de Limpeza - Remover Código Antigo

**Objetivo:** Remover arquivos antigos após validação completa da nova arquitetura

---

## ⚠️ IMPORTANTE: Quando Executar Este Guia

**NÃO execute antes de:**
- ✅ Feature flags ativados em produção por 2+ semanas
- ✅ Nenhum bug crítico reportado
- ✅ Taxa de conversão estável ou melhor
- ✅ Feedback positivo dos usuários
- ✅ Todos os testes do `TESTING_GUIDE.md` passaram

---

## 📋 Passo 1: Verificar Arquivos Não Usados

### 1.1. Executar Script de Verificação

```bash
cd /home/ubuntu/risecheckout-84776
./scripts/check-unused-files.sh
```

### 1.2. Analisar Resultado

**Resultado Esperado:**
```
✅ ProductSettingsPanel.tsx NÃO está sendo importado
✅ SecureCardForm.tsx NÃO está sendo importado
✅ CardForm.tsx (mercadopago) NÃO está sendo importado
✅ Todos os arquivos antigos podem ser removidos!
```

**Se algum arquivo AINDA estiver sendo usado:**
- ❌ **NÃO prossiga com a limpeza**
- Investigue onde o arquivo está sendo usado
- Refatore o código para usar a nova arquitetura
- Execute o script novamente

---

## 🗑️ Passo 2: Remover Arquivos Antigos

### 2.1. Executar Script de Limpeza

```bash
./scripts/cleanup-old-files.sh
```

### 2.2. Confirmar Remoção

O script vai pedir confirmação **duas vezes**:

**Primeira confirmação:**
```
Você confirma que todos os pré-requisitos foram atendidos? (sim/não):
```
Digite: `sim`

**Segunda confirmação:**
```
Confirma a remoção? (REMOVER/cancelar):
```
Digite: `REMOVER` (em maiúsculas)

### 2.3. Arquivos Removidos

O script remove:
1. `src/components/products/ProductSettingsPanel.tsx`
2. `src/components/checkout/shared/SecureCardForm.tsx`
3. `src/integrations/gateways/mercadopago/components/CardForm.tsx`

**Backup automático criado em:** `backups/old-files-YYYYMMDD-HHMMSS/`

---

## 🔄 Passo 3: Renomear Arquivos V2

### 3.1. Renomear ProductSettingsPanelV2

```bash
cd /home/ubuntu/risecheckout-84776

# Renomear arquivo
mv src/components/products/ProductSettingsPanelV2.tsx \
   src/components/products/ProductSettingsPanel.tsx
```

### 3.2. Atualizar Import no ConfiguracoesTab

**Arquivo:** `src/modules/products/tabs/ConfiguracoesTab.tsx`

**Antes:**
```typescript
import ProductSettingsPanel from "@/components/products/ProductSettingsPanel";
import ProductSettingsPanelV2 from "@/components/products/ProductSettingsPanelV2";

export function ConfiguracoesTab() {
  if (FEATURE_FLAGS.USE_NEW_GATEWAY_CONFIG_UI) {
    return <ProductSettingsPanelV2 ... />;
  }
  return <ProductSettingsPanel ... />;
}
```

**Depois:**
```typescript
import ProductSettingsPanel from "@/components/products/ProductSettingsPanel";

export function ConfiguracoesTab() {
  return <ProductSettingsPanel ... />;
}
```

---

## 🧪 Passo 4: Remover Feature Flags

### 4.1. Simplificar ConfiguracoesTab

Já foi feito no passo 3.2 acima.

### 4.2. Simplificar SharedPaymentMethodSelector

**Arquivo:** `src/components/checkout/shared/SharedPaymentMethodSelector.tsx`

**Remover:**
```typescript
import { FEATURE_FLAGS } from '@/config/feature-flags';
import { MercadoPagoCardForm, type CardTokenResult } from '@/lib/payment-gateways';
```

**Remover lógica condicional:**
```typescript
// ANTES
{useNewArchitecture ? (
  <GatewayCardForm ... />
) : (
  <MercadoPagoCardForm ... />
)}

// DEPOIS
<GatewayCardForm ... />
```

### 4.3. Limpar feature-flags.ts

**Arquivo:** `src/config/feature-flags.ts`

**Remover flags desnecessários:**
```typescript
// REMOVER estas flags:
USE_NEW_PAYMENT_ARCHITECTURE: true,
USE_NEW_GATEWAY_CONFIG_UI: true,
```

**Manter apenas:**
```typescript
export const FEATURE_FLAGS = {
  ENABLE_STRIPE_GATEWAY: false,
  ENABLE_PAGSEGURO_GATEWAY: false,
  DEBUG_MODE: isDevelopment,
} as const;
```

---

## ✅ Passo 5: Validar Limpeza

### 5.1. Compilar Projeto

```bash
npm run build
```

**Resultado Esperado:** ✅ Build passa sem erros

### 5.2. Executar Testes

```bash
# Se você tiver testes
npm test
```

### 5.3. Testar em Desenvolvimento

```bash
npm run dev
```

**Testar:**
1. Configuração de gateways
2. Checkout com PIX
3. Checkout com Cartão
4. Nenhum erro no console

---

## 📦 Passo 6: Commitar e Deploy

### 6.1. Verificar Mudanças

```bash
git status
```

### 6.2. Commitar

```bash
git add .
git commit -m "chore: remover código antigo após validação da nova arquitetura

- Remove ProductSettingsPanel.tsx (antigo)
- Remove SecureCardForm.tsx (não usado)
- Remove CardForm.tsx do mercadopago (não usado)
- Renomeia ProductSettingsPanelV2 para ProductSettingsPanel
- Remove feature flags temporários
- Simplifica código

Refs: #ISSUE_NUMBER"
```

### 6.3. Push e Deploy

```bash
git push origin main
```

---

## 🔙 Rollback (Se Necessário)

### Se algo der errado após a limpeza:

**Opção 1: Restaurar Backup**
```bash
# Encontrar o backup mais recente
ls -la backups/

# Restaurar
cp -r backups/old-files-YYYYMMDD-HHMMSS/* .
```

**Opção 2: Reverter Commit**
```bash
git revert HEAD
git push origin main
```

---

## 📊 Checklist Final

### Antes da Limpeza
- [ ] Feature flags ativos em produção por 2+ semanas
- [ ] Nenhum bug crítico reportado
- [ ] Taxa de conversão estável
- [ ] Feedback positivo dos usuários
- [ ] Script `check-unused-files.sh` passou

### Durante a Limpeza
- [ ] Backup criado automaticamente
- [ ] Arquivos antigos removidos
- [ ] ProductSettingsPanelV2 renomeado
- [ ] Imports atualizados
- [ ] Feature flags removidos

### Após a Limpeza
- [ ] Build passa sem erros
- [ ] Testes passam (se houver)
- [ ] Desenvolvimento funciona
- [ ] Configuração de gateways funciona
- [ ] Checkout funciona
- [ ] Nenhum erro no console
- [ ] Commit criado
- [ ] Deploy realizado
- [ ] Monitoramento por 24-48h

---

## 📈 Benefícios da Limpeza

Após a limpeza, você terá:

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Arquivos | 29 | 26 | -10% |
| Linhas de Código | ~3.500 | ~3.200 | -9% |
| Complexidade | Média | Baixa | ✅ |
| Manutenibilidade | Boa | Excelente | ✅ |
| Duplicação | Sim | Não | ✅ |

---

## 🎉 Conclusão

Após completar este guia, você terá:

✅ Código limpo sem duplicações  
✅ Arquitetura simplificada  
✅ Fácil manutenção  
✅ Preparado para novos gateways  

**Parabéns! 🎊**

---

**Data de Criação:** 17/12/2024  
**Última Atualização:** 17/12/2024
