#!/bin/bash

# Script para remover arquivos antigos após validação
# ⚠️  ATENÇÃO: Este script remove arquivos permanentemente!
# 
# Uso: ./scripts/cleanup-old-files.sh
#
# Pré-requisitos:
# 1. Feature flags ativados em produção por 2+ semanas
# 2. Nenhum bug crítico reportado
# 3. Script check-unused-files.sh executado com sucesso

echo "🗑️  Script de Limpeza de Arquivos Antigos"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Confirmação
echo -e "${YELLOW}⚠️  ATENÇÃO: Este script vai REMOVER arquivos permanentemente!${NC}"
echo ""
echo "Pré-requisitos:"
echo "  1. ✅ Feature flags ativados em produção por 2+ semanas"
echo "  2. ✅ Nenhum bug crítico reportado"
echo "  3. ✅ Script check-unused-files.sh executado"
echo ""
read -p "Você confirma que todos os pré-requisitos foram atendidos? (sim/não): " CONFIRM

if [ "$CONFIRM" != "sim" ]; then
  echo -e "${RED}❌ Operação cancelada${NC}"
  exit 1
fi

echo ""
echo "🔍 Executando verificação final..."
echo ""

# Executar verificação
./scripts/check-unused-files.sh > /tmp/check-result.txt 2>&1

# Verificar se todos os arquivos podem ser removidos
if grep -q "Nenhum arquivo pode ser removido ainda" /tmp/check-result.txt; then
  echo -e "${RED}❌ ERRO: Arquivos ainda estão sendo usados!${NC}"
  echo ""
  cat /tmp/check-result.txt
  exit 1
fi

echo -e "${GREEN}✅ Verificação passou${NC}"
echo ""

# Criar backup
echo "📦 Criando backup..."
BACKUP_DIR="backups/old-files-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Lista de arquivos para remover
FILES_TO_REMOVE=(
  "src/components/products/ProductSettingsPanel.tsx"
  "src/components/checkout/shared/SecureCardForm.tsx"
  "src/integrations/gateways/mercadopago/components/CardForm.tsx"
)

# Fazer backup
echo "Fazendo backup dos arquivos..."
for FILE in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$FILE" ]; then
    BACKUP_PATH="$BACKUP_DIR/$FILE"
    mkdir -p "$(dirname "$BACKUP_PATH")"
    cp "$FILE" "$BACKUP_PATH"
    echo "  ✅ $FILE → $BACKUP_PATH"
  fi
done

echo ""
echo -e "${GREEN}✅ Backup criado em: $BACKUP_DIR${NC}"
echo ""

# Confirmação final
echo -e "${YELLOW}⚠️  ÚLTIMA CONFIRMAÇÃO${NC}"
echo ""
echo "Os seguintes arquivos serão REMOVIDOS:"
for FILE in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$FILE" ]; then
    echo "  🗑️  $FILE"
  fi
done
echo ""
read -p "Confirma a remoção? (REMOVER/cancelar): " FINAL_CONFIRM

if [ "$FINAL_CONFIRM" != "REMOVER" ]; then
  echo -e "${RED}❌ Operação cancelada${NC}"
  exit 1
fi

echo ""
echo "🗑️  Removendo arquivos..."
echo ""

# Remover arquivos
REMOVED_COUNT=0
for FILE in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$FILE" ]; then
    rm "$FILE"
    echo -e "${GREEN}✅ Removido: $FILE${NC}"
    ((REMOVED_COUNT++))
  else
    echo -e "${YELLOW}⚠️  Não encontrado: $FILE${NC}"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ $REMOVED_COUNT arquivo(s) removido(s)${NC}"
echo "📦 Backup salvo em: $BACKUP_DIR"
echo ""
echo "Próximos passos:"
echo "  1. Executar: npm run build"
echo "  2. Testar em desenvolvimento"
echo "  3. Commitar e fazer deploy"
echo ""
echo -e "${YELLOW}⚠️  Se algo der errado, restaure o backup:${NC}"
echo "  cp -r $BACKUP_DIR/* ."
echo ""
