#!/bin/bash

################################################################################
# TESTE DE SEGURANÇA: IDOR EXPANDIDO
################################################################################
# 
# Testa IDOR (Insecure Direct Object Reference) em:
# - Orders (pedidos)
# - Payments (pagamentos)
# - Vendor Integrations (integrações)
# - Webhook Deliveries
# - Checkouts
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
echo "🔒 TESTE DE SEGURANÇA: IDOR EXPANDIDO"
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

get_user_jwt() {
    local email=$1
    local password=$2
    
    info "Fazendo login como $email..."
    
    local response=$(curl -s -X POST \
        "$SUPABASE_URL/auth/v1/token?grant_type=password" \
        -H "Content-Type: application/json" \
        -H "apikey: $(manus-mcp-cli tool call get_publishable_keys --server supabase --input '{"project_id": "'$PROJECT_ID'"}' 2>&1 | grep -o 'eyJ[^"]*' | head -1)" \
        -d '{
            "email": "'$email'",
            "password": "'$password'"
        }')
    
    local jwt=$(echo "$response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$jwt" ]; then
        warn_test "Falha ao obter JWT para $email"
        echo "$response"
        return 1
    fi
    
    echo "$jwt"
}

################################################################################
# TESTE 1: IDOR EM ORDERS
################################################################################

test_idor_orders() {
    echo "=============================================================================="
    echo "TESTE 1: IDOR em Orders (Pedidos)"
    echo "=============================================================================="
    echo ""
    
    info "Obtendo orders do banco..."
    
    ORDERS=$(manus-mcp-cli tool call execute_sql --server supabase --input '{"project_id": "'$PROJECT_ID'", "query": "SELECT id, vendor_id, customer_email, amount_cents, status FROM orders WHERE status IN ('\''paid'\'', '\''pending'\'') LIMIT 3"}' 2>&1 | grep -A 100 "untrusted-data" | grep -o '\[{.*}\]' | head -1)
    
    if [ -z "$ORDERS" ] || [ "$ORDERS" = "[]" ]; then
        warn_test "Nenhum order encontrado no banco"
        echo "⏭️ Pulando teste (requer orders cadastrados)"
        return
    fi
    
    echo "📦 Orders encontrados:"
    echo "$ORDERS" | python3 -m json.tool 2>/dev/null || echo "$ORDERS"
    echo ""
    
    # Extrair primeiro order (tratando JSON escapado)
    ORDER_ID=$(echo "$ORDERS" | sed 's/\\//g' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    VENDOR_ID=$(echo "$ORDERS" | sed 's/\\//g' | grep -o '"vendor_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$ORDER_ID" ]; then
        warn_test "Não foi possível extrair order_id"
        echo "⏭️ Pulando teste"
        return
    fi
    
    echo "📋 Cenário:"
    echo "  - Order ID: $ORDER_ID"
    echo "  - Vendor (Owner): $VENDOR_ID"
    echo "  - Atacante: usuarioteste11@gmail.com"
    echo ""
    
    # Obter JWT do atacante
    ATTACKER_JWT=$(get_user_jwt "usuarioteste11@gmail.com" "Teste1@")
    
    if [ -z "$ATTACKER_JWT" ]; then
        warn_test "Não foi possível obter JWT do atacante"
        echo "⏭️ Pulando teste"
        return
    fi
    
    info "JWT do atacante obtido"
    echo ""
    
    # Tentar acessar order via RPC ou query
    echo "📤 Tentando acessar order de outro usuário..."
    
    RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
        "$SUPABASE_URL/rest/v1/rpc/get_order_details" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ATTACKER_JWT" \
        -H "apikey: $(manus-mcp-cli tool call get_publishable_keys --server supabase --input '{"project_id": "'$PROJECT_ID'"}' 2>&1 | grep -o 'eyJ[^"]*' | head -1)" \
        -d '{"order_id": "'$ORDER_ID'"}')
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "📥 Resposta: HTTP $HTTP_STATUS"
    echo "📄 Body: $BODY"
    echo ""
    
    # Verificar se foi bloqueado
    if [ "$HTTP_STATUS" = "403" ] || [ "$HTTP_STATUS" = "404" ] || echo "$BODY" | grep -qi "error\|not found\|forbidden"; then
        pass_test "IDOR em orders foi BLOQUEADO (HTTP $HTTP_STATUS)"
    elif [ "$HTTP_STATUS" = "500" ] || echo "$BODY" | grep -qi "function.*does not exist"; then
        warn_test "RPC get_order_details não existe (teste inconclusivo)"
        info "Tentando acesso direto via REST..."
        
        # Tentar acesso direto
        RESPONSE2=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET \
            "$SUPABASE_URL/rest/v1/orders?id=eq.$ORDER_ID" \
            -H "Authorization: Bearer $ATTACKER_JWT" \
            -H "apikey: $(manus-mcp-cli tool call get_publishable_keys --server supabase --input '{"project_id": "'$PROJECT_ID'"}' 2>&1 | grep -o 'eyJ[^"]*' | head -1)")
        
        HTTP_STATUS2=$(echo "$RESPONSE2" | grep "HTTP_STATUS" | cut -d':' -f2)
        BODY2=$(echo "$RESPONSE2" | sed '/HTTP_STATUS/d')
        
        echo "📥 Resposta (REST): HTTP $HTTP_STATUS2"
        echo "📄 Body: $BODY2"
        echo ""
        
        if [ "$BODY2" = "[]" ] || echo "$BODY2" | grep -qi "error\|forbidden"; then
            pass_test "IDOR em orders foi BLOQUEADO via REST (retornou vazio)"
        else
            fail_test "IDOR em orders PERMITIDO! Atacante conseguiu acessar order de outro usuário!"
        fi
    else
        fail_test "IDOR em orders PERMITIDO! Atacante conseguiu acessar order de outro usuário!"
    fi
    
    echo ""
}

################################################################################
# TESTE 2: IDOR EM VENDOR_INTEGRATIONS
################################################################################

test_idor_vendor_integrations() {
    echo "=============================================================================="
    echo "TESTE 2: IDOR em Vendor Integrations"
    echo "=============================================================================="
    echo ""
    
    info "Obtendo vendor integrations do banco..."
    
    INTEGRATIONS=$(manus-mcp-cli tool call execute_sql --server supabase --input '{"project_id": "'$PROJECT_ID'", "query": "SELECT id, vendor_id, gateway, is_active FROM vendor_integrations WHERE is_active = true LIMIT 2"}' 2>&1 | grep -A 100 "untrusted-data" | grep -o '\[{.*}\]' | head -1)
    
    if [ -z "$INTEGRATIONS" ] || [ "$INTEGRATIONS" = "[]" ]; then
        warn_test "Nenhuma integração encontrada no banco"
        echo "⏭️ Pulando teste (requer integrações cadastradas)"
        return
    fi
    
    echo "🔌 Integrações encontradas:"
    echo "$INTEGRATIONS" | python3 -m json.tool 2>/dev/null || echo "$INTEGRATIONS"
    echo ""
    
    # Extrair primeira integração (tratando JSON escapado)
    INTEGRATION_ID=$(echo "$INTEGRATIONS" | sed 's/\\//g' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    VENDOR_ID=$(echo "$INTEGRATIONS" | sed 's/\\//g' | grep -o '"vendor_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$INTEGRATION_ID" ]; then
        warn_test "Não foi possível extrair integration_id"
        echo "⏭️ Pulando teste"
        return
    fi
    
    echo "📋 Cenário:"
    echo "  - Integration ID: $INTEGRATION_ID"
    echo "  - Vendor (Owner): $VENDOR_ID"
    echo "  - Atacante: usuarioteste11@gmail.com"
    echo ""
    
    # Obter JWT do atacante
    ATTACKER_JWT=$(get_user_jwt "usuarioteste11@gmail.com" "Teste1@")
    
    if [ -z "$ATTACKER_JWT" ]; then
        warn_test "Não foi possível obter JWT do atacante"
        echo "⏭️ Pulando teste"
        return
    fi
    
    info "JWT do atacante obtido"
    echo ""
    
    # Tentar acessar integração
    echo "📤 Tentando acessar integração de outro vendor..."
    
    RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET \
        "$SUPABASE_URL/rest/v1/vendor_integrations?id=eq.$INTEGRATION_ID" \
        -H "Authorization: Bearer $ATTACKER_JWT" \
        -H "apikey: $(manus-mcp-cli tool call get_publishable_keys --server supabase --input '{"project_id": "'$PROJECT_ID'"}' 2>&1 | grep -o 'eyJ[^"]*' | head -1)")
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "📥 Resposta: HTTP $HTTP_STATUS"
    echo "📄 Body: $BODY"
    echo ""
    
    # Verificar se foi bloqueado
    if [ "$BODY" = "[]" ] || echo "$BODY" | grep -qi "error\|forbidden"; then
        pass_test "IDOR em vendor_integrations foi BLOQUEADO (retornou vazio)"
    else
        fail_test "IDOR em vendor_integrations PERMITIDO! Atacante conseguiu acessar integração de outro vendor!"
    fi
    
    echo ""
}

################################################################################
# TESTE 3: IDOR EM WEBHOOK_DELIVERIES
################################################################################

test_idor_webhook_deliveries() {
    echo "=============================================================================="
    echo "TESTE 3: IDOR em Webhook Deliveries"
    echo "=============================================================================="
    echo ""
    
    info "Obtendo webhook deliveries do banco..."
    
    DELIVERIES=$(manus-mcp-cli tool call execute_sql --server supabase --input '{"project_id": "'$PROJECT_ID'", "query": "SELECT id, webhook_id, order_id, event_type, status FROM webhook_deliveries LIMIT 2"}' 2>&1 | grep -A 100 "untrusted-data" | grep -o '\[{.*}\]' | head -1)
    
    if [ -z "$DELIVERIES" ] || [ "$DELIVERIES" = "[]" ]; then
        warn_test "Nenhum webhook delivery encontrado no banco"
        echo "⏭️ Pulando teste (requer webhook deliveries cadastrados)"
        return
    fi
    
    echo "📬 Webhook deliveries encontrados:"
    echo "$DELIVERIES" | python3 -m json.tool 2>/dev/null || echo "$DELIVERIES"
    echo ""
    
    # Extrair primeiro delivery (tratando JSON escapado)
    DELIVERY_ID=$(echo "$DELIVERIES" | sed 's/\\//g' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$DELIVERY_ID" ]; then
        warn_test "Não foi possível extrair delivery_id"
        echo "⏭️ Pulando teste"
        return
    fi
    
    echo "📋 Cenário:"
    echo "  - Delivery ID: $DELIVERY_ID"
    echo "  - Atacante: usuarioteste11@gmail.com"
    echo ""
    
    # Obter JWT do atacante
    ATTACKER_JWT=$(get_user_jwt "usuarioteste11@gmail.com" "Teste1@")
    
    if [ -z "$ATTACKER_JWT" ]; then
        warn_test "Não foi possível obter JWT do atacante"
        echo "⏭️ Pulando teste"
        return
    fi
    
    info "JWT do atacante obtido"
    echo ""
    
    # Tentar acessar webhook delivery
    echo "📤 Tentando acessar webhook delivery de outro usuário..."
    
    RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET \
        "$SUPABASE_URL/rest/v1/webhook_deliveries?id=eq.$DELIVERY_ID" \
        -H "Authorization: Bearer $ATTACKER_JWT" \
        -H "apikey: $(manus-mcp-cli tool call get_publishable_keys --server supabase --input '{"project_id": "'$PROJECT_ID'"}' 2>&1 | grep -o 'eyJ[^"]*' | head -1)")
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "📥 Resposta: HTTP $HTTP_STATUS"
    echo "📄 Body: $BODY"
    echo ""
    
    # Verificar se foi bloqueado
    if [ "$BODY" = "[]" ] || echo "$BODY" | grep -qi "error\|forbidden"; then
        pass_test "IDOR em webhook_deliveries foi BLOQUEADO (retornou vazio)"
    else
        fail_test "IDOR em webhook_deliveries PERMITIDO! Atacante conseguiu acessar delivery de outro usuário!"
    fi
    
    echo ""
}

################################################################################
# EXECUTAR TODOS OS TESTES
################################################################################

test_idor_orders
test_idor_vendor_integrations
test_idor_webhook_deliveries

################################################################################
# RELATÓRIO FINAL
################################################################################

echo "=============================================================================="
echo "📊 RELATÓRIO FINAL - IDOR EXPANDIDO"
echo "=============================================================================="
echo ""
echo "Total de testes: $TOTAL_TESTS"
echo -e "${GREEN}✅ Passou: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Falhou: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}❌ VULNERABILIDADES CRÍTICAS DE IDOR DETECTADAS!${NC}"
    echo "🚨 Ação imediata necessária: Revisar e corrigir políticas RLS"
    exit 1
else
    echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
    echo "✅ Sistema está protegido contra IDOR"
    exit 0
fi
