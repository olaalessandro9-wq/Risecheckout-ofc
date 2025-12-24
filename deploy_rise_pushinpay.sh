#!/usr/bin/env bash
# ============================================================
# RiseCheckout — Deploy completo da integração PushinPay (PIX)
# Faz: valida ambiente, configura secrets, deploya funções
# Autor: plano consolidado (versão final)
# ============================================================

set -euo pipefail

# ---------- CONFIGURAÇÕES FIXAS DO PROJETO ----------
PROJECT_REF="wivbtmtgpsxupfjwwovf"                  # seu Supabase project ref
PLATFORM_PUSHINPAY_ACCOUNT_ID="9F73D854-4DA8-45E1-AFB6-9A8F803EFB7A"  # sua conta PushinPay (plataforma)
PLATFORM_FEE_PERCENT="7.5"                           # taxa da plataforma (em %)
PUSHINPAY_BASE_URL_PROD="https://api.pushinpay.com.br/api"
PUSHINPAY_BASE_URL_SANDBOX="https://api-sandbox.pushinpay.com.br/api"
PUSHINPAY_WEBHOOK_TOKEN="<REDACTED_WEBHOOK_TOKEN>"      # token que a PushinPay enviará no header x-pushinpay-token

echo "🚀 DEPLOY COMPLETO – Integração PushinPay (PIX)"
echo "Projeto: ${PROJECT_REF}"
echo "Conta plataforma (split): ${PLATFORM_PUSHINPAY_ACCOUNT_ID}"
echo "============================================================"
echo

# ---------- PRÉ-CHECAGENS ----------
if [ ! -d "supabase/functions" ]; then
  echo "❌ Erro: Execute este script na RAIZ do repositório (precisa de supabase/functions/)."
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "❌ Supabase CLI não encontrado."
  echo "   Instale com: npm i -g supabase"
  exit 1
fi

if ! supabase projects list >/dev/null 2>&1; then
  echo "❌ Você não está logado no Supabase CLI."
  echo "   Faça: supabase login"
  exit 1
fi

echo "✅ Ambiente validado."
echo

# ---------- ETAPA 1: SECRETS ----------
echo "📦 1/2 – Configurando secrets no Supabase…"

# Gera uma chave forte de 32 bytes (Base64) para criptografia AES-256-GCM
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

# Configura as 6 secrets necessárias
supabase secrets set ENCRYPTION_KEY="${ENCRYPTION_KEY}" --project-ref "${PROJECT_REF}"
supabase secrets set PLATFORM_PUSHINPAY_ACCOUNT_ID="${PLATFORM_PUSHINPAY_ACCOUNT_ID}" --project-ref "${PROJECT_REF}"
supabase secrets set PLATFORM_FEE_PERCENT="${PLATFORM_FEE_PERCENT}" --project-ref "${PROJECT_REF}"
supabase secrets set PUSHINPAY_BASE_URL_PROD="${PUSHINPAY_BASE_URL_PROD}" --project-ref "${PROJECT_REF}"
supabase secrets set PUSHINPAY_BASE_URL_SANDBOX="${PUSHINPAY_BASE_URL_SANDBOX}" --project-ref "${PROJECT_REF}"
supabase secrets set PUSHINPAY_WEBHOOK_TOKEN="${PUSHINPAY_WEBHOOK_TOKEN}" --project-ref "${PROJECT_REF}"

echo "✅ Secrets definidas."
echo

# ---------- ETAPA 2: DEPLOY DAS EDGE FUNCTIONS ----------
echo "🚀 2/2 – Deploy das Edge Functions (ordem correta)…"
# As 3 usadas pelo frontend sem verificação de JWT:
echo " → encrypt-token"
supabase functions deploy encrypt-token --no-verify-jwt --project-ref "${PROJECT_REF}"

echo " → pushinpay-create-pix"
supabase functions deploy pushinpay-create-pix --no-verify-jwt --project-ref "${PROJECT_REF}"

echo " → pushinpay-get-status"
supabase functions deploy pushinpay-get-status --no-verify-jwt --project-ref "${PROJECT_REF}"

# Webhook (server-to-server) COM verificação de JWT:
echo " → pushinpay-webhook"
supabase functions deploy pushinpay-webhook --project-ref "${PROJECT_REF}"

echo
echo "✅ Funções deployadas:"
supabase functions list --project-ref "${PROJECT_REF}" || true
echo

# ---------- INSTRUÇÕES FINAIS ----------
echo "============================================================"
echo "✅ DEPLOY CONCLUÍDO"
echo "============================================================"
echo
echo "📍 Configure o Webhook na PushinPay (produção e sandbox):"
echo "   URL: https://${PROJECT_REF}.supabase.co/functions/v1/pushinpay-webhook"
echo "   Token (x-pushinpay-token): ${PUSHINPAY_WEBHOOK_TOKEN}"
echo "   Eventos: pix.created, pix.paid, pix.expired, pix.canceled"
echo
echo "🧪 Teste rápido (criptografia) – Execute no terminal após copiar seu ANON KEY:"
echo '   curl -X POST "https://'"${PROJECT_REF}"'.supabase.co/functions/v1/encrypt-token" \'
echo '     -H "Content-Type: application/json" \'
echo '     -H "apikey: <COLE_SUA_SUPABASE_ANON_KEY_AQUI>" \'
echo "     -d '{\"token\":\"token_teste_123\"}'"
echo "   → Esperado: {\"encrypted\":\"...\"}"
echo
echo "🧪 Teste no app:"
echo "   1) Acesse /financeiro, cole o token Sandbox/Prod da PushinPay e salve."
echo "   2) Gere um PIX ≥ R$ 0,50; a imagem base64 do QR deve aparecer."
echo "   3) No painel da PushinPay (Sandbox), simule o pagamento."
echo "   4) Verifique mudança de status via webhook (paid/expired/canceled)."
echo
echo "🔒 Observações de segurança:"
echo "   • A taxa da plataforma é calculada no backend (PLATFORM_FEE_PERCENT)."
echo "   • O vendedor não vê nem altera a taxa (UI centralizada só para o dono)."
echo "   • O header 'Accept: application/json' já está no código das functions."
echo
echo "📚 Referências usadas neste consolidado:"
echo "   • Script base e comandos de secrets/deploy (de Manus/ChatGPT):"
echo "     – deploy rápido + secrets + ordem de deploy. (vide documentação/artefatos internos)"
echo
echo "✅ Pronto! Use este script sempre que precisar refazer o deploy end-to-end."
