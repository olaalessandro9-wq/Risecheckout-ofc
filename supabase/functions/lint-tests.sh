#!/bin/bash
# ============================================================================
# lint-tests.sh - RISE Protocol V3 Test Validator
# 
# @version 1.0.0
# @date 2026-02-02
# @description Validates Edge Function tests for RISE V3 compliance
# 
# Usage:
#   cd supabase/functions && ./lint-tests.sh
# 
# Exit Codes:
#   0 - All validations passed
#   1 - Violations found
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔍 RISE V3 - Validando testes de Edge Functions..."
echo ""

VIOLATIONS=0

# ============================================================================
# 1. Verificar arquivos index.test.ts monolíticos (devem estar em tests/)
# ============================================================================
echo "📋 Verificando arquivos index.test.ts monolíticos..."

MONOLITHIC=$(find . -name "index.test.ts" -type f ! -path "./node_modules/*" ! -path "./_*" 2>/dev/null | head -20 || true)
if [ -n "$MONOLITHIC" ]; then
  echo "❌ VIOLAÇÃO: Arquivos index.test.ts encontrados (devem ser modularizados em tests/)"
  echo "$MONOLITHIC"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "✅ Zero arquivos index.test.ts monolíticos"
fi

echo ""

# ============================================================================
# 2. Verificar limite de 300 linhas
# ============================================================================
echo "📏 Verificando limite de 300 linhas..."

OVERSIZED=0
for file in $(find . -name "*.test.ts" -type f ! -path "./node_modules/*" 2>/dev/null); do
  LINES=$(wc -l < "$file" | tr -d ' ')
  if [ "$LINES" -gt 300 ]; then
    echo "❌ VIOLAÇÃO: $file tem $LINES linhas (máximo: 300)"
    OVERSIZED=$((OVERSIZED + 1))
  fi
done

if [ "$OVERSIZED" -eq 0 ]; then
  echo "✅ Todos os arquivos de teste estão abaixo de 300 linhas"
else
  VIOLATIONS=$((VIOLATIONS + OVERSIZED))
fi

echo ""

# ============================================================================
# 3. Verificar presença de _shared.ts em diretórios tests/
# ============================================================================
echo "📁 Verificando estrutura de diretórios tests/..."

MISSING_SHARED=0
for dir in $(find . -type d -name "tests" ! -path "./node_modules/*" 2>/dev/null); do
  if [ ! -f "$dir/_shared.ts" ]; then
    echo "⚠️  AVISO: $dir não tem _shared.ts"
    # Aviso, não violação
  fi
done

if [ "$MISSING_SHARED" -eq 0 ]; then
  echo "✅ Estrutura de diretórios verificada"
fi

echo ""

# ============================================================================
# 4. Verificar termos proibidos no código (não em comentários de versão)
# ============================================================================
echo "🚫 Verificando termos proibidos..."

PROHIBITED_TERMS="workaround|gambiarra|quick fix|hotfix"
PROHIBITED_FOUND=$(grep -rn --include="*.ts" -E "$PROHIBITED_TERMS" . 2>/dev/null | grep -v "node_modules" | grep -v "@version" | head -10 || true)

if [ -n "$PROHIBITED_FOUND" ]; then
  echo "❌ VIOLAÇÃO: Termos proibidos encontrados:"
  echo "$PROHIBITED_FOUND"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "✅ Zero termos proibidos no código"
fi

echo ""

# ============================================================================
# 5. Verificar 'as any' / 'as never' em código real
# ============================================================================
echo "🔒 Verificando type safety (as any / as never)..."

UNSAFE_CASTS=$(grep -rn --include="*.test.ts" --include="_shared.ts" -E "as any|as never" . 2>/dev/null | grep -v "node_modules" | grep -v "@version" | grep -v "// ZERO" | grep -v "zero 'as" | head -10 || true)

if [ -n "$UNSAFE_CASTS" ]; then
  echo "❌ VIOLAÇÃO: Casts inseguros encontrados:"
  echo "$UNSAFE_CASTS"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "✅ Zero 'as any' / 'as never' em código"
fi

echo ""

# ============================================================================
# Resultado Final
# ============================================================================
echo "═══════════════════════════════════════════════════════════════════"

if [ "$VIOLATIONS" -eq 0 ]; then
  echo "✅ RISE V3 COMPLIANCE: Todas as validações passaram!"
  echo ""
  echo "  📊 Resumo:"
  echo "     - Zero arquivos monolíticos"
  echo "     - Zero arquivos acima de 300 linhas"
  echo "     - Zero termos proibidos"
  echo "     - Zero casts inseguros"
  echo ""
  echo "═══════════════════════════════════════════════════════════════════"
  exit 0
else
  echo "❌ RISE V3 VIOLATIONS: $VIOLATIONS violação(ões) encontrada(s)"
  echo ""
  echo "═══════════════════════════════════════════════════════════════════"
  exit 1
fi
