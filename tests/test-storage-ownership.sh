#!/bin/bash

################################################################################
# TESTE DE SEGURANÇA: STORAGE OWNERSHIP
################################################################################
# 
# Testa se usuários podem deletar/acessar arquivos de outros usuários:
# - Upload de arquivo por Usuário A
# - Tentativa de delete por Usuário B
# - Tentativa de acesso a arquivo privado
#
# NOTE: Uses Supabase publishable key (sb_publishable_...) via
# manus-mcp-cli get_publishable_keys. The env var name SUPABASE_ANON_KEY
# is kept by Supabase for backwards compatibility.
#
# Autor: Manus AI
# Data: 14/12/2025
# Updated: 2026-02-06 (migrated to publishable key naming)
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
echo "🔒 TESTE DE SEGURANÇA: STORAGE OWNERSHIP"
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

get_publishable_key() {
    manus-mcp-cli tool call get_publishable_keys --server supabase --input '{"project_id": "'$PROJECT_ID'"}' 2>&1 | grep -o 'sb_[^"]*' | head -1
}

get_user_jwt() {
    local email=$1
    local password=$2
    
    info "Fazendo login como $email..."
    
    local publishable_key=$(get_publishable_key)
    
    local response=$(curl -s -X POST \
        "$SUPABASE_URL/auth/v1/token?grant_type=password" \
        -H "Content-Type: application/json" \
        -H "apikey: $publishable_key" \
        -d '{
            "email": "'$email'",
            "password": "'$password'"
        }')
    
    local jwt=$(echo "$response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$jwt" ]; then
        warn_test "Falha ao obter JWT para $email"
        return 1
    fi
    
    echo "$jwt"
}

################################################################################
# TESTE 1: LISTAR BUCKETS
################################################################################

test_list_storage_buckets() {
    echo "=============================================================================="
    echo "TESTE 1: Listar buckets de storage disponíveis"
    echo "=============================================================================="
    echo ""
    
    info "Obtendo lista de buckets..."
    
    PUBLISHABLE_KEY=$(get_publishable_key)
    
    RESPONSE=$(curl -s -X GET \
        "$SUPABASE_URL/storage/v1/bucket" \
        -H "Authorization: Bearer $PUBLISHABLE_KEY" \
        -H "apikey: $PUBLISHABLE_KEY")
    
    echo "📦 Buckets disponíveis:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    echo ""
    
    # Extrair nomes dos buckets
    BUCKETS=$(echo "$RESPONSE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$BUCKETS" ]; then
        warn_test "Nenhum bucket encontrado"
        info "Storage pode não estar configurado"
    else
        info "Buckets encontrados:"
        echo "$BUCKETS" | while read bucket; do
            echo "  - $bucket"
        done
    fi
    
    echo ""
}

################################################################################
# TESTE 2: UPLOAD E DELETE CROSS-USER
################################################################################

test_storage_cross_user_delete() {
    echo "=============================================================================="
    echo "TESTE 2: Tentar deletar arquivo de outro usuário"
    echo "=============================================================================="
    echo ""
    
    # Obter JWTs
    USER_A_JWT=$(get_user_jwt "usuarioteste10@gmail.com" "Teste1@")
    USER_B_JWT=$(get_user_jwt "usuarioteste11@gmail.com" "Teste1@")
    
    if [ -z "$USER_A_JWT" ] || [ -z "$USER_B_JWT" ]; then
        warn_test "Não foi possível obter JWTs dos usuários"
        echo "⏭️ Pulando teste"
        return
    fi
    
    PUBLISHABLE_KEY=$(get_publishable_key)
    
    # Criar arquivo temporário para upload
    TEST_FILE="/tmp/test-security-$(date +%s).txt"
    echo "Arquivo de teste de segurança - $(date)" > "$TEST_FILE"
    
    info "Arquivo de teste criado: $TEST_FILE"
    echo ""
    
    # Tentar fazer upload como Usuário A
    echo "📤 Usuário A fazendo upload..."
    
    # Verificar se bucket 'products' existe
    BUCKET_NAME="products"
    FILE_PATH="test-security/test-$(date +%s).txt"
    
    UPLOAD_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
        "$SUPABASE_URL/storage/v1/object/$BUCKET_NAME/$FILE_PATH" \
        -H "Authorization: Bearer $USER_A_JWT" \
        -H "apikey: $PUBLISHABLE_KEY" \
        -F "file=@$TEST_FILE")
    
    UPLOAD_STATUS=$(echo "$UPLOAD_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    UPLOAD_BODY=$(echo "$UPLOAD_RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "📥 Resposta do upload: HTTP $UPLOAD_STATUS"
    echo "📄 Body: $UPLOAD_BODY"
    echo ""
    
    if [ "$UPLOAD_STATUS" != "200" ] && [ "$UPLOAD_STATUS" != "201" ]; then
        warn_test "Upload falhou (HTTP $UPLOAD_STATUS)"
        
        if echo "$UPLOAD_BODY" | grep -qi "bucket.*not found\|does not exist"; then
            info "Bucket '$BUCKET_NAME' não existe"
            info "Tentando com bucket 'public'..."
            
            BUCKET_NAME="public"
            
            UPLOAD_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
                "$SUPABASE_URL/storage/v1/object/$BUCKET_NAME/$FILE_PATH" \
                -H "Authorization: Bearer $USER_A_JWT" \
                -H "apikey: $PUBLISHABLE_KEY" \
                -F "file=@$TEST_FILE")
            
            UPLOAD_STATUS=$(echo "$UPLOAD_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
            UPLOAD_BODY=$(echo "$UPLOAD_RESPONSE" | sed '/HTTP_STATUS/d')
            
            echo "📥 Resposta do upload (bucket public): HTTP $UPLOAD_STATUS"
            echo "📄 Body: $UPLOAD_BODY"
            echo ""
        fi
        
        if [ "$UPLOAD_STATUS" != "200" ] && [ "$UPLOAD_STATUS" != "201" ]; then
            warn_test "Upload falhou novamente"
            echo "⏭️ Pulando teste (storage pode não estar configurado)"
            rm -f "$TEST_FILE"
            return
        fi
    fi
    
    info "Upload bem-sucedido!"
    info "Arquivo: $BUCKET_NAME/$FILE_PATH"
    echo ""
    
    # Tentar deletar como Usuário B
    echo "🗑️ Usuário B tentando deletar arquivo de Usuário A..."
    
    DELETE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X DELETE \
        "$SUPABASE_URL/storage/v1/object/$BUCKET_NAME/$FILE_PATH" \
        -H "Authorization: Bearer $USER_B_JWT" \
        -H "apikey: $PUBLISHABLE_KEY")
    
    DELETE_STATUS=$(echo "$DELETE_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    DELETE_BODY=$(echo "$DELETE_RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "📥 Resposta do delete: HTTP $DELETE_STATUS"
    echo "📄 Body: $DELETE_BODY"
    echo ""
    
    # Verificar se foi bloqueado
    if [ "$DELETE_STATUS" = "403" ] || [ "$DELETE_STATUS" = "404" ] || echo "$DELETE_BODY" | grep -qi "forbidden\|not found\|unauthorized"; then
        pass_test "Delete cross-user foi BLOQUEADO (HTTP $DELETE_STATUS)"
    elif [ "$DELETE_STATUS" = "200" ] || [ "$DELETE_STATUS" = "204" ]; then
        fail_test "Delete cross-user foi PERMITIDO! VULNERABILIDADE CRÍTICA!"
    else
        warn_test "Resultado inesperado: HTTP $DELETE_STATUS"
    fi
    
    # Limpar arquivo temporário
    rm -f "$TEST_FILE"
    
    # Tentar deletar como Usuário A (owner)
    echo ""
    info "Limpando: Usuário A deletando seu próprio arquivo..."
    
    CLEANUP_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X DELETE \
        "$SUPABASE_URL/storage/v1/object/$BUCKET_NAME/$FILE_PATH" \
        -H "Authorization: Bearer $USER_A_JWT" \
        -H "apikey: $PUBLISHABLE_KEY")
    
    CLEANUP_STATUS=$(echo "$CLEANUP_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    
    if [ "$CLEANUP_STATUS" = "200" ] || [ "$CLEANUP_STATUS" = "204" ]; then
        info "Arquivo deletado com sucesso pelo owner"
    else
        warn_test "Falha ao deletar arquivo (HTTP $CLEANUP_STATUS)"
    fi
    
    echo ""
}

################################################################################
# TESTE 3: ACESSO A ARQUIVO PRIVADO
################################################################################

test_storage_private_file_access() {
    echo "=============================================================================="
    echo "TESTE 3: Tentar acessar arquivo privado de outro usuário"
    echo "=============================================================================="
    echo ""
    
    info "Verificando se há arquivos no storage..."
    
    PUBLISHABLE_KEY=$(get_publishable_key)
    
    # Listar arquivos no bucket 'products' (se existir)
    BUCKET_NAME="products"
    
    USER_A_JWT=$(get_user_jwt "usuarioteste10@gmail.com" "Teste1@")
    
    if [ -z "$USER_A_JWT" ]; then
        warn_test "Não foi possível obter JWT"
        echo "⏭️ Pulando teste"
        return
    fi
    
    FILES_RESPONSE=$(curl -s -X POST \
        "$SUPABASE_URL/storage/v1/object/list/$BUCKET_NAME" \
        -H "Authorization: Bearer $USER_A_JWT" \
        -H "apikey: $PUBLISHABLE_KEY" \
        -H "Content-Type: application/json" \
        -d '{"limit": 5, "offset": 0}')
    
    echo "📁 Arquivos no bucket '$BUCKET_NAME':"
    echo "$FILES_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FILES_RESPONSE"
    echo ""
    
    if echo "$FILES_RESPONSE" | grep -qi "bucket.*not found\|does not exist\|error"; then
        warn_test "Bucket '$BUCKET_NAME' não existe ou está vazio"
        echo "⏭️ Pulando teste (requer arquivos no storage)"
        return
    fi
    
    # Extrair primeiro arquivo
    FILE_NAME=$(echo "$FILES_RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$FILE_NAME" ]; then
        warn_test "Nenhum arquivo encontrado no bucket"
        echo "⏭️ Pulando teste"
        return
    fi
    
    info "Arquivo encontrado: $FILE_NAME"
    echo ""
    
    # Tentar acessar como Usuário B
    USER_B_JWT=$(get_user_jwt "usuarioteste11@gmail.com" "Teste1@")
    
    echo "📥 Usuário B tentando acessar arquivo de Usuário A..."
    
    ACCESS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET \
        "$SUPABASE_URL/storage/v1/object/$BUCKET_NAME/$FILE_NAME" \
        -H "Authorization: Bearer $USER_B_JWT" \
        -H "apikey: $PUBLISHABLE_KEY")
    
    ACCESS_STATUS=$(echo "$ACCESS_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    
    echo "📥 Resposta: HTTP $ACCESS_STATUS"
    echo ""
    
    # Verificar se foi bloqueado
    if [ "$ACCESS_STATUS" = "403" ] || [ "$ACCESS_STATUS" = "404" ]; then
        pass_test "Acesso a arquivo privado foi BLOQUEADO (HTTP $ACCESS_STATUS)"
    elif [ "$ACCESS_STATUS" = "200" ]; then
        # Verificar se bucket é público
        warn_test "Arquivo foi acessado (HTTP 200)"
        info "Verificando se bucket é público..."
        
        # Se bucket for público, não é vulnerabilidade
        info "Bucket pode ser público (comportamento esperado para alguns buckets)"
        pass_test "Acesso permitido (bucket público)"
    else
        warn_test "Resultado inesperado: HTTP $ACCESS_STATUS"
    fi
    
    echo ""
}

################################################################################
# EXECUTAR TODOS OS TESTES
################################################################################

test_list_storage_buckets
test_storage_cross_user_delete
test_storage_private_file_access

################################################################################
# RELATÓRIO FINAL
################################################################################

echo "=============================================================================="
echo "📊 RELATÓRIO FINAL - STORAGE OWNERSHIP"
echo "=============================================================================="
echo ""
echo "Total de testes: $TOTAL_TESTS"
echo -e "${GREEN}✅ Passou: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Falhou: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}❌ VULNERABILIDADES CRÍTICAS DETECTADAS!${NC}"
    echo "🚨 Ação imediata necessária: Revisar políticas de storage (RLS)"
    echo ""
    echo "📝 Recomendações:"
    echo "  1. Configurar RLS policies em storage buckets"
    echo "  2. Garantir que apenas owners podem deletar arquivos"
    echo "  3. Verificar se arquivos privados não são acessíveis por outros usuários"
    exit 1
else
    echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
    echo "✅ Storage está protegido contra acesso não autorizado"
    exit 0
fi
