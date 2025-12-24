#!/usr/bin/env node

/**
 * Script para gerar uma chave de criptografia segura
 * Uso: node scripts/generate-encryption-key.js
 */

const crypto = require('crypto');

console.log('\n🔐 Gerando chave de criptografia AES-256...\n');

// Gera 32 bytes aleatórios (256 bits)
const key = crypto.randomBytes(32).toString('base64');

console.log('✅ Chave gerada com sucesso!\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('ENCRYPTION_KEY=' + key);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('⚠️  IMPORTANTE:');
console.log('1. Copie esta chave e adicione às variáveis de ambiente das Edge Functions');
console.log('2. NUNCA compartilhe esta chave publicamente');
console.log('3. Guarde-a em um local seguro (ex: gerenciador de senhas)');
console.log('4. Se perder esta chave, todos os tokens criptografados serão inacessíveis\n');

console.log('📝 Como adicionar no Supabase:');
console.log('1. Acesse: https://app.supabase.com/project/_/settings/functions');
console.log('2. Vá em "Edge Function Secrets"');
console.log('3. Adicione uma nova secret:');
console.log('   Nome: ENCRYPTION_KEY');
console.log('   Valor: <cole a chave acima>\n');
