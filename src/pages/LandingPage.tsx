/**
 * LandingPage Component
 * 
 * NOTA: Este componente tem ISENÇÃO do RISE Protocol V3
 * Critério único: Fidelidade 100% ao design WordPress original
 * 
 * Carrega e renderiza a landing page migrada do WordPress/Elementor
 * mantendo 100% da fidelidade visual.
 */

import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

export default function LandingPage() {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar HTML do WordPress
    fetch('/landing-wordpress.html')
      .then(response => response.text())
      .then(html => {
        setHtmlContent(html);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Erro ao carregar landing page:', error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!htmlContent) return;

    // Executar scripts do WordPress após renderização
    const scripts = document.querySelectorAll('.wordpress-landing script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [htmlContent]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0e27]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00d9ff]" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Rise Community - A plataforma de checkout mais completa do Brasil</title>
        <meta name="description" content="Venda seus produtos digitais com criativos. Transforme cada acesso em pagamento com um checkout personalizável, rápido e otimizado para escalar." />
      </Helmet>
      
      <div 
        className="wordpress-landing"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{
          width: '100%',
          minHeight: '100vh',
          overflow: 'auto'
        }}
      />
    </>
  );
}
