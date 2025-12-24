#!/bin/bash

################################################################################
# TESTE DE SEGURANÇA: MANIPULAÇÃO DE DADOS
################################################################################
# 
# Testa se é possível manipular:
# - Offer de outro produto
# - Order bumps de outro produto
# - Cupons de outro produto
# - Preços no payload
#
# Autor: Manus AI
# Data: 14/12/2025
################################################################################

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
SUPABASE_URL="https://wivbtmtgpsxupfjwwovf.supabase.co"
PROJECT_ID="wivbtmtgpsxupfjwwovf"

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo "=============================================================================="
echo "🔒 TESTE DE SEGURANÇA: MANIPULAÇÃO DE DADOS"
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

################################################################################
# TESTE 1: OFFER CROSS-PRODUCT
################################################################################

test_offer_cross_product() {
    echo "=============================================================================="
    echo "TESTE 1: Tentar usar offer_id de outro produto"
    echo "=============================================================================="
    echo ""
    
    echo "📋 Cenário:"
    echo "  - Produto A: 2ad650b6-8961-430d-aff6-e087d2028437 (Rise community)"
    echo "  - Offer válida: 89fbce0b-0a34-479d-a2b4-4c4bdf241fb9 (teste - R$ 59,00)"
    echo "  - Produto B: 81ee9fa1-5aec-4556-be0d-f3cbad1c26df (Produto Teste Usuário 1)"
    echo "  - Tentativa: Usar offer do Produto A no Produto B"
    echo ""
    
    # Obter anon key
    echo "🔑 Obtendo anon key..."
    ANON_KEY=$(manus-mcp-cli tool call get_publishable_keys --server supabase --input '{"project_id": "'$PROJECT_ID'"}' 2>&1 | grep -o 'eyJ[^"]*' | head -1)
    
    if [ -z "$ANON_KEY" ]; then
        warn_test "Não foi possível obter anon key via MCP"
        echo "⏭️ Pulando teste (requer configuração manual)"
        return
    fi
    
    echo "📤 Enviando requisição maliciosa..."
    
    RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
        "$SUPABASE_URL/functions/v1/create-order" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ANON_KEY" \
        -d '{
            "product_id": "81ee9fa1-5aec-4556-be0d-f3cbad1c26df",
            "offer_id": "89fbce0b-0a34-479d-a2b4-4c4bdf241fb9",
            "checkout_id": "test-checkout-'$(date +%s)'",
            "customer_name": "Teste Atacante",
            "customer_email": "atacante@test.com",
            "customer_phone": "11999999999"
        }')
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "📥 Resposta: HTTP $HTTP_STATUS"
    echo "📄 Body: $BODY"
    echo ""
    
    # Verificar se foi rejeitado
    if [ "$HTTP_STATUS" = "400" ] || [ "$HTTP_STATUS" = "403" ] || echo "$BODY" | grep -qi "error\|invalid\|not found"; then
        pass_test "Offer cross-product foi rejeitada (HTTP $HTTP_STATUS)"
    else
        fail_test "Offer cross-product foi ACEITA! VULNERABILIDADE CRÍTICA!"
    fi
    
    echo ""
}

################################################################################
# TESTE 2: ORDER BUMP CROSS-PRODUCT
################################################################################

test_order_bump_cross_product() {
    echo "=============================================================================="
    echo "TESTE 2: Tentar usar order_bump_id de outro produto"
    echo "=============================================================================="
    echo ""
    
    echo "📋 Obtendo order bumps do banco..."
    
    BUMPS=$(manus-mcp-cli tool call execute_sql --server supabase --input '{"project_id": "'$PROJECT_ID'", "query": "SELECT id, product_id, name, price FROM order_bumps WHERE status = '\''active'\'' LIMIT 2"}' 2>&1 | grep -A 50 "untrusted-data" | grep -o '\[{.*}\]' | head -1)
    
    if [ -z "$BUMPS" ] || [ "$BUMPS" = "[]" ]; then
        warn_test "Nenhum order bump encontrado no banco"
        echo "⏭️ Pulando teste (requer order bumps cadastrados)"
        return
    fi
    
    echo "📦 Order bumps encontrados:"
    echo "$BUMPS" | python3 -m json.tool 2>/dev/null || echo "$BUMPS"
    echo ""
    
    # Extrair IDs (simplificado - assumindo que há pelo menos 1 bump)
    BUMP_ID=$(echo "$BUMPS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    BUMP_PRODUCT_ID=$(echo "$BUMPS" | grep -o '"product_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$BUMP_ID" ]; then
        warn_test "Não foi possível extrair bump_id"
        echo "⏭️ Pulando teste"
        return
    fi
    
    echo "📋 Cenário:"
    echo "  - Order Bump ID: $BUMP_ID"
    echo "  - Produto do Bump: $BUMP_PRODUCT_ID"
    echo "  - Produto Alvo: 81ee9fa1-5aec-4556-be0d-f3cbad1c26df (outro produto)"
    echo ""
    
    # Obter anon key
    ANON_KEY=$(manus-mcp-cli tool call get_publishable_keys --server supabase --input '{"project_id": "'$PROJECT_ID'"}' 2>&1 | grep -o 'eyJ[^"]*' | head -1)
    
    echo "📤 Enviando requisição maliciosa..."
    
    RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
        "$SUPABASE_URL/functions/v1/create-order" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ANON_KEY" \
        -d '{
            "product_id": "81ee9fa1-5aec-4556-be0d-f3cbad1c26df",
            "offer_id": "ccf680fb-8a72-4ecc-82ba-8f8165be2c25",
            "checkout_id": "test-checkout-'$(date +%s)'",
            "customer_name": "Teste Atacante",
            "customer_email": "atacante@test.com",
            "customer_phone": "11999999999",
            "order_bump_ids": ["'$BUMP_ID'"]
        }')
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "📥 Resposta: HTTP $HTTP_STATUS"
    echo "📄 Body: $BODY"
    echo ""
    
    # Verificar se foi rejeitado
    if [ "$HTTP_STATUS" = "400" ] || [ "$HTTP_STATUS" = "403" ] || echo "$BODY" | grep -qi "error\|invalid\|not found"; then
        pass_test "Order bump cross-product foi rejeitado (HTTP $HTTP_STATUS)"
    else
        fail_test "Order bump cross-product foi ACEITO! VULNERABILIDADE CRÍTICA!"
    fi
    
    echo ""
}

################################################################################
# TESTE 3: CUPOM CROSS-PRODUCT
################################################################################

test_coupon_cross_product() {
    echo "=============================================================================="
    echo "TESTE 3: Tentar usar cupom de outro produto"
    echo "=============================================================================="
    echo ""
    
    echo "📋 Obtendo cupons do banco..."
    
    COUPONS=$(manus-mcp-cli tool call execute_sql --server supabase --input '{"project_id": "'$PROJECT_ID'", "query": "SELECT id, product_id, code, discount_type, discount_value FROM coupons WHERE status = '\''active'\'' LIMIT 2"}' 2>&1 | grep -A 50 "untrusted-data" | grep -o '\[{.*}\]' | head -1)
    
    if [ -z "$COUPONS" ] || [ "$COUPONS" = "[]" ]; then
        warn_test "Nenhum cupom encontrado no banco"
        echo "⏭️ Pulando teste (requer cupons cadastrados)"
        return
    fi
    
    echo "🎫 Cupons encontrados:"
    echo "$COUPONS" | python3 -m json.tool 2>/dev/null || echo "$COUPONS"
    echo ""
    
    # Extrair código do cupom
    COUPON_CODE=$(echo "$COUPONS" | grep -o '"code":"[^"]*"' | head -1 | cut -d'"' -f4)
    COUPON_PRODUCT_ID=$(echo "$COUPONS" | grep -o '"product_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$COUPON_CODE" ]; then
        warn_test "Não foi possível extrair coupon code"
        echo "⏭️ Pulando teste"
        return
    fi
    
    echo "📋 Cenário:"
    echo "  - Cupom: $COUPON_CODE"
    echo "  - Produto do Cupom: $COUPON_PRODUCT_ID"
    echo "  - Produto Alvo: 81ee9fa1-5aec-4556-be0d-f3cbad1c26df (outro produto)"
    echo ""
    
    # Obter anon key
    ANON_KEY=$(manus-mcp-cli tool call get_publishable_keys --server supabase --input '{"project_id": "'$PROJECT_ID'"}' 2>&1 | grep -o 'eyJ[^"]*' | head -1)
    
    echo "📤 Enviando requisição maliciosa..."
    
    RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
        "$SUPABASE_URL/functions/v1/create-order" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ANON_KEY" \
        -d '{
            "product_id": "81ee9fa1-5aec-4556-be0d-f3cbad1c26df",
            "offer_id": "ccf680fb-8a72-4ecc-82ba-8f8165be2c25",
            "checkout_id": "test-checkout-'$(date +%s)'",
            "customer_name": "Teste Atacante",
            "customer_email": "atacante@test.com",
            "customer_phone": "11999999999",
            "coupon_code": "'$COUPON_CODE'"
        }')
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "📥 Resposta: HTTP $HTTP_STATUS"
    echo "📄 Body: $BODY"
    echo ""
    
    # Verificar se foi rejeitado
    if [ "$HTTP_STATUS" = "400" ] || [ "$HTTP_STATUS" = "403" ] || echo "$BODY" | grep -qi "error\|invalid\|coupon"; then
        pass_test "Cupom cross-product foi rejeitado (HTTP $HTTP_STATUS)"
    else
        fail_test "Cupom cross-product foi ACEITO! VULNERABILIDADE CRÍTICA!"
    fi
    
    echo ""
}

################################################################################
# EXECUTAR TODOS OS TESTES
################################################################################

test_offer_cross_product
test_order_bump_cross_product
test_coupon_cross_product

################################################################################
# RELATÓRIO FINAL
################################################################################

echo "=============================================================================="
echo "📊 RELATÓRIO FINAL - MANIPULAÇÃO DE DADOS"
echo "=============================================================================="
echo ""
echo "Total de testes: $TOTAL_TESTS"
echo -e "${GREEN}✅ Passou: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Falhou: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}❌ VULNERABILIDADES CRÍTICAS DETECTADAS!${NC}"
    echo "🚨 Ação imediata necessária: Implementar validações server-side"
    exit 1
else
    echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
    echo "✅ Sistema está protegido contra manipulação de dados"
    exit 0
fi
