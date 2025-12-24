#!/bin/bash

################################################################################
# SCRIPT MASTER: EXECUTAR TODOS OS TESTES DE SEGURANÇA
################################################################################
# 
# Executa todos os testes de segurança do RiseCheckout:
# 1. Manipulação de dados (offer/bump/cupom)
# 2. IDOR expandido (orders, payments, integrations)
# 3. Proteção de webhooks internos
# 4. Storage ownership
#
# Autor: Manus AI
# Data: 14/12/2025
################################################################################

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Diretório dos testes
TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Arquivo de log
LOG_FILE="/tmp/risecheckout-security-tests-$(date +%Y%m%d_%H%M%S).log"

# Contadores globais
TOTAL_SUITES=4
PASSED_SUITES=0
FAILED_SUITES=0

echo -e "${CYAN}${BOLD}"
echo "=============================================================================="
echo "🔒 RISECHECKOUT - SUITE COMPLETA DE TESTES DE SEGURANÇA"
echo "=============================================================================="
echo -e "${NC}"
echo ""
echo "📅 Data: $(date '+%d/%m/%Y %H:%M:%S')"
echo "📂 Diretório: $TESTS_DIR"
echo "📄 Log: $LOG_FILE"
echo ""
echo -e "${YELLOW}⚠️  ATENÇÃO: Estes testes verificam vulnerabilidades de segurança críticas${NC}"
echo -e "${YELLOW}   Certifique-se de executar em ambiente de desenvolvimento/teste${NC}"
echo ""
echo "=============================================================================="
echo ""

# Função para executar um teste
run_test_suite() {
    local test_name=$1
    local test_script=$2
    
    echo -e "${CYAN}${BOLD}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🧪 EXECUTANDO: $test_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${NC}"
    echo ""
    
    # Executar teste e capturar saída
    if bash "$test_script" 2>&1 | tee -a "$LOG_FILE"; then
        echo ""
        echo -e "${GREEN}✅ SUITE PASSOU: $test_name${NC}"
        ((PASSED_SUITES++))
    else
        echo ""
        echo -e "${RED}❌ SUITE FALHOU: $test_name${NC}"
        ((FAILED_SUITES++))
    fi
    
    echo ""
    echo ""
}

################################################################################
# EXECUTAR TODOS OS TESTES
################################################################################

echo -e "${BLUE}ℹ️  Iniciando execução de $TOTAL_SUITES suites de testes...${NC}"
echo ""
sleep 2

# Teste 1: Manipulação de Dados
run_test_suite \
    "Manipulação de Dados (Offer/Bump/Cupom)" \
    "$TESTS_DIR/test-data-manipulation.sh"

# Teste 2: IDOR Expandido
run_test_suite \
    "IDOR Expandido (Orders/Payments/Integrations)" \
    "$TESTS_DIR/test-idor-expanded.sh"

# Teste 3: Webhooks Internos
run_test_suite \
    "Proteção de Webhooks Internos" \
    "$TESTS_DIR/test-internal-webhooks.sh"

# Teste 4: Storage Ownership
run_test_suite \
    "Storage Ownership" \
    "$TESTS_DIR/test-storage-ownership.sh"

################################################################################
# RELATÓRIO FINAL
################################################################################

echo -e "${CYAN}${BOLD}"
echo "=============================================================================="
echo "📊 RELATÓRIO FINAL - SUITE COMPLETA DE TESTES DE SEGURANÇA"
echo "=============================================================================="
echo -e "${NC}"
echo ""
echo "📅 Data: $(date '+%d/%m/%Y %H:%M:%S')"
echo "📄 Log completo: $LOG_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total de suites: $TOTAL_SUITES"
echo -e "${GREEN}✅ Suites que passaram: $PASSED_SUITES${NC}"
echo -e "${RED}❌ Suites que falharam: $FAILED_SUITES${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $FAILED_SUITES -gt 0 ]; then
    echo -e "${RED}${BOLD}❌ VULNERABILIDADES CRÍTICAS DETECTADAS!${NC}"
    echo ""
    echo -e "${YELLOW}🚨 AÇÃO IMEDIATA NECESSÁRIA:${NC}"
    echo ""
    echo "1. Revise o log completo em: $LOG_FILE"
    echo "2. Identifique as vulnerabilidades específicas"
    echo "3. Implemente correções conforme recomendações"
    echo "4. Re-execute os testes para validar correções"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${YELLOW}📝 PRÓXIMOS PASSOS:${NC}"
    echo ""
    echo "• Manipulação de Dados: Implementar validações server-side"
    echo "• IDOR: Revisar e corrigir políticas RLS"
    echo "• Webhooks: Implementar validação de INTERNAL_WEBHOOK_SECRET"
    echo "• Storage: Configurar políticas de ownership em buckets"
    echo ""
    exit 1
else
    echo -e "${GREEN}${BOLD}🎉 PARABÉNS! TODOS OS TESTES PASSARAM!${NC}"
    echo ""
    echo -e "${GREEN}✅ Sistema está protegido contra:${NC}"
    echo ""
    echo "  ✓ Manipulação de preços, offers, bumps e cupons"
    echo "  ✓ IDOR em orders, payments e integrações"
    echo "  ✓ Acesso não autorizado a webhooks internos"
    echo "  ✓ Acesso não autorizado a arquivos no storage"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${BLUE}ℹ️  Nível de Segurança: ${GREEN}${BOLD}ALTO${NC}"
    echo ""
    echo -e "${YELLOW}📝 Recomendações para manutenção:${NC}"
    echo ""
    echo "  • Execute estes testes regularmente (ex: semanalmente)"
    echo "  • Re-execute após mudanças em Edge Functions ou RLS policies"
    echo "  • Monitore logs de segurança no Supabase Dashboard"
    echo "  • Mantenha secrets rotacionados periodicamente"
    echo ""
    exit 0
fi
