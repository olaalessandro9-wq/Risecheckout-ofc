#!/usr/bin/env bash
# ============================================================
# Script de Teste - Função encrypt-token
# RiseCheckout - Integração PushinPay
# ============================================================
#
# CONFIGURAÇÃO OBRIGATÓRIA:
# Defina as variáveis de ambiente antes de executar:
#
#   export SUPABASE_PROJECT_REF="seu-project-ref"
#   export SUPABASE_ANON_KEY="sua-anon-key"
#
# Ou crie um arquivo .env.local com essas variáveis.
# ============================================================

set -euo pipefail

echo "🧪 TESTE - Função encrypt-token"
echo "================================"
echo ""

# Carregar variáveis de ambiente do .env.local se existir
if [ -f ".env.local" ]; then
  echo "📂 Carregando variáveis de .env.local..."
  export $(grep -v '^#' .env.local | xargs)
fi

# Verificar se as variáveis obrigatórias estão definidas
if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
  echo "❌ Erro: SUPABASE_PROJECT_REF não definido"
  echo ""
  echo "Configure a variável de ambiente:"
  echo "  export SUPABASE_PROJECT_REF=\"seu-project-ref\""
  echo ""
  echo "Ou crie um arquivo .env.local com:"
  echo "  SUPABASE_PROJECT_REF=seu-project-ref"
  exit 1
fi

if [ -z "${SUPABASE_ANON_KEY:-}" ]; then
  echo "❌ Erro: SUPABASE_ANON_KEY não definido"
  echo ""
  echo "Configure a variável de ambiente:"
  echo "  export SUPABASE_ANON_KEY=\"sua-anon-key\""
  echo ""
  echo "Ou crie um arquivo .env.local com:"
  echo "  SUPABASE_ANON_KEY=sua-anon-key"
  exit 1
fi

# Configurações
FUNCTION_URL="https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/encrypt-token"

echo "📍 URL: ${FUNCTION_URL}"
echo "🔑 ANON KEY: ${SUPABASE_ANON_KEY:0:20}...${SUPABASE_ANON_KEY: -10}"
echo ""

# Teste 1: Token de teste simples
echo "🧪 Teste 1: Criptografar token de teste"
echo "----------------------------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URL}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
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
  -H "apikey: ${SUPABASE_ANON_KEY}" \
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
  -H "apikey: ${SUPABASE_ANON_KEY}" \
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
