#!/bin/bash
# ============================================================================
# lint-console.sh - RISE Protocol V3 Logging Validator
# ============================================================================
# 
# Verifica uso proibido de console.log/error/warn/debug/info em Edge Functions.
# Apenas _shared/logger.ts pode usar console.* diretamente.
#
# Uso: ./lint-console.sh
# ============================================================================

set -e

echo "🔍 RISE V3 - Verificando uso de console.* em Edge Functions..."
echo ""

# Diretório base
BASE_DIR="supabase/functions"

# Buscar violações (excluindo logger.ts)
VIOLATIONS=$(grep -rn "console\.\(log\|error\|warn\|debug\|info\)" \
  --include="*.ts" \
  "$BASE_DIR" \
  | grep -v "_shared/logger.ts" \
  | grep -v "// eslint-disable" \
  | grep -v "deno-lint-ignore" \
  || true)

# Contar violações
VIOLATION_COUNT=$(echo "$VIOLATIONS" | grep -c "console\." || echo "0")

if [ "$VIOLATION_COUNT" -gt 0 ]; then
  echo "❌ VIOLAÇÃO RISE V3: $VIOLATION_COUNT usos de console.* encontrados!"
  echo ""
  echo "Arquivos com violações:"
  echo "========================"
  echo "$VIOLATIONS"
  echo ""
  echo "SOLUÇÃO: Substitua console.log/error/warn por createLogger de _shared/logger.ts"
  echo ""
  echo "Exemplo:"
  echo "  import { createLogger } from '../_shared/logger.ts';"
  echo "  const log = createLogger('function-name');"
  echo "  log.info('mensagem');"
  echo ""
  exit 1
fi

echo "✅ Nenhuma violação de logging encontrada!"
echo "   Todas as Edge Functions usam createLogger corretamente."
exit 0
