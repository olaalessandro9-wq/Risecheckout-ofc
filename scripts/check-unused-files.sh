#!/bin/bash

# Script para verificar arquivos não usados antes de remover
# Uso: ./scripts/check-unused-files.sh

echo "🔍 Verificando arquivos não usados..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador
UNUSED_COUNT=0

# ============================================
# 1. ProductSettingsPanel (antigo)
# ============================================
echo "📄 Verificando ProductSettingsPanel.tsx (antigo)..."
RESULT=$(grep -r "from.*ProductSettingsPanel\"" src --include="*.tsx" --include="*.ts" | grep -v "ProductSettingsPanelV2" | grep -v "ProductSettingsPanel.tsx")

if [ -z "$RESULT" ]; then
  echo -e "${GREEN}✅ ProductSettingsPanel.tsx NÃO está sendo importado${NC}"
  echo "   → Seguro para remover"
  ((UNUSED_COUNT++))
else
  echo -e "${RED}❌ ProductSettingsPanel.tsx AINDA está sendo usado:${NC}"
  echo "$RESULT"
  echo "   → NÃO remover ainda"
fi
echo ""

# ============================================
# 2. SecureCardForm
# ============================================
echo "📄 Verificando SecureCardForm.tsx..."
RESULT=$(grep -r "from.*SecureCardForm" src --include="*.tsx" --include="*.ts" | grep -v "SecureCardForm.tsx")

if [ -z "$RESULT" ]; then
  echo -e "${GREEN}✅ SecureCardForm.tsx NÃO está sendo importado${NC}"
  echo "   → Seguro para remover"
  ((UNUSED_COUNT++))
else
  echo -e "${RED}❌ SecureCardForm.tsx AINDA está sendo usado:${NC}"
  echo "$RESULT"
  echo "   → NÃO remover ainda"
fi
echo ""

# ============================================
# 3. CardForm (mercadopago)
# ============================================
echo "📄 Verificando CardForm.tsx (mercadopago)..."
RESULT=$(grep -r "integrations/gateways/mercadopago/components/CardForm" src --include="*.tsx" --include="*.ts")

if [ -z "$RESULT" ]; then
  echo -e "${GREEN}✅ CardForm.tsx (mercadopago) NÃO está sendo importado${NC}"
  echo "   → Seguro para remover"
  ((UNUSED_COUNT++))
else
  echo -e "${RED}❌ CardForm.tsx (mercadopago) AINDA está sendo usado:${NC}"
  echo "$RESULT"
  echo "   → NÃO remover ainda"
fi
echo ""

# ============================================
# 4. useCreditCardValidation
# ============================================
echo "📄 Verificando useCreditCardValidation.ts..."
RESULT=$(grep -r "from.*useCreditCardValidation" src --include="*.tsx" --include="*.ts" | grep -v "useCreditCardValidation.ts")

if [ -z "$RESULT" ]; then
  echo -e "${YELLOW}⚠️  useCreditCardValidation.ts NÃO está sendo importado${NC}"
  echo "   → Verificar se é necessário antes de remover"
  ((UNUSED_COUNT++))
else
  echo -e "${GREEN}✅ useCreditCardValidation.ts ESTÁ sendo usado:${NC}"
  echo "$RESULT"
  echo "   → Manter"
fi
echo ""

# ============================================
# RESUMO
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $UNUSED_COUNT -eq 4 ]; then
  echo -e "${GREEN}✅ Todos os arquivos antigos podem ser removidos!${NC}"
  echo ""
  echo "Execute o script de limpeza:"
  echo "  ./scripts/cleanup-old-files.sh"
elif [ $UNUSED_COUNT -gt 0 ]; then
  echo -e "${YELLOW}⚠️  $UNUSED_COUNT arquivo(s) podem ser removidos${NC}"
  echo ""
  echo "Revise os resultados acima antes de prosseguir."
else
  echo -e "${RED}❌ Nenhum arquivo pode ser removido ainda${NC}"
  echo ""
  echo "Os arquivos antigos ainda estão sendo usados."
  echo "Aguarde a validação da nova arquitetura."
fi
echo ""
