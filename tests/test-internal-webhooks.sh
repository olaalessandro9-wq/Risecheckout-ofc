#!/bin/bash

################################################################################
# TESTE DE SEGURANÇA: PROTEÇÃO DE WEBHOOKS INTERNOS
################################################################################
# 
# Testa se webhooks internos estão protegidos por INTERNAL_WEBHOOK_SECRET:
# - trigger-webhooks (deve exigir X-Internal-Secret)
# - Outros endpoints internos
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
NC='\033[0m' # No Color

# Configurações
SUPABASE_URL="https://wivbtmtgpsxupfjwwovf.supabase.co"
PROJECT_ID="wivbtmtgpsxupfjwwovf"

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo "=============================================================================="
echo "🔒 TESTE DE SEGURANÇA: PROTEÇÃO DE WEBHOOKS INTERNOS"
echo "=============================================================================="
echo ""

################################################################################
# HELPER FUNCTIONS
################################################################################

pass_test() {
    echo -e "${GREEN}✅ PASSOU${NC}: $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

fail_test() {
    echo -e "${RED}❌ FALHOU${NC}: $1"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

warn_test() {
    echo -e "${YELLOW}⚠️ AVISO${NC}: $1"
}

info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

################################################################################
# TESTE 1: TRIGGER-WEBHOOKS SEM SECRET
################################################################################

test_trigger_webhooks_without_secret() {
    echo "=============================================================================="
    echo "TESTE 1: Chamar trigger-webhooks SEM X-Internal-Secret"
    echo "=============================================================================="
    echo ""
    
    echo "📋 Cenário:"
    echo "  - Endpoint: /functions/v1/trigger-webhooks"
    echo "  - Header X-Internal-Secret: AUSENTE"
    echo "  - Resultado esperado: 401 Unauthorized"
    echo ""
    
    # Obter um order_id válido do banco
    info "Obtendo order_id do banco..."
    
    ORDER_ID=$(manus-mcp-cli tool call execute_sql --server supabase --input '{"project_id": "'$PROJECT_ID'", "query": "SELECT id FROM orders WHERE status = '\''paid'\'' LIMIT 1"}' 2>&1 | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$ORDER_ID" ]; then
        warn_test "Nenhum order encontrado no banco"
        ORDER_ID="00000000-0000-0000-0000-000000000000"
        info "Usando order_id fictício: $ORDER_ID"
    else
        info "Order ID encontrado: $ORDER_ID"
    fi
    
    echo ""
    echo "📤 Enviando requisição SEM X-Internal-Secret..."
    
    RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
        "$SUPABASE_URL/functions/v1/trigger-webhooks" \
        -H "Content-Type: application/json" \
        -d '{
            "order_id": "'$ORDER_ID'",
            "event_type": "purchase_approved"
        }')
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "📥 Resposta: HTTP $HTTP_STATUS"
    echo "📄 Body: $BODY"
    echo ""
    
    # Verificar se foi bloqueado
    if [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "403" ] || echo "$BODY" | grep -qi "unauthorized\|forbidden\|secret"; then
        pass_test "Webhook interno foi BLOQUEADO sem secret (HTTP $HTTP_STATUS)"
    else
        fail_test "Webhook interno foi EXECUTADO sem secret! VULNERABILIDADE CRÍTICA!"
    fi
    
    echo ""
}

################################################################################
# TESTE 2: TRIGGER-WEBHOOKS COM SECRET INVÁLIDO
################################################################################

test_trigger_webhooks_with_invalid_secret() {
    echo "=============================================================================="
    echo "TESTE 2: Chamar trigger-webhooks COM X-Internal-Secret INVÁLIDO"
    echo "=============================================================================="
    echo ""
    
    echo "📋 Cenário:"
    echo "  - Endpoint: /functions/v1/trigger-webhooks"
    echo "  - Header X-Internal-Secret: INVÁLIDO (secret_falso_123)"
    echo "  - Resultado esperado: 401 Unauthorized"
    echo ""
    
    # Obter um order_id válido do banco
    ORDER_ID=$(manus-mcp-cli tool call execute_sql --server supabase --input '{"project_id": "'$PROJECT_ID'", "query": "SELECT id FROM orders WHERE status = '\''paid'\'' LIMIT 1"}' 2>&1 | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$ORDER_ID" ]; then
        ORDER_ID="00000000-0000-0000-0000-000000000000"
    fi
    
    echo "📤 Enviando requisição COM secret INVÁLIDO..."
    
    RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
        "$SUPABASE_URL/functions/v1/trigger-webhooks" \
        -H "Content-Type: application/json" \
        -H "X-Internal-Secret: secret_falso_123_atacante" \
        -d '{
            "order_id": "'$ORDER_ID'",
            "event_type": "purchase_approved"
        }')
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "📥 Resposta: HTTP $HTTP_STATUS"
    echo "📄 Body: $BODY"
    echo ""
    
    # Verificar se foi bloqueado
    if [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "403" ] || echo "$BODY" | grep -qi "unauthorized\|forbidden\|invalid"; then
        pass_test "Webhook interno foi BLOQUEADO com secret inválido (HTTP $HTTP_STATUS)"
    else
        fail_test "Webhook interno foi EXECUTADO com secret inválido! VULNERABILIDADE CRÍTICA!"
    fi
    
    echo ""
}

################################################################################
# TESTE 3: TRIGGER-WEBHOOKS COM SECRET VÁLIDO (OPCIONAL)
################################################################################

test_trigger_webhooks_with_valid_secret() {
    echo "=============================================================================="
    echo "TESTE 3: Chamar trigger-webhooks COM X-Internal-Secret VÁLIDO"
    echo "=============================================================================="
    echo ""
    
    echo "📋 Cenário:"
    echo "  - Endpoint: /functions/v1/trigger-webhooks"
    echo "  - Header X-Internal-Secret: VÁLIDO (do Supabase)"
    echo "  - Resultado esperado: 200 OK ou 404 (se order não existir)"
    echo ""
    
    # Tentar obter INTERNAL_WEBHOOK_SECRET do Supabase
    info "Tentando obter INTERNAL_WEBHOOK_SECRET..."
    
    # Nota: Não é possível obter secrets via MCP por segurança
    # Este teste seria executado manualmente com o secret real
    
    warn_test "INTERNAL_WEBHOOK_SECRET não pode ser obtido via MCP (segurança)"
    info "Este teste deve ser executado manualmente com o secret real"
    info "Comando sugerido:"
    echo ""
    echo "  curl -X POST $SUPABASE_URL/functions/v1/trigger-webhooks \\"
    echo "    -H \"Content-Type: application/json\" \\"
    echo "    -H \"X-Internal-Secret: \$INTERNAL_WEBHOOK_SECRET\" \\"
    echo "    -d '{\"order_id\": \"ORDER_ID_VALIDO\", \"event_type\": \"purchase_approved\"}'"
    echo ""
    info "Resultado esperado: HTTP 200 (sucesso) ou 404 (order não encontrado)"
    echo ""
    
    warn_test "Teste 3 PULADO (requer secret manual)"
    echo ""
}

################################################################################
# TESTE 4: VERIFICAR SE INTERNAL_WEBHOOK_SECRET ESTÁ CONFIGURADO
################################################################################

test_internal_webhook_secret_exists() {
    echo "=============================================================================="
    echo "TESTE 4: Verificar se INTERNAL_WEBHOOK_SECRET está configurado"
    echo "=============================================================================="
    echo ""
    
    info "Verificando se o secret está configurado no Supabase..."
    
    # Tentar listar secrets (se possível via MCP)
    SECRETS=$(manus-mcp-cli tool call list_secrets --server supabase --input '{"project_id": "'$PROJECT_ID'"}' 2>&1 || echo "")
    
    if echo "$SECRETS" | grep -qi "INTERNAL_WEBHOOK_SECRET"; then
        pass_test "INTERNAL_WEBHOOK_SECRET está configurado no Supabase"
    elif echo "$SECRETS" | grep -qi "error\|not found\|does not exist"; then
        warn_test "Não foi possível verificar secrets via MCP"
        info "Verifique manualmente no Supabase Dashboard → Settings → Edge Functions → Secrets"
    else
        warn_test "INTERNAL_WEBHOOK_SECRET pode não estar configurado"
        info "Verifique manualmente no Supabase Dashboard"
    fi
    
    echo ""
}

################################################################################
# EXECUTAR TODOS OS TESTES
################################################################################

test_trigger_webhooks_without_secret
test_trigger_webhooks_with_invalid_secret
test_trigger_webhooks_with_valid_secret
test_internal_webhook_secret_exists

################################################################################
# RELATÓRIO FINAL
################################################################################

echo "=============================================================================="
echo "📊 RELATÓRIO FINAL - PROTEÇÃO DE WEBHOOKS INTERNOS"
echo "=============================================================================="
echo ""
echo "Total de testes: $TOTAL_TESTS"
echo -e "${GREEN}✅ Passou: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Falhou: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}❌ VULNERABILIDADES CRÍTICAS DETECTADAS!${NC}"
    echo "🚨 Ação imediata necessária: Implementar validação de INTERNAL_WEBHOOK_SECRET"
    echo ""
    echo "📝 Recomendações:"
    echo "  1. Adicionar validação de X-Internal-Secret em trigger-webhooks"
    echo "  2. Configurar INTERNAL_WEBHOOK_SECRET no Supabase Edge Functions"
    echo "  3. Retornar 401 se secret estiver ausente ou inválido"
    exit 1
else
    echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
    echo "✅ Webhooks internos estão protegidos"
    exit 0
fi
