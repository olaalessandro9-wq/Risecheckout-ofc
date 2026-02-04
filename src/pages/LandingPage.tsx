/**
 * LandingPage Component - ARQUIVADO
 * 
 * STATUS: INACESSÍVEL - Código preservado para uso futuro
 * DATA: 04 de Fevereiro de 2026
 * 
 * Este componente não está mais roteado. A rota "/" agora
 * redireciona diretamente para "/auth".
 * 
 * Para reativar: restaurar a rota em publicRoutes.tsx
 * 
 * ---
 * 
 * NOTA ORIGINAL: Este componente tinha ISENÇÃO do RISE Protocol V3
 * Critério único: Fidelidade 100% ao design WordPress original
 * 
 * Renderiza a landing page do WordPress via iframe
 * para garantir 100% de fidelidade visual (CSS, fontes, animações).
 */

import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

export default function LandingPage() {
  useEffect(() => {
    // Remover scroll do body quando iframe está ativo
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Rise Community - A plataforma de checkout mais completa do Brasil</title>
        <meta name="description" content="Venda seus produtos digitais com criativos. Transforme cada acesso em pagamento com um checkout personalizável, rápido e otimizado para escalar." />
      </Helmet>
      
      <iframe
        src="/landing/index.html"
        title="RiseCheckout Landing Page"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          zIndex: 999999
        }}
      />
    </>
  );
}
