#!/bin/bash

# Script para executar todos os testes das Edge Functions
# Uso: ./run-tests.sh

echo "🧪 Executando testes automatizados do RiseCheckout..."
echo ""

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$SUPABASE_URL" ]; then
  echo "❌ ERRO: SUPABASE_URL não está configurada"
  exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "❌ ERRO: SUPABASE_ANON_KEY não está configurada"
  exit 1
fi

# Contador de testes
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Função para executar testes de uma Edge Function
run_test() {
  local function_name=$1
  local test_file="$function_name/index.test.ts"
  
  if [ -f "$test_file" ]; then
    echo "📋 Testando: $function_name"
    
    if deno test --allow-net --allow-env "$test_file"; then
      echo "✅ $function_name: PASSOU"
      ((PASSED_TESTS++))
    else
      echo "❌ $function_name: FALHOU"
      ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS++))
    echo ""
  fi
}

# Executar testes de cada função
run_test "create-order"
run_test "mercadopago-webhook"

# Relatório final
echo "========================================="
echo "📊 RELATÓRIO DE TESTES"
echo "========================================="
echo "Total de testes: $TOTAL_TESTS"
echo "✅ Passou: $PASSED_TESTS"
echo "❌ Falhou: $FAILED_TESTS"
echo "========================================="

if [ $FAILED_TESTS -gt 0 ]; then
  echo "❌ Alguns testes falharam!"
  exit 1
else
  echo "🎉 Todos os testes passaram!"
  exit 0
fi
