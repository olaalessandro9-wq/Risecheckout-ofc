/**
 * Encrypt Token
 * 
 * Criptografa tokens e dados sensíveis
 * 
 * @category Security
 * @status stub - migrado do deploy
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    
    if (!encryptionKey) {
      console.error('[encrypt-token] ENCRYPTION_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Encryption not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, data } = await req.json();

    if (!action || !data) {
      return new Response(
        JSON.stringify({ error: 'action and data are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(encryptionKey.padEnd(32, '0').slice(0, 32));
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );

    if (action === 'encrypt') {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const dataBytes = encoder.encode(data);
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        dataBytes
      );

      // Combine IV + encrypted data and encode as base64
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      const base64 = btoa(String.fromCharCode(...combined));

      console.log('[encrypt-token] Data encrypted successfully');

      return new Response(
        JSON.stringify({ encrypted: base64 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'decrypt') {
      try {
        const combined = Uint8Array.from(atob(data), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const encryptedData = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          cryptoKey,
          encryptedData
        );

        const decoder = new TextDecoder();
        const decryptedText = decoder.decode(decrypted);

        console.log('[encrypt-token] Data decrypted successfully');

        return new Response(
          JSON.stringify({ decrypted: decryptedText }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (decryptError) {
        console.error('[encrypt-token] Decryption failed:', decryptError);
        return new Response(
          JSON.stringify({ error: 'Decryption failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "encrypt" or "decrypt"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[encrypt-token] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
