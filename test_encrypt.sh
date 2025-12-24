#!/usr/bin/env bash
# ============================================================
# Script de Teste - Função encrypt-token
# RiseCheckout - Integração PushinPay
# ============================================================

set -euo pipefail

echo "🧪 TESTE - Função encrypt-token"
echo "================================"
echo ""

# Configurações
PROJECT_REF="wivbtmtgpsxupfjwwovf"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdmJ0bXRncHN4dXBmand3b3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNjYzMjgsImV4cCI6MjA3NjY0MjMyOH0.fiSC6Ic4JLO2haISk-qKBe_nyQ2CWOkEJstE2SehEY8"
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/encrypt-token"

echo "📍 URL: ${FUNCTION_URL}"
echo "🔑 ANON KEY: ${ANON_KEY:0:50}..."
echo ""

# Teste 1: Token de teste simples
echo "🧪 Teste 1: Criptografar token de teste"
echo "----------------------------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URL}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"token": "sandbox_teste_123"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Status HTTP: ${HTTP_CODE}"
echo "Resposta: ${BODY}"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Teste 1: PASSOU"
else
  echo "❌ Teste 1: FALHOU (esperado 200, recebido ${HTTP_CODE})"
fi

echo ""

# Teste 2: Token vazio (deve falhar)
echo "🧪 Teste 2: Token vazio (deve retornar 422)"
echo "--------------------------------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URL}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"token": ""}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Status HTTP: ${HTTP_CODE}"
echo "Resposta: ${BODY}"
echo ""

if [ "$HTTP_CODE" = "422" ]; then
  echo "✅ Teste 2: PASSOU"
else
  echo "❌ Teste 2: FALHOU (esperado 422, recebido ${HTTP_CODE})"
fi

echo ""

# Teste 3: Sem token (deve falhar)
echo "🧪 Teste 3: Sem campo token (deve retornar 422)"
echo "------------------------------------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URL}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Status HTTP: ${HTTP_CODE}"
echo "Resposta: ${BODY}"
echo ""

if [ "$HTTP_CODE" = "422" ]; then
  echo "✅ Teste 3: PASSOU"
else
  echo "❌ Teste 3: FALHOU (esperado 422, recebido ${HTTP_CODE})"
fi

echo ""
echo "================================"
echo "✅ TESTES CONCLUÍDOS"
echo "================================"
