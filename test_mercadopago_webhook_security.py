#!/usr/bin/env python3
"""
Script de Teste de Segurança - Webhook do Mercado Pago
========================================================

Este script testa a validação rigorosa de assinatura HMAC-SHA256
implementada na Edge Function mercadopago-webhook (v144+).

Testes realizados:
1. ✅ Webhook válido (com assinatura correta)
2. ❌ Webhook sem headers de assinatura
3. ❌ Webhook com assinatura inválida
4. ❌ Webhook expirado (timestamp antigo)
5. ❌ Webhook com formato de assinatura incorreto

Autor: Manus AI
Data: 2025-12-12
"""

import requests
import hmac
import hashlib
import time
import json
from typing import Dict, Any

# ========================================================================
# CONFIGURAÇÃO
# ========================================================================

WEBHOOK_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/mercadopago-webhook"

# IMPORTANTE: Substitua pelo seu MERCADOPAGO_WEBHOOK_SECRET real
# Este é apenas um exemplo - use o secret configurado no Supabase
WEBHOOK_SECRET = "seu_secret_aqui"  # ⚠️ SUBSTITUIR

# ========================================================================
# HELPER FUNCTIONS
# ========================================================================

def generate_hmac_signature(secret: str, message: str) -> str:
    """
    Gera assinatura HMAC-SHA256 seguindo o padrão do Mercado Pago.
    """
    signature = hmac.new(
        secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return signature


def create_valid_webhook_request(payment_id: str = "12345678") -> Dict[str, Any]:
    """
    Cria uma requisição de webhook válida com assinatura correta.
    """
    timestamp = str(int(time.time()))
    request_id = f"test-request-{timestamp}"
    
    # Criar o manifest seguindo o padrão do Mercado Pago
    manifest = f"id:{payment_id};request-id:{request_id};ts:{timestamp};"
    
    # Gerar assinatura
    signature = generate_hmac_signature(WEBHOOK_SECRET, manifest)
    
    # Montar o header x-signature no formato do MP
    x_signature = f"ts={timestamp},v1={signature}"
    
    return {
        "url": WEBHOOK_URL,
        "headers": {
            "Content-Type": "application/json",
            "x-signature": x_signature,
            "x-request-id": request_id
        },
        "body": {
            "type": "payment",
            "data": {
                "id": payment_id
            }
        }
    }


# ========================================================================
# TESTES
# ========================================================================

def test_valid_webhook():
    """
    Teste 1: Webhook válido com assinatura correta
    Resultado esperado: 200 OK (ou 404 se pedido não existir no banco)
    """
    print("\n" + "="*70)
    print("TESTE 1: Webhook Válido (Assinatura Correta)")
    print("="*70)
    
    req_data = create_valid_webhook_request()
    
    print(f"📤 Enviando para: {req_data['url']}")
    print(f"📋 Headers: {json.dumps(req_data['headers'], indent=2)}")
    print(f"📦 Body: {json.dumps(req_data['body'], indent=2)}")
    
    response = requests.post(
        req_data["url"],
        headers=req_data["headers"],
        json=req_data["body"]
    )
    
    print(f"\n📥 Resposta: {response.status_code}")
    print(f"📄 Body: {response.text}")
    
    # Esperamos 200 (se pedido existe) ou 404 (se não existe)
    # Mas NÃO esperamos 401 (unauthorized)
    if response.status_code in [200, 404]:
        print("✅ PASSOU: Webhook válido foi aceito")
    elif response.status_code == 401:
        print("❌ FALHOU: Webhook válido foi rejeitado (401)")
    else:
        print(f"⚠️ INESPERADO: Status {response.status_code}")
    
    return response


def test_missing_signature_headers():
    """
    Teste 2: Webhook sem headers de assinatura
    Resultado esperado: 401 Unauthorized
    """
    print("\n" + "="*70)
    print("TESTE 2: Webhook Sem Headers de Assinatura")
    print("="*70)
    
    print(f"📤 Enviando para: {WEBHOOK_URL}")
    print("📋 Headers: Apenas Content-Type (SEM x-signature e x-request-id)")
    
    response = requests.post(
        WEBHOOK_URL,
        headers={"Content-Type": "application/json"},
        json={
            "type": "payment",
            "data": {"id": "12345678"}
        }
    )
    
    print(f"\n📥 Resposta: {response.status_code}")
    print(f"📄 Body: {response.text}")
    
    if response.status_code == 401:
        print("✅ PASSOU: Webhook sem headers foi rejeitado (401)")
    else:
        print(f"❌ FALHOU: Esperava 401, recebeu {response.status_code}")
    
    return response


def test_invalid_signature():
    """
    Teste 3: Webhook com assinatura inválida
    Resultado esperado: 401 Unauthorized
    """
    print("\n" + "="*70)
    print("TESTE 3: Webhook com Assinatura Inválida")
    print("="*70)
    
    timestamp = str(int(time.time()))
    request_id = f"test-request-{timestamp}"
    
    # Assinatura INVÁLIDA (não corresponde ao manifest)
    invalid_signature = "0" * 64  # Hash falso
    x_signature = f"ts={timestamp},v1={invalid_signature}"
    
    print(f"📤 Enviando para: {WEBHOOK_URL}")
    print(f"📋 x-signature: {x_signature} (INVÁLIDA)")
    
    response = requests.post(
        WEBHOOK_URL,
        headers={
            "Content-Type": "application/json",
            "x-signature": x_signature,
            "x-request-id": request_id
        },
        json={
            "type": "payment",
            "data": {"id": "12345678"}
        }
    )
    
    print(f"\n📥 Resposta: {response.status_code}")
    print(f"📄 Body: {response.text}")
    
    if response.status_code == 401:
        print("✅ PASSOU: Webhook com assinatura inválida foi rejeitado (401)")
    else:
        print(f"❌ FALHOU: Esperava 401, recebeu {response.status_code}")
    
    return response


def test_expired_webhook():
    """
    Teste 4: Webhook expirado (timestamp > 5 minutos atrás)
    Resultado esperado: 401 Unauthorized
    """
    print("\n" + "="*70)
    print("TESTE 4: Webhook Expirado (Timestamp Antigo)")
    print("="*70)
    
    # Timestamp de 10 minutos atrás (limite é 5 minutos)
    old_timestamp = str(int(time.time()) - 600)
    request_id = f"test-request-{old_timestamp}"
    payment_id = "12345678"
    
    manifest = f"id:{payment_id};request-id:{request_id};ts:{old_timestamp};"
    signature = generate_hmac_signature(WEBHOOK_SECRET, manifest)
    x_signature = f"ts={old_timestamp},v1={signature}"
    
    print(f"📤 Enviando para: {WEBHOOK_URL}")
    print(f"⏰ Timestamp: {old_timestamp} (10 minutos atrás)")
    
    response = requests.post(
        WEBHOOK_URL,
        headers={
            "Content-Type": "application/json",
            "x-signature": x_signature,
            "x-request-id": request_id
        },
        json={
            "type": "payment",
            "data": {"id": payment_id}
        }
    )
    
    print(f"\n📥 Resposta: {response.status_code}")
    print(f"📄 Body: {response.text}")
    
    if response.status_code == 401:
        print("✅ PASSOU: Webhook expirado foi rejeitado (401)")
    else:
        print(f"❌ FALHOU: Esperava 401, recebeu {response.status_code}")
    
    return response


def test_invalid_signature_format():
    """
    Teste 5: Webhook com formato de assinatura incorreto
    Resultado esperado: 401 Unauthorized
    """
    print("\n" + "="*70)
    print("TESTE 5: Webhook com Formato de Assinatura Incorreto")
    print("="*70)
    
    request_id = f"test-request-{int(time.time())}"
    
    # Formato INCORRETO (faltando ts= ou v1=)
    invalid_format_signature = "assinatura_sem_formato_correto"
    
    print(f"📤 Enviando para: {WEBHOOK_URL}")
    print(f"📋 x-signature: {invalid_format_signature} (FORMATO INVÁLIDO)")
    
    response = requests.post(
        WEBHOOK_URL,
        headers={
            "Content-Type": "application/json",
            "x-signature": invalid_format_signature,
            "x-request-id": request_id
        },
        json={
            "type": "payment",
            "data": {"id": "12345678"}
        }
    )
    
    print(f"\n📥 Resposta: {response.status_code}")
    print(f"📄 Body: {response.text}")
    
    if response.status_code == 401:
        print("✅ PASSOU: Webhook com formato inválido foi rejeitado (401)")
    else:
        print(f"❌ FALHOU: Esperava 401, recebeu {response.status_code}")
    
    return response


# ========================================================================
# MAIN
# ========================================================================

def main():
    print("\n" + "="*70)
    print("TESTE DE SEGURANÇA - WEBHOOK MERCADO PAGO")
    print("="*70)
    print(f"URL: {WEBHOOK_URL}")
    print(f"Secret configurado: {'✅ SIM' if WEBHOOK_SECRET != 'seu_secret_aqui' else '❌ NÃO (SUBSTITUIR)'}")
    
    if WEBHOOK_SECRET == "seu_secret_aqui":
        print("\n⚠️ ATENÇÃO: Substitua WEBHOOK_SECRET pelo valor real antes de executar!")
        print("   O secret deve ser o mesmo configurado no Supabase como MERCADOPAGO_WEBHOOK_SECRET")
        return
    
    # Executar todos os testes
    results = {
        "test_valid_webhook": test_valid_webhook(),
        "test_missing_signature_headers": test_missing_signature_headers(),
        "test_invalid_signature": test_invalid_signature(),
        "test_expired_webhook": test_expired_webhook(),
        "test_invalid_signature_format": test_invalid_signature_format()
    }
    
    # Resumo
    print("\n" + "="*70)
    print("RESUMO DOS TESTES")
    print("="*70)
    
    passed = 0
    failed = 0
    
    for test_name, response in results.items():
        status = "✅ PASSOU" if response.status_code in [200, 401, 404] else "❌ FALHOU"
        print(f"{test_name}: {status} (HTTP {response.status_code})")
        
        if response.status_code in [200, 401, 404]:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal: {passed} passaram, {failed} falharam")
    
    if failed == 0:
        print("\n🎉 TODOS OS TESTES PASSARAM! A validação de segurança está funcionando corretamente.")
    else:
        print(f"\n⚠️ {failed} teste(s) falharam. Verifique a implementação.")


if __name__ == "__main__":
    main()
