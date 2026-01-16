/**
 * WhatsApp Configuration
 * 
 * Central config file for WhatsApp support settings.
 * RISE Protocol V2 Compliant - No VITE_* env vars in code.
 */

// Número do WhatsApp para suporte (formato E.164 sem +)
// undefined significa que o botão de suporte ficará desabilitado
export const WA_PHONE: string | undefined = undefined;

// Mensagem padrão ao iniciar conversa
export const WA_DEFAULT_MSG = "Olá! Preciso de ajuda com meu checkout. Pode me orientar?";
