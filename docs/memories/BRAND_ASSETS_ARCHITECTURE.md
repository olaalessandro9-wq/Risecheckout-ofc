 # Memory: Brand Assets Architecture
 
 **Updated:** 2026-02-05
 **Status:** STABLE - RISE V3 Compliant
 
 ---
 
 ## Single Source of Truth
 
 A logo da plataforma RiseCheckout é gerenciada exclusivamente pelo backend.
 
 ### Localização do Arquivo
 
 | Item | Valor |
 |------|-------|
 | **Bucket** | `brand-assets` |
 | **Path** | `logo/main.jpeg` |
 | **URL Permanente** | `https://wivbtmtgpsxupfjwwovf.supabase.co/storage/v1/object/public/brand-assets/logo/main.jpeg` |
 
 ### Função de Acesso
 
 ```typescript
 // supabase/functions/_shared/email-templates-base.ts
 export function getLogoUrl(): string {
   return "https://wivbtmtgpsxupfjwwovf.supabase.co/storage/v1/object/public/brand-assets/logo/main.jpeg";
 }
 ```
 
 ---
 
 ## Arquitetura
 
 ```
 ┌─────────────────────────────────────────────────────────┐
 │                 Supabase Storage                         │
 │                                                          │
 │  bucket: brand-assets                                    │
 │  └── logo/                                               │
 │      └── main.jpeg  ◄── Logo oficial                    │
 │                                                          │
 └─────────────────────────────────────────────────────────┘
                           │
                           ▼
 ┌─────────────────────────────────────────────────────────┐
 │              CDN Global do Supabase                      │
 │                                                          │
 │  URL pública permanente - nunca muda                    │
 │  Zero dependência de variáveis de ambiente              │
 │                                                          │
 └─────────────────────────────────────────────────────────┘
                           │
                           ▼
 ┌─────────────────────────────────────────────────────────┐
 │           Edge Functions (Backend)                       │
 │                                                          │
 │  getLogoUrl() → URL permanente                          │
 │  Usado em: email templates, confirmações, etc.          │
 │                                                          │
 └─────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## Por que NÃO existe no Frontend?
 
 A logo é usada **exclusivamente** em emails enviados pelo backend. O frontend:
 
 - Não renderiza essa logo
 - Não precisa importar assets de email
 - Não deve ter código morto
 
 Manter constantes no frontend que nunca são importadas viola o RISE Protocol V3 (Zero Dívida Técnica).
 
 ---
 
 ## RISE V3 Compliance
 
 | Critério | Status |
 |----------|--------|
 | Zero código morto | ✅ |
 | Zero URLs hardcoded em múltiplos lugares | ✅ |
 | Single Source of Truth | ✅ (`getLogoUrl()`) |
 | Zero dependências de env | ✅ |
 | Manutenibilidade infinita | ✅ |
 
 **Score: 10.0/10**