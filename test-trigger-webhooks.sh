#!/bin/bash

# Script para testar trigger-webhooks manualmente
# Usa um pedido PAID existente para disparar webhook

ORDER_ID="30c81315-1c40-465c-9492-ca0e10bf3c0d"
EVENT_TYPE="purchase_approved"
SUPABASE_URL="https://wivbtmtgpsxupfjwwovf.supabase.co"

echo "🧪 Testando trigger-webhooks..."
echo "📋 Order ID: $ORDER_ID"
echo "📋 Event Type: $EVENT_TYPE"
echo ""

# Obter SUPABASE_SERVICE_ROLE_KEY do MCP
echo "🔑 Obtendo service role key..."
SERVICE_ROLE_KEY=$(manus-mcp-cli tool call execute_sql --server supabase --input '{"project_id": "wivbtmtgpsxupfjwwovf", "query": "SELECT 1"}' 2>&1 | grep -o 'Bearer [^"]*' | cut -d' ' -f2 | head -1)

if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "❌ Erro: Não foi possível obter service role key"
  exit 1
fi

echo "✅ Service role key obtida"
echo ""

# Chamar trigger-webhooks
echo "📤 Chamando trigger-webhooks..."
RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/trigger-webhooks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -d "{\"order_id\": \"$ORDER_ID\", \"event_type\": \"$EVENT_TYPE\"}")

echo "📥 Resposta:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# Verificar webhook_deliveries
echo "🔍 Verificando webhook_deliveries..."
sleep 2

manus-mcp-cli tool call execute_sql --server supabase --input "{\"project_id\": \"wivbtmtgpsxupfjwwovf\", \"query\": \"SELECT id, webhook_id, order_id, event_type, status, attempts, response_status, created_at FROM webhook_deliveries WHERE order_id = '$ORDER_ID' ORDER BY created_at DESC LIMIT 1\"}" 2>&1 | grep -A 20 "untrusted-data"

echo ""
echo "✅ Teste concluído!"
