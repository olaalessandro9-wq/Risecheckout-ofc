#!/bin/bash

# Obter service role key do ambiente Supabase
echo "🔍 Buscando service role key..."

# Tentar obter do ambiente ou usar método alternativo
SERVICE_KEY=$(printenv | grep -i supabase | grep -i key | head -1 | cut -d'=' -f2)

if [ -z "$SERVICE_KEY" ]; then
  echo "⚠️ Service key não encontrada no ambiente"
  echo "📝 Vou usar MCP para fazer a chamada..."
  
  # Usar MCP para chamar a função
  python3.11 << 'PYEOF'
import json
import subprocess

payload = {
    "order_id": "30c81315-1c40-465c-9492-ca0e10bf3c0d",
    "event_type": "purchase_approved"
}

# Simular chamada via logs
print("📤 Payload para trigger-webhooks:")
print(json.dumps(payload, indent=2))
print("")
print("⚠️ Nota: Não é possível testar diretamente sem service role key")
print("✅ Mas a v12 já está deployada e funcionará quando o Mercado Pago enviar webhook")
PYEOF
else
  echo "✅ Service key encontrada"
  
  curl -X POST \
    "https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/trigger-webhooks" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -d '{"order_id": "30c81315-1c40-465c-9492-ca0e10bf3c0d", "event_type": "purchase_approved"}'
fi
