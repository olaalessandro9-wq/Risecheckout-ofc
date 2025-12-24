# 🗑️ Arquivos para Remoção Futura

Este documento lista os arquivos que podem ser removidos após a validação da nova arquitetura em produção.

**IMPORTANTE:** Só remova estes arquivos após:
1. ✅ Feature flags ativados em produção por 2+ semanas
2. ✅ Nenhum bug crítico reportado
3. ✅ Taxa de conversão estável

---

## Arquivos Confirmados para Remoção

### 1. ProductSettingsPanel.tsx (Versão Antiga)

**Caminho:** `src/components/products/ProductSettingsPanel.tsx`

**Motivo:** Substituído por `ProductSettingsPanelV2.tsx`

**Verificação:**
```bash
# Verificar se ainda está sendo importado
grep -r "ProductSettingsPanel" src --include="*.tsx" | grep -v "V2"
```

**Ação:**
```bash
rm src/components/products/ProductSettingsPanel.tsx
```

---

### 2. SecureCardForm.tsx (Não Usado)

**Caminho:** `src/components/checkout/shared/SecureCardForm.tsx`

**Motivo:** Não está sendo importado em nenhum lugar

**Verificação:**
```bash
# Verificar se está sendo importado
grep -r "SecureCardForm" src --include="*.tsx" --include="*.ts" | grep -v "SecureCardForm.tsx"
```

**Ação:**
```bash
rm src/components/checkout/shared/SecureCardForm.tsx
```

---

### 3. CardForm.tsx (Mercado Pago Antigo)

**Caminho:** `src/integrations/gateways/mercadopago/components/CardForm.tsx`

**Motivo:** Não está sendo importado em nenhum lugar

**Verificação:**
```bash
# Verificar se está sendo importado
grep -r "integrations/gateways/mercadopago/components/CardForm" src --include="*.tsx" --include="*.ts"
```

**Ação:**
```bash
rm src/integrations/gateways/mercadopago/components/CardForm.tsx
```

---

## Arquivos para Verificar

### 4. useCreditCardValidation.ts

**Caminho:** `src/hooks/useCreditCardValidation.ts`

**Status:** Verificar se está sendo usado pela nova arquitetura

**Verificação:**
```bash
grep -r "useCreditCardValidation" src --include="*.tsx" --include="*.ts"
```

---

## Checklist de Remoção

- [ ] Verificar que feature flags estão ativos em produção
- [ ] Aguardar 2 semanas de estabilidade
- [ ] Executar verificações de cada arquivo
- [ ] Remover arquivos não utilizados
- [ ] Executar `npm run build` para confirmar
- [ ] Commitar e fazer deploy
- [ ] Monitorar por 24-48h

---

## Comandos de Verificação

```bash
# Verificar todos os arquivos de uma vez
cd /home/ubuntu/risecheckout-84776

echo "=== ProductSettingsPanel (antigo) ==="
grep -r "ProductSettingsPanel" src --include="*.tsx" | grep -v "V2" | grep -v "ProductSettingsPanel.tsx"

echo ""
echo "=== SecureCardForm ==="
grep -r "SecureCardForm" src --include="*.tsx" --include="*.ts" | grep -v "SecureCardForm.tsx"

echo ""
echo "=== CardForm (mercadopago) ==="
grep -r "integrations/gateways/mercadopago/components/CardForm" src --include="*.tsx" --include="*.ts"

echo ""
echo "=== useCreditCardValidation ==="
grep -r "useCreditCardValidation" src --include="*.tsx" --include="*.ts" | grep -v "useCreditCardValidation.ts"
```

---

**Data de Criação:** 17/12/2024
**Última Atualização:** 17/12/2024
